/* eslint-disable @next/next/no-img-element */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/utils";
import type { TimelineEntry } from "@/lib/types";

export function CaseHistoryGallery({ entries }: { entries: TimelineEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case history gallery</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(({ entry, image, assessment }) => (
          <div key={entry.id} className="rounded-[24px] border border-slate-200 p-3">
            {image ? (
              <img
                src={image.image_url}
                alt={assessment?.likely_issue ?? "Case history image"}
                className="aspect-[4/3] w-full rounded-[20px] object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] bg-slate-100 text-sm text-slate-400">
                No image
              </div>
            )}
            <div className="space-y-1 px-1 pt-3">
              <p className="text-sm font-medium text-slate-900">
                {assessment?.likely_issue ?? "Pending review"}
              </p>
              <p className="text-xs text-slate-500">{formatDateLabel(entry.created_at)}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
