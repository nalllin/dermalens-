import { Badge } from "@/components/ui/badge";
import { percentage } from "@/lib/utils";

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  return <Badge variant="blue">Confidence {percentage(confidence)}</Badge>;
}

