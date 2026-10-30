import { Card } from "@/components/Card";
import type { CvFieldsFragment } from "@/generated/graphql";
import { AskTaniaInsight } from "@/features/profile/AskTaniaInsight";
import { CvCertificationList } from "./CvCertificationList";
import { CvEducationList } from "./CvEducationList";
import { CvSkillLevelGroups } from "./CvSkillLevelGroups";
import { CvWorkExperienceList } from "./CvWorkExperienceList";

export function CvReadSections({ cv }: { cv: CvFieldsFragment | undefined }) {
  return (
    <>
      <Card className="min-w-0">
        <h2 className="tp-h3">Ringkasan</h2>
        <p className="mt-2 break-words text-sm leading-6 text-tp-text">
          {cv?.summary || "Ringkasan CV belum diisi."}
        </p>
      </Card>
      <Card className="min-w-0">
        <h2 className="tp-h3">Keahlian</h2>
        <p className="tp-label mt-1">Level mengikuti isi profil CV Anda.</p>
        <div className="mt-3">
          <CvSkillLevelGroups skills={cv?.skills ?? []} />
        </div>
        <div className="mt-4 border-t border-tp-line pt-4">
          <AskTaniaInsight cv={cv} />
        </div>
      </Card>
      <Card className="min-w-0">
        <h2 className="tp-h3">Pendidikan</h2>
        <div className="mt-3">
          <CvEducationList educations={cv?.educations ?? []} />
        </div>
      </Card>
      <Card className="min-w-0">
        <h2 className="tp-h3">Sertifikasi</h2>
        <div className="mt-3">
          <CvCertificationList certifications={cv?.certifications ?? []} />
        </div>
      </Card>
      <Card className="min-w-0">
        <h2 className="tp-h3">Pengalaman kerja</h2>
        <p className="tp-label mt-1">Terisi otomatis dari riwayat assignment (FR-12).</p>
        <div className="mt-3">
          <CvWorkExperienceList experiences={cv?.workExperience ?? []} />
        </div>
      </Card>
    </>
  );
}
