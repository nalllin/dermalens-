import { z } from "zod";

export const baseAnalysisSchema = z.object({
  likely_issue: z.string().min(3).max(120),
  confidence: z.number().min(0).max(1),
  severity: z.enum(["mild", "moderate", "severe"]),
  reason_summary: z.string().min(10).max(220),
});

export const treatmentSuggestionSchema = z.object({
  suggested_medications: z.array(z.string().min(2).max(80)).min(1).max(4),
  suggested_creams: z.array(z.string().min(2).max(80)).min(1).max(4),
  am_routine: z.array(z.string().min(2).max(60)).min(2).max(5),
  pm_routine: z.array(z.string().min(2).max(60)).min(2).max(5),
  observation_window: z.string().min(3).max(60),
  escalation_note: z.string().min(8).max(180),
});

export const fullAssessmentSchema = baseAnalysisSchema.merge(
  treatmentSuggestionSchema,
);

export const progressComparisonSchema = z.object({
  trend: z.enum(["improved", "stable", "worse"]),
  change_summary: z.string().min(8).max(180),
  recommendation: z.string().min(8).max(140),
});

export type BaseAnalysisOutput = z.infer<typeof baseAnalysisSchema>;
export type TreatmentSuggestionOutput = z.infer<
  typeof treatmentSuggestionSchema
>;
export type FullAssessmentOutput = z.infer<typeof fullAssessmentSchema>;
export type ProgressComparisonOutput = z.infer<
  typeof progressComparisonSchema
>;

