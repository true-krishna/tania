import type { CvFieldsFragment } from "@/generated/graphql";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { CvEmptyValue } from "./CvEmptyValue";

export function CvWorkExperienceList({
  experiences,
}: {
  experiences: CvFieldsFragment["workExperience"];
}) {
  if (!experiences.length) {
    return <CvEmptyValue reason="Belum ada pengalaman kerja dari riwayat assignment." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {experiences.map((experience) => (
        <li
          className="flex min-w-0 flex-wrap items-start justify-between gap-2 border-t border-tp-line pt-3 first:border-t-0 first:pt-0"
          key={experience.id}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-tp-text">{experience.project.name}</p>
            <p className="text-[13px] text-tp-muted">
              {experience.periodStart}
              {experience.periodEnd ? ` — ${experience.periodEnd}` : " — sekarang"}
            </p>
          </div>
          <AssignmentStatusBadge status={experience.status} />
        </li>
      ))}
    </ul>
  );
}
