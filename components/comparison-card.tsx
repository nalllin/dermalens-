import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResultView } from "@/lib/types";

export function ComparisonCard({
  comparison,
}: {
  comparison: ResultView["comparison"];
}) {
  if (!comparison) {
    return null;
  }

  const variant =
    comparison.trend === "improved"
      ? "teal"
      : comparison.trend === "worse"
        ? "rose"
        : "blue";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{comparison.trend}</Badge>
          <span className="text-sm text-slate-500">Weekly comparison</span>
        </div>
        <CardTitle className="text-lg">Progress update</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          {comparison.change_summary}
        </div>
        <div className="rounded-3xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-900">
          {comparison.recommendation}
        </div>
      </CardContent>
    </Card>
  );
}

