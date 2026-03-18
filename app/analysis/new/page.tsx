import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewAnalysisForm } from "@/components/forms/new-analysis-form";
import { requireViewer } from "@/lib/auth";
import { getDashboardCases } from "@/lib/data/repository";

export default async function NewAnalysisPage({
  searchParams,
}: {
  searchParams?: { caseId?: string };
}) {
  const { user } = await requireViewer();
  const cases = await getDashboardCases(user.id);
  const selectedCase =
    searchParams?.caseId
      ? cases.find((item) => item.case.id === searchParams.caseId) ?? null
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Badge variant="teal">
              {selectedCase ? "Weekly follow-up" : "New case analysis"}
            </Badge>
            <Badge variant="default">Short output only</Badge>
          </div>
          <CardTitle className="text-3xl">
            {selectedCase ? `Upload an update for ${selectedCase.case.title}` : "Create a new DermaLens analysis"}
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">
            Upload the current photo, keep intake brief, and DermaLens will return a concise result card with routines, treatment options, and progress status when a previous entry exists.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>

      <NewAnalysisForm cases={cases} selectedCase={selectedCase} />
    </div>
  );
}

