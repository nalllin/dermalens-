import { notFound } from "next/navigation";

import { CaseHistoryGallery } from "@/components/case-history-gallery";
import { ProgressTimeline } from "@/components/progress-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { getCaseDetails } from "@/lib/data/repository";
import { formatDateLabel } from "@/lib/utils";

export default async function TimelinePage({
  params,
}: {
  params: { caseId: string };
}) {
  const { user } = await requireViewer();
  const details = await getCaseDetails(user.id, params.caseId);

  if (!details) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="teal">Progress Timeline</Badge>
            <Badge variant="default">
              Next reminder {details.reminder ? formatDateLabel(details.reminder.next_send_at) : "not set"}
            </Badge>
          </div>
          <CardTitle className="text-3xl">{details.case.title}</CardTitle>
          <CardDescription>
            Review every saved upload, compare weekly changes, and keep follow-up cadence consistent.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>

      <ProgressTimeline caseId={details.case.id} entries={details.entries} />
      <CaseHistoryGallery entries={details.entries} />
    </div>
  );
}

