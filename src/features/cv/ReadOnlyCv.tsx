"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/Card";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import type { CvFieldsFragment } from "@/generated/graphql";
import { formatDegree } from "./educationLevels";

export function ReadOnlyCv({ cv }: { cv: CvFieldsFragment }) {
  return (
    <div className="flex flex-col gap-4">
      <ReadOnlySection title="Ringkasan Profil">
        <p className="text-sm text-zinc-800">{cv.summary || "—"}</p>
      </ReadOnlySection>

      <ReadOnlySection title="Pendidikan">
        {cv.educations.length ? (
          <ul className="flex flex-col gap-1.5">
            {cv.educations.map((education) => (
              <li className="text-sm text-zinc-800" key={education.id}>
                {education.institution}
                {education.degree ? ` — ${formatDegree(education.degree)}` : ""}
                <span className="ml-2 text-xs text-zinc-500">
                  {[
                    education.fieldOfStudy,
                    [education.startYear, education.endYear]
                      .filter(Boolean)
                      .join("–"),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </ReadOnlySection>

      <ReadOnlySection title="Sertifikasi">
        {cv.certifications.length ? (
          <ul className="flex flex-col gap-1.5">
            {cv.certifications.map((certification) => (
              <li className="text-sm text-zinc-800" key={certification.id}>
                {certification.name}
                <span className="ml-2 text-xs text-zinc-500">
                  {certification.issuer || ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </ReadOnlySection>

      <ReadOnlySection title="Keahlian">
        {cv.skills.length ? (
          <ul className="flex flex-col gap-1.5">
            {cv.skills.map((skill) => (
              <li className="text-sm text-zinc-800" key={skill.id}>
                {skill.name}
                <span className="ml-2 text-xs text-zinc-500">
                  {skill.level || ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </ReadOnlySection>

      <ReadOnlySection title="Pengalaman Kerja">
        <p className="text-xs text-zinc-500">
          Terisi otomatis dari riwayat assignment (FR-12).
        </p>
        {cv.workExperience.length ? (
          <ul className="flex flex-col gap-1.5">
            {cv.workExperience.map((experience) => (
              <li
                className="flex items-start justify-between gap-3 text-sm"
                key={experience.id}
              >
                <span className="text-zinc-800">
                  {experience.project.name}
                  <span className="ml-2 text-xs text-zinc-500">
                    {experience.periodStart}
                    {experience.periodEnd
                      ? ` — ${experience.periodEnd}`
                      : " — sekarang"}
                  </span>
                </span>
                <AssignmentStatusBadge status={experience.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </ReadOnlySection>
    </div>
  );
}

function ReadOnlySection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {children}
    </Card>
  );
}
