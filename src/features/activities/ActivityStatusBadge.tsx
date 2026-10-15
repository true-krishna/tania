import { Chip, type ChipVariant } from "@/components/Chip";
import type { ActivityReference } from "./types";

/**
 * `ActivityStatus` as a chip (status is never colour-only). Variant by
 * meaning: not started = neutral, running = informational info, done = success.
 * The label comes from the server/reference data, so seeds and future enum
 * literals render without a second mapping table.
 */
const VARIANTS: Record<string, ChipVariant> = {
  "status-todo": "neutral",
  "status-progress": "info",
  "status-done": "success",
};

export function ActivityStatusBadge({ status }: { status: ActivityReference }) {
  return <Chip variant={VARIANTS[status.id] ?? "neutral"}>{status.name}</Chip>;
}
