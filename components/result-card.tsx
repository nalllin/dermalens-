import { ConfidenceBadge } from "@/components/confidence-badge";
import { MedicationSuggestionCard } from "@/components/medication-suggestion-card";
import { RoutineCard } from "@/components/routine-card";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIAssessmentRecord } from "@/lib/types";

export function ResultCard({
  assessment,
  savedLabel = "Saved to case history",
}: {
  assessment: AIAssessmentRecord;
  savedLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={assessment.severity} />
          <ConfidenceBadge confidence={assessment.confidence} />
          <Badge variant="default">{savedLabel}</Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{assessment.likely_issue}</CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">
            {assessment.reason_summary}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <MedicationSuggestionCard
            title="Medication options"
            items={assessment.suggested_medications}
          />
          <MedicationSuggestionCard
            title="Creams and care"
            items={assessment.suggested_creams}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <RoutineCard title="AM routine" steps={assessment.am_routine} />
          <RoutineCard title="PM routine" steps={assessment.pm_routine} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Observation window
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {assessment.observation_window}
            </p>
          </div>
          <div className="rounded-3xl border border-teal-100 bg-teal-50/60 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-teal-700">
              Escalation note
            </p>
            <p className="mt-3 text-sm font-medium text-teal-900">
              {assessment.escalation_note}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

