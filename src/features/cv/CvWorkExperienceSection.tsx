"use client";

import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import type { CvFieldsFragment } from "@/generated/graphql";
import { CvSectionCard } from "./CvSectionCard";

export function CvWorkExperienceSection({ cv }: { cv: CvFieldsFragment | undefined }) {
  const experiences = cv?.workExperience ?? [];

  return (
    <CvSectionCard
      description="Terisi otomatis dari riwayat assignment — tidak dapat diinput manual (FR-12)."
      title="Pengalaman Kerja"
    >
      {experiences.length ? (
        <ul className="flex flex-col gap-2">
          {experiences.map((experience) => (
            <li
              className="flex items-start justify-between gap-3 rounded-md border border-board-border px-3 py-2 text-sm"
              key={experience.id}
            >
              <div>
                <p className="font-medium text-zinc-900">{experience.project.name}</p>
                <p className="text-xs text-zinc-500">
                  {experience.periodStart}
                  {experience.periodEnd ? ` — ${experience.periodEnd}` : " — sekarang"}
                </p>
              </div>
              <AssignmentStatusBadge status={experience.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Belum ada riwayat assignment.</p>
      )}
    </CvSectionCard>
  );
}
