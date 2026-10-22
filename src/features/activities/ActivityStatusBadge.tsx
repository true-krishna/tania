import { Chip, type ChipVariant } from "@/components/Chip";
import type { ActivityReference } from "./types";

const VARIANTS: Record<string, ChipVariant> = {
  "status-todo": "neutral",
  "status-progress": "info",
  "status-done": "success",
};

export function ActivityStatusBadge({ status }: { status: ActivityReference }) {
  return <Chip variant={VARIANTS[status.id] ?? "neutral"}>{status.name}</Chip>;
}
