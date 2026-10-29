import type { CvFieldsFragment } from "@/generated/graphql";
import { CvEmptyValue } from "./CvEmptyValue";
import { formatDegree } from "./educationLevels";

export function CvEducationList({ educations }: { educations: CvFieldsFragment["educations"] }) {
  if (!educations.length) {
    return <CvEmptyValue reason="Belum ada riwayat pendidikan di profil CV." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {educations.map((education) => {
        const detail = [
          education.fieldOfStudy,
          [education.startYear, education.endYear].filter(Boolean).join("–"),
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li
            className="min-w-0 border-t border-tp-line pt-3 first:border-t-0 first:pt-0"
            key={education.id}
          >
            <p className="text-sm font-semibold text-tp-text">
              {education.institution}
              {education.degree ? ` — ${formatDegree(education.degree)}` : ""}
            </p>
            <p className="text-[13px] text-tp-muted">
              {detail || "Jurusan dan tahun belum diisi."}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
