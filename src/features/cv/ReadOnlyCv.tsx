"use client";

import type { CvFieldsFragment } from "@/generated/graphql";
import { CvCertificationList } from "./CvCertificationList";
import { CvEducationList } from "./CvEducationList";
import { CvSkillLevelGroups } from "./CvSkillLevelGroups";
import { CvWorkExperienceList } from "./CvWorkExperienceList";
import { ReadOnlySection } from "./ReadOnlySection";

export function ReadOnlyCv({ cv }: { cv: CvFieldsFragment }) {
  return (
    <div className="flex flex-col gap-4">
      <ReadOnlySection title="Ringkasan Profil">
        <p className="text-sm text-tp-text">{cv.summary || "—"}</p>
      </ReadOnlySection>

      <ReadOnlySection title="Pendidikan">
        <CvEducationList educations={cv.educations} />
      </ReadOnlySection>

      <ReadOnlySection title="Sertifikasi">
        <CvCertificationList certifications={cv.certifications} />
      </ReadOnlySection>

      <ReadOnlySection title="Keahlian">
        <CvSkillLevelGroups skills={cv.skills} />
      </ReadOnlySection>

      <ReadOnlySection title="Pengalaman Kerja">
        <p className="text-xs text-tp-muted">Terisi otomatis dari riwayat assignment (FR-12).</p>
        <CvWorkExperienceList experiences={cv.workExperience} />
      </ReadOnlySection>
    </div>
  );
}
