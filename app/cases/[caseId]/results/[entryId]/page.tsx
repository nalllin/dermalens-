import Link from "next/link";
import { notFound } from "next/navigation";

import { ComparisonCard } from "@/components/comparison-card";
import { ResultCard } from "@/components/result-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { getResultView } from "@/lib/data/repository";

export default async function ResultPage({
  params,
}: {
  params: { caseId: string; entryId: string };
}) {
  const { user } = await requireViewer();
  const result = await getResultView(user.id, params.caseId, params.entryId);

  if (!result || !result.current?.assessment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="teal">Results</Badge>
              {result.previous ? <Badge variant="blue">Comparison available</Badge> : null}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {result.case.title}
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href={`/cases/${result.case.id}/timeline`}>Open timeline</Link>
            </Button>
            <Button asChild variant="teal">
              <Link href={`/analysis/new?caseId=${result.case.id}`}>Upload next update</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ResultCard assessment={result.current.assessment} />
      <ComparisonCard comparison={result.comparison} />
    </div>
  );
}

