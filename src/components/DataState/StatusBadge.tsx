import { Chip } from "@/components/Chip";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Chip dot size="small" variant={active ? "success" : "neutral"}>
      {active ? "Aktif" : "Nonaktif"}
    </Chip>
  );
}
