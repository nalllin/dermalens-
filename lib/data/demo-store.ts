import "server-only";

import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import templateJson from "@/data/demo-template.json";
import type { AppUser, CreateAnalysisResult, SaveAnalysisInput } from "@/lib/types";

interface DemoDatabase {
  users: AppUser[];
  cases: CreateAnalysisResult["case"][];
  case_entries: CreateAnalysisResult["entry"][];
  uploaded_images: CreateAnalysisResult["image"][];
  ai_assessments: CreateAnalysisResult["assessment"][];
  progress_summaries: NonNullable<CreateAnalysisResult["progress"]>[];
  reminders: CreateAnalysisResult["reminder"][];
}

const dbPath = path.join(process.cwd(), "data", "demo-db.json");

function cloneTemplate(): DemoDatabase {
  return structuredClone(templateJson) as DemoDatabase;
}

export async function readDemoDatabase(): Promise<DemoDatabase> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as DemoDatabase;
  } catch {
    return cloneTemplate();
  }
}

export async function writeDemoDatabase(database: DemoDatabase) {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(database, null, 2));
}

export async function resetDemoDatabase() {
  const database = cloneTemplate();
  await writeDemoDatabase(database);
  return database;
}

export async function findDemoUserById(userId: string) {
  const database = await readDemoDatabase();
  return database.users.find((user) => user.id === userId) ?? null;
}

export async function findOrCreateDemoUser({
  email,
  name,
}: {
  email: string;
  name?: string;
}) {
  const database = await readDemoDatabase();
  const existing = database.users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    return existing;
  }

  const user: AppUser = {
    id: randomUUID(),
    email,
    name: name?.trim() || email.split("@")[0] || "Demo user",
    created_at: new Date().toISOString(),
  };

  database.users.push(user);
  await writeDemoDatabase(database);

  return user;
}

export async function saveDemoAnalysis(input: SaveAnalysisInput) {
  const database = await readDemoDatabase();
  const now = new Date().toISOString();

  let caseRecord = input.case_id
    ? database.cases.find(
        (currentCase) =>
          currentCase.id === input.case_id && currentCase.user_id === input.user_id,
      ) ?? null
    : null;

  if (!caseRecord) {
    caseRecord = {
      id: randomUUID(),
      user_id: input.user_id,
      title: input.title?.trim() || input.assessment.likely_issue,
      concern_type: input.concern_type,
      area: input.area,
      created_at: now,
      status: "active",
    };
    database.cases.push(caseRecord);
  } else {
    caseRecord.concern_type = input.concern_type;
    caseRecord.area = input.area;
  }

  const entry = {
    id: randomUUID(),
    case_id: caseRecord.id,
    symptoms_json: input.symptoms_json,
    skin_type: input.skin_type,
    duration_text: input.duration_text,
    current_products_text: input.current_products_text,
    notes: input.notes,
    created_at: now,
  };

  const image = {
    id: randomUUID(),
    case_entry_id: entry.id,
    image_url: input.image_url,
    captured_at: now,
    image_quality_score: input.image_quality_score,
  };

  const assessment = {
    id: randomUUID(),
    case_entry_id: entry.id,
    created_at: now,
    ...input.assessment,
  };

  database.case_entries.push(entry);
  database.uploaded_images.push(image);
  database.ai_assessments.push(assessment);

  let progress = null;

  if (input.progress) {
    progress = {
      id: randomUUID(),
      case_id: caseRecord.id,
      current_entry_id: entry.id,
      previous_entry_id: input.progress.previous_entry_id,
      trend: input.progress.trend,
      change_summary: input.progress.change_summary,
      recommendation: input.progress.recommendation,
      created_at: now,
    };

    database.progress_summaries.push(progress);
  }

  let reminder =
    database.reminders.find((item) => item.case_id === caseRecord.id) ?? null;

  if (!reminder) {
    reminder = {
      id: randomUUID(),
      case_id: caseRecord.id,
      frequency_days: 7,
      next_send_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      enabled: true,
      channel: "email",
    };

    database.reminders.push(reminder);
  }

  await writeDemoDatabase(database);

  return { case: caseRecord, entry, image, assessment, progress, reminder };
}

