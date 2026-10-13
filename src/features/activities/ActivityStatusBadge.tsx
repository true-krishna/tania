import { Chip, type ChipTone } from "@/features/workload/Chip";
import type { ActivityReference } from "./types";

/**
 * `ActivityStatus` as a `\.tp-chip` (status is never colour-only). Tone by
 * meaning: not started = neutral, running = informational info, done = mint.
 * The label comes from the server/reference data, so seeds and future enum
 * literals render without a second mapping table.
 */
const TONES: Record<string, ChipTone> = {
  "status-todo": "neutral",
  "status-progress": "info",
  "status-done": "mint",
};

export function ActivityStatusBadge({ status }: { status: ActivityReference }) {
  return <Chip tone={TONES[status.id] ?? "neutral"}>{status.name}</Chip>;
}
