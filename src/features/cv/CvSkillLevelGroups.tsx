import { Chip } from "@/components/Chip";
import type { CvFieldsFragment } from "@/generated/graphql";
import { CvEmptyValue } from "./CvEmptyValue";

type Skill = CvFieldsFragment["skills"][number];

const LEVEL_SCORES: Record<string, number> = {
  ahli: 100,
  expert: 100,
  mahir: 75,
  advanced: 75,
  menengah: 50,
  intermediate: 50,
  pemula: 25,
  beginner: 25,
};

function scoreFor(level: string | null | undefined): number | null {
  const key = level?.trim().toLowerCase() ?? "";
  return LEVEL_SCORES[key] ?? null;
}

export function CvSkillLevelGroups({ skills }: { skills: CvFieldsFragment["skills"] }) {
  if (!skills.length) {
    return <CvEmptyValue reason="Belum ada keahlian di profil CV." />;
  }

  const groups = new Map<string, { label: string; skills: Skill[]; score: number | null }>();
  for (const skill of skills) {
    const label = skill.level?.trim() || "Tanpa level";
    const key = label.toLowerCase();
    const score = scoreFor(skill.level);
    const group = groups.get(key);
    if (group) {
      group.skills.push(skill);
      continue;
    }
    groups.set(key, { label, score, skills: [skill] });
  }

  const ordered = [...groups.values()].sort(
    (left, right) => (right.score ?? -1) - (left.score ?? -1),
  );

  return (
    <div className="flex flex-col gap-4">
      {ordered.map((group) => (
        <div className="min-w-0" key={group.label}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-tp-text">{group.label}</p>
            <span className="text-[13px] text-tp-muted">{`${group.skills.length} keahlian`}</span>
          </div>
          {group.score === null ? (
            <p className="mt-1 text-[13px] text-tp-muted">Level keahlian belum diisi.</p>
          ) : (
            <div
              aria-label={`${group.label}: level ${group.score} dari 100`}
              className="mt-2 h-2 overflow-hidden rounded-full bg-tp-bg"
              role="img"
            >
              <div
                className="h-full rounded-full bg-tp-brand-navy"
                style={{ width: `${group.score}%` }}
              />
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {group.skills.map((skill) => (
              <Chip key={skill.id} size="small">
                {skill.name}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
