export const concernTypes = [
  "acne",
  "rash",
  "pigmentation",
  "dandruff",
  "hair_fall",
  "irritation",
  "other",
] as const;

export const symptomOptions = [
  "itching",
  "pain",
  "redness",
  "flaking",
  "pus",
  "dryness",
  "hair_shedding",
] as const;

export const skinTypes = [
  "oily",
  "dry",
  "combination",
  "sensitive",
  "unknown",
] as const;

export const severityLevels = ["mild", "moderate", "severe"] as const;
export const trendLevels = ["improved", "stable", "worse"] as const;
export const supportedAreas = [
  "face",
  "scalp",
  "beard",
  "hairline",
  "body_patch",
  "other",
] as const;

export type ConcernType = (typeof concernTypes)[number];
export type SymptomOption = (typeof symptomOptions)[number];
export type SkinType = (typeof skinTypes)[number];
export type Severity = (typeof severityLevels)[number];
export type Trend = (typeof trendLevels)[number];
export type SupportedArea = (typeof supportedAreas)[number];

export interface AppUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface CaseRecord {
  id: string;
  user_id: string;
  title: string;
  concern_type: ConcernType;
  area: SupportedArea;
  created_at: string;
  status: "active" | "monitoring" | "closed";
}

export interface CaseEntryRecord {
  id: string;
  case_id: string;
  symptoms_json: SymptomOption[];
  skin_type: SkinType;
  duration_text: string;
  current_products_text: string;
  notes: string;
  created_at: string;
}

export interface UploadedImageRecord {
  id: string;
  case_entry_id: string;
  image_url: string;
  captured_at: string;
  image_quality_score: number;
}

export interface BaseAssessmentFields {
  likely_issue: string;
  confidence: number;
  severity: Severity;
  reason_summary: string;
}

export interface TreatmentFields {
  suggested_medications: string[];
  suggested_creams: string[];
  am_routine: string[];
  pm_routine: string[];
  observation_window: string;
  escalation_note: string;
}

export interface AIAssessmentRecord
  extends BaseAssessmentFields,
    TreatmentFields {
  id: string;
  case_entry_id: string;
  created_at: string;
}

export interface ProgressSummaryRecord {
  id: string;
  case_id: string;
  current_entry_id: string;
  previous_entry_id: string;
  trend: Trend;
  change_summary: string;
  recommendation: string;
  created_at: string;
}

export interface ReminderRecord {
  id: string;
  case_id: string;
  frequency_days: number;
  next_send_at: string;
  enabled: boolean;
  channel: "email";
}

export interface DashboardCase {
  case: CaseRecord;
  latest_entry: CaseEntryRecord | null;
  latest_image: UploadedImageRecord | null;
  latest_assessment: AIAssessmentRecord | null;
  latest_progress: ProgressSummaryRecord | null;
  reminder: ReminderRecord | null;
}

export interface TimelineEntry {
  entry: CaseEntryRecord;
  image: UploadedImageRecord | null;
  assessment: AIAssessmentRecord | null;
  progress: ProgressSummaryRecord | null;
}

export interface CaseDetails extends DashboardCase {
  entries: TimelineEntry[];
}

export interface ResultView {
  case: CaseRecord;
  current: TimelineEntry | null;
  previous: TimelineEntry | null;
  comparison: ProgressSummaryRecord | null;
  reminder: ReminderRecord | null;
}

export interface AuthSession {
  user: AppUser | null;
  mode: "demo" | "supabase";
}

export interface SaveAnalysisInput {
  user_id: string;
  case_id?: string;
  title?: string;
  concern_type: ConcernType;
  area: SupportedArea;
  duration_text: string;
  symptoms_json: SymptomOption[];
  skin_type: SkinType;
  current_products_text: string;
  notes: string;
  image_url: string;
  image_quality_score: number;
  assessment: BaseAssessmentFields & TreatmentFields;
  progress?: {
    previous_entry_id: string;
    trend: Trend;
    change_summary: string;
    recommendation: string;
  };
}

export interface CreateAnalysisResult {
  case: CaseRecord;
  entry: CaseEntryRecord;
  image: UploadedImageRecord;
  assessment: AIAssessmentRecord;
  progress: ProgressSummaryRecord | null;
  reminder: ReminderRecord;
}

export interface ReminderJobResult {
  processed: number;
  sent: number;
  skipped: number;
}

export interface IntakeFormPayload {
  caseId?: string;
  title?: string;
  concernType: ConcernType;
  area: SupportedArea;
  duration: string;
  symptoms: SymptomOption[];
  skinType: SkinType;
  currentProducts: string;
  notes: string;
}

