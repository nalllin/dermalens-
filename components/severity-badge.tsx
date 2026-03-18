import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/types";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const variant =
    severity === "severe"
      ? "rose"
      : severity === "moderate"
        ? "amber"
        : "teal";

  return <Badge variant={variant}>Severity {severity}</Badge>;
}

