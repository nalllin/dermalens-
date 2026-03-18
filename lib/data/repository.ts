import "server-only";

import { addDays, isBefore } from "date-fns";

import {
  findOrCreateDemoUser,
  readDemoDatabase,
  saveDemoAnalysis,
  writeDemoDatabase,
} from "@/lib/data/demo-store";
import { shouldUseDemoData } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  AIAssessmentRecord,
  AppUser,
  CaseDetails,
  CaseEntryRecord,
  DashboardCase,
  ProgressSummaryRecord,
  ReminderJobResult,
  ReminderRecord,
  ResultView,
  SaveAnalysisInput,
  UploadedImageRecord,
} from "@/lib/types";
import { getAppUrl } from "@/lib/env";
import { sendReminderEmail } from "@/lib/email";

type AssessmentRowLike = {
  id: string;
  case_entry_id: string;
  likely_issue: string;
  confidence: number | string;
  severity: AIAssessmentRecord["severity"];
  reason_summary: string;
  suggested_medications?: string[];
  suggested_medications_json?: string[];
  suggested_creams?: string[];
  suggested_creams_json?: string[];
  am_routine?: string[];
  am_routine_json?: string[];
  pm_routine?: string[];
  pm_routine_json?: string[];
  observation_window: string;
  escalation_note: string;
  created_at: string;
};

function normalizeAssessmentRow(row: AssessmentRowLike): AIAssessmentRecord {
  return {
    id: row.id,
    case_entry_id: row.case_entry_id,
    likely_issue: row.likely_issue,
    confidence: Number(row.confidence),
    severity: row.severity,
    reason_summary: row.reason_summary,
    suggested_medications:
      row.suggested_medications ?? row.suggested_medications_json ?? [],
    suggested_creams: row.suggested_creams ?? row.suggested_creams_json ?? [],
    am_routine: row.am_routine ?? row.am_routine_json ?? [],
    pm_routine: row.pm_routine ?? row.pm_routine_json ?? [],
    observation_window: row.observation_window,
    escalation_note: row.escalation_note,
    created_at: row.created_at,
  };
}

function toAssessmentInsertPayload(assessment: SaveAnalysisInput["assessment"]) {
  return {
    likely_issue: assessment.likely_issue,
    confidence: assessment.confidence,
    severity: assessment.severity,
    reason_summary: assessment.reason_summary,
    suggested_medications_json: assessment.suggested_medications,
    suggested_creams_json: assessment.suggested_creams,
    am_routine_json: assessment.am_routine,
    pm_routine_json: assessment.pm_routine,
    observation_window: assessment.observation_window,
    escalation_note: assessment.escalation_note,
  };
}

function composeCaseDetails({
  cases,
  entries,
  images,
  assessments,
  progressSummaries,
  reminders,
}: {
  cases: CaseDetails["case"][];
  entries: CaseEntryRecord[];
  images: UploadedImageRecord[];
  assessments: AIAssessmentRecord[];
  progressSummaries: ProgressSummaryRecord[];
  reminders: ReminderRecord[];
}): CaseDetails[] {
  const imagesByEntry = new Map(images.map((image) => [image.case_entry_id, image]));
  const assessmentsByEntry = new Map(
    assessments.map((assessment) => [assessment.case_entry_id, assessment]),
  );
  const progressByEntry = new Map(
    progressSummaries.map((progress) => [progress.current_entry_id, progress]),
  );
  const remindersByCase = new Map(reminders.map((reminder) => [reminder.case_id, reminder]));

  return [...cases]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .map((caseRecord) => {
      const caseEntries = entries
        .filter((entry) => entry.case_id === caseRecord.id)
        .sort(
          (left, right) =>
            new Date(right.created_at).getTime() -
            new Date(left.created_at).getTime(),
        )
        .map((entry) => ({
          entry,
          image: imagesByEntry.get(entry.id) ?? null,
          assessment: assessmentsByEntry.get(entry.id) ?? null,
          progress: progressByEntry.get(entry.id) ?? null,
        }));

      const latest = caseEntries[0] ?? null;
      const latestProgress =
        caseEntries.find((item) => item.progress)?.progress ?? null;

      return {
        case: caseRecord,
        entries: caseEntries,
        latest_entry: latest?.entry ?? null,
        latest_image: latest?.image ?? null,
        latest_assessment: latest?.assessment ?? null,
        latest_progress: latestProgress,
        reminder: remindersByCase.get(caseRecord.id) ?? null,
      };
    });
}

export async function ensureDemoUser(email: string, name?: string) {
  return findOrCreateDemoUser({ email, name });
}

export async function getUserProfile(userId: string): Promise<AppUser | null> {
  if (shouldUseDemoData()) {
    const database = await readDemoDatabase();
    return database.users.find((user) => user.id === userId) ?? null;
  }

  const client = createSupabaseServiceClient();
  const { data } = await client.from("users").select("*").eq("id", userId).maybeSingle();

  return data ?? null;
}

export async function upsertUserProfile(user: AppUser) {
  if (shouldUseDemoData()) {
    return ensureDemoUser(user.email, user.name);
  }

  const client = createSupabaseServiceClient();
  await client.from("users").upsert(user, { onConflict: "id" });
  return user;
}

export async function getDashboardCases(userId: string): Promise<DashboardCase[]> {
  if (shouldUseDemoData()) {
    const database = await readDemoDatabase();
    return composeCaseDetails({
      cases: database.cases.filter((item) => item.user_id === userId),
      entries: database.case_entries,
      images: database.uploaded_images,
      assessments: database.ai_assessments,
      progressSummaries: database.progress_summaries,
      reminders: database.reminders,
    }).map((item) => {
      const { entries, ...dashboardCase } = item;
      void entries;
      return dashboardCase;
    });
  }

  const client = createSupabaseServiceClient();
  const { data: rawCases } = await client
    .from("cases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const cases = rawCases ?? [];
  const caseIds = cases.map((item) => item.id);

  if (!caseIds.length) {
    return [];
  }

  const { data: rawEntries } = await client
    .from("case_entries")
    .select("*")
    .in("case_id", caseIds);
  const entries = rawEntries ?? [];
  const entryIds = entries.map((item) => item.id);
  const [
    { data: rawImages },
    { data: rawAssessments },
    { data: rawProgress },
    { data: rawReminders },
  ] =
    await Promise.all([
      client.from("uploaded_images").select("*").in("case_entry_id", entryIds),
      client.from("ai_assessments").select("*").in("case_entry_id", entryIds),
      client.from("progress_summaries").select("*").in("case_id", caseIds),
      client.from("reminders").select("*").in("case_id", caseIds),
    ]);
  const images = rawImages ?? [];
  const assessments = (rawAssessments ?? []).map(normalizeAssessmentRow);
  const progress = rawProgress ?? [];
  const reminders = rawReminders ?? [];

  return composeCaseDetails({
    cases,
    entries,
    images,
    assessments,
    progressSummaries: progress,
    reminders,
  }).map((item) => {
    const { entries: timelineEntries, ...dashboardCase } = item;
    void timelineEntries;
    return dashboardCase;
  });
}

export async function getCaseDetails(
  userId: string,
  caseId: string,
): Promise<CaseDetails | null> {
  if (shouldUseDemoData()) {
    const database = await readDemoDatabase();
    return (
      composeCaseDetails({
        cases: database.cases.filter(
          (item) => item.user_id === userId && item.id === caseId,
        ),
        entries: database.case_entries,
        images: database.uploaded_images,
        assessments: database.ai_assessments,
        progressSummaries: database.progress_summaries,
        reminders: database.reminders,
      })[0] ?? null
    );
  }

  const client = createSupabaseServiceClient();
  const { data: caseRecord } = await client
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!caseRecord) {
    return null;
  }

  const { data: rawEntries } = await client
    .from("case_entries")
    .select("*")
    .eq("case_id", caseId);
  const entries = rawEntries ?? [];
  const entryIds = entries.map((item) => item.id);
  const [
    { data: rawImages },
    { data: rawAssessments },
    { data: rawProgress },
    { data: rawReminders },
  ] =
    await Promise.all([
      client.from("uploaded_images").select("*").in("case_entry_id", entryIds),
      client.from("ai_assessments").select("*").in("case_entry_id", entryIds),
      client.from("progress_summaries").select("*").eq("case_id", caseId),
      client.from("reminders").select("*").eq("case_id", caseId),
    ]);
  const images = rawImages ?? [];
  const assessments = (rawAssessments ?? []).map(normalizeAssessmentRow);
  const progress = rawProgress ?? [];
  const reminders = rawReminders ?? [];

  return (
    composeCaseDetails({
      cases: [caseRecord],
      entries,
      images,
      assessments,
      progressSummaries: progress,
      reminders,
    })[0] ?? null
  );
}

export async function getResultView(userId: string, caseId: string, entryId: string) {
  const details = await getCaseDetails(userId, caseId);

  if (!details) {
    return null;
  }

  const currentIndex = details.entries.findIndex((item) => item.entry.id === entryId);
  const current = currentIndex >= 0 ? details.entries[currentIndex] : null;
  const previous = currentIndex >= 0 ? details.entries[currentIndex + 1] ?? null : null;
  const comparison = current?.progress ?? null;

  const result: ResultView = {
    case: details.case,
    current,
    previous,
    comparison,
    reminder: details.reminder,
  };

  return result;
}

export async function saveAnalysis(input: SaveAnalysisInput) {
  if (shouldUseDemoData()) {
    return saveDemoAnalysis(input);
  }

  const client = createSupabaseServiceClient();
  const now = new Date().toISOString();

  let caseRecord = null;

  if (input.case_id) {
    const { data } = await client
      .from("cases")
      .select("*")
      .eq("id", input.case_id)
      .eq("user_id", input.user_id)
      .maybeSingle();
    caseRecord = data;
  }

  if (!caseRecord) {
    const { data } = await client
      .from("cases")
      .insert({
        user_id: input.user_id,
        title: input.title?.trim() || input.assessment.likely_issue,
        concern_type: input.concern_type,
        area: input.area,
        created_at: now,
        status: "active",
      })
      .select("*")
      .single();

    if (!data) {
      throw new Error("Unable to create case.");
    }

    caseRecord = data;
  } else {
    const { data } = await client
      .from("cases")
      .update({
        concern_type: input.concern_type,
        area: input.area,
        status: "active",
      })
      .eq("id", caseRecord.id)
      .select("*")
      .single();

    if (!data) {
      throw new Error("Unable to update case.");
    }

    caseRecord = data;
  }

  const { data: entry } = await client
    .from("case_entries")
    .insert({
      case_id: caseRecord.id,
      symptoms_json: input.symptoms_json,
      skin_type: input.skin_type,
      duration_text: input.duration_text,
      current_products_text: input.current_products_text,
      notes: input.notes,
      created_at: now,
    })
    .select("*")
    .single();

  if (!entry) {
    throw new Error("Unable to create case entry.");
  }

  const { data: image } = await client
    .from("uploaded_images")
    .insert({
      case_entry_id: entry.id,
      image_url: input.image_url,
      captured_at: now,
      image_quality_score: input.image_quality_score,
    })
    .select("*")
    .single();

  if (!image) {
    throw new Error("Unable to create uploaded image.");
  }

  const { data: rawAssessment } = await client
    .from("ai_assessments")
    .insert({
      case_entry_id: entry.id,
      created_at: now,
      ...toAssessmentInsertPayload(input.assessment),
    })
    .select("*")
    .single();
  const assessment = rawAssessment
    ? normalizeAssessmentRow(rawAssessment)
    : null;

  if (!assessment) {
    throw new Error("Unable to create assessment.");
  }

  let progress = null;

  if (input.progress) {
    const { data } = await client
      .from("progress_summaries")
      .insert({
        case_id: caseRecord.id,
        current_entry_id: entry.id,
        previous_entry_id: input.progress.previous_entry_id,
        trend: input.progress.trend,
        change_summary: input.progress.change_summary,
        recommendation: input.progress.recommendation,
        created_at: now,
      })
      .select("*")
      .single();

    if (!data) {
      throw new Error("Unable to create progress summary.");
    }

    progress = data;
  }

  let { data: reminder } = await client
    .from("reminders")
    .select("*")
    .eq("case_id", caseRecord.id)
    .maybeSingle();

  if (!reminder) {
    const { data } = await client
      .from("reminders")
      .insert({
        case_id: caseRecord.id,
        frequency_days: 7,
        next_send_at: addDays(new Date(), 7).toISOString(),
        enabled: true,
        channel: "email",
      })
      .select("*")
      .single();
    if (!data) {
      throw new Error("Unable to create reminder.");
    }
    reminder = data;
  }

  return { case: caseRecord, entry, image, assessment, progress, reminder };
}

export async function updateReminder({
  userId,
  reminderId,
  enabled,
  frequencyDays,
}: {
  userId: string;
  reminderId: string;
  enabled: boolean;
  frequencyDays: number;
}) {
  const nextSendAt = addDays(new Date(), frequencyDays).toISOString();

  if (shouldUseDemoData()) {
    const database = await readDemoDatabase();
    const reminder = database.reminders.find((item) => item.id === reminderId);

    if (!reminder) {
      throw new Error("Reminder not found.");
    }

    const relatedCase = database.cases.find((item) => item.id === reminder.case_id);

    if (!relatedCase || relatedCase.user_id !== userId) {
      throw new Error("Reminder access denied.");
    }

    reminder.enabled = enabled;
    reminder.frequency_days = frequencyDays;
    reminder.next_send_at = nextSendAt;

    await writeDemoDatabase(database);

    return reminder;
  }

  const client = createSupabaseServiceClient();
  const { data: reminder } = await client
    .from("reminders")
    .select("*")
    .eq("id", reminderId)
    .maybeSingle();

  if (!reminder) {
    throw new Error("Reminder not found.");
  }

  const { data: caseRecord } = await client
    .from("cases")
    .select("*")
    .eq("id", reminder.case_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!caseRecord) {
    throw new Error("Reminder access denied.");
  }

  const { data: updated } = await client
    .from("reminders")
    .update({
      enabled,
      frequency_days: frequencyDays,
      next_send_at: nextSendAt,
    })
    .eq("id", reminderId)
    .select("*")
    .single();

  if (!updated) {
    throw new Error("Unable to update reminder.");
  }

  return updated;
}

export async function runReminderJobs(): Promise<ReminderJobResult> {
  const now = new Date();
  let processed = 0;
  let sent = 0;
  let skipped = 0;

  if (shouldUseDemoData()) {
    const database = await readDemoDatabase();
    const dueReminders = database.reminders.filter(
      (reminder) => reminder.enabled && isBefore(new Date(reminder.next_send_at), now),
    );

    for (const reminder of dueReminders) {
      processed += 1;
      const caseRecord = database.cases.find((item) => item.id === reminder.case_id);
      const user = caseRecord
        ? database.users.find((item) => item.id === caseRecord.user_id)
        : null;

      if (!caseRecord || !user) {
        skipped += 1;
        continue;
      }

      await sendReminderEmail({
        to: user.email,
        caseTitle: caseRecord.title,
        uploadUrl: `${getAppUrl()}/analysis/new?caseId=${caseRecord.id}`,
      });

      reminder.next_send_at = addDays(now, reminder.frequency_days).toISOString();
      sent += 1;
    }

    await writeDemoDatabase(database);

    return { processed, sent, skipped };
  }

  const client = createSupabaseServiceClient();
  const { data: rawReminders } = await client
    .from("reminders")
    .select("*")
    .eq("enabled", true)
    .lte("next_send_at", now.toISOString());
  const reminders = rawReminders ?? [];

  for (const reminder of reminders) {
    processed += 1;

    const { data: caseRecord } = await client
      .from("cases")
      .select("*")
      .eq("id", reminder.case_id)
      .maybeSingle();
    const user = caseRecord
      ? await getUserProfile(caseRecord.user_id)
      : null;

    if (!caseRecord || !user) {
      skipped += 1;
      continue;
    }

    await sendReminderEmail({
      to: user.email,
      caseTitle: caseRecord.title,
      uploadUrl: `${getAppUrl()}/analysis/new?caseId=${caseRecord.id}`,
    });

    await client
      .from("reminders")
      .update({
        next_send_at: addDays(now, reminder.frequency_days).toISOString(),
      })
      .eq("id", reminder.id);
    sent += 1;
  }

  return { processed, sent, skipped };
}
