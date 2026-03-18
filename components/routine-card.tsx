import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoutineCard({
  title,
  steps,
}: {
  title: string;
  steps: string[];
}) {
  return (
    <Card className="h-full rounded-[24px] shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 text-sm text-slate-700">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

