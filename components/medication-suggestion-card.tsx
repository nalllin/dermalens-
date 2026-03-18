import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MedicationSuggestionCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card className="h-full rounded-[24px] shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item} className="rounded-2xl bg-slate-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

