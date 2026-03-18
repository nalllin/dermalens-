/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { ConfidenceBadge } from "@/components/confidence-badge";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineEntry } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";

export function ProgressTimeline({
  caseId,
  entries,
}: {
  caseId: string;
  entries: TimelineEntry[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((item) => (
          <div
            key={item.entry.id}
            className="grid gap-4 rounded-[26px] border border-slate-200 p-4 lg:grid-cols-[160px_1fr]"
          >
            <div>
              {item.image ? (
                <img
                  src={item.image.image_url}
                  alt={item.assessment?.likely_issue ?? "Progress entry"}
                  className="aspect-[4/3] w-full rounded-[20px] object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] bg-slate-100 text-sm text-slate-400">
                  No image
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{formatDateLabel(item.entry.created_at)}</Badge>
                {item.assessment ? (
                  <>
                    <SeverityBadge severity={item.assessment.severity} />
                    <ConfidenceBadge confidence={item.assessment.confidence} />
                  </>
                ) : null}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  {item.assessment?.likely_issue ?? "Pending review"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.assessment?.reason_summary ?? "Assessment not available."}
                </p>
              </div>
              {item.progress ? (
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{item.progress.trend}</p>
                  <p className="mt-1">{item.progress.change_summary}</p>
                </div>
              ) : null}
              <Link
                href={`/cases/${caseId}/results/${item.entry.id}`}
                className="inline-flex text-sm font-medium text-teal-700 transition hover:text-teal-800"
              >
                View result
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
