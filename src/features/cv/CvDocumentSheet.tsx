import type { CvFieldsFragment } from "@/generated/graphql";
import { formatProfileDate } from "@/features/profile/format";
import { CvCertificationList } from "./CvCertificationList";
import { CvEducationList } from "./CvEducationList";
import { CvSkillLevelGroups } from "./CvSkillLevelGroups";
import { CvWorkExperienceList } from "./CvWorkExperienceList";

function nearestExpiryNote(cv: CvFieldsFragment | undefined): string | null {
  const nearest = (cv?.certifications ?? [])
    .map((certification) => certification.expiryDate)
    .filter((value): value is string => Boolean(value))
    .sort()[0];
  if (!nearest) return null;
  return `Sertifikasi dengan masa berlaku terdekat: ${formatProfileDate(nearest) ?? nearest}.`;
}

export function CvDocumentSheet({ cv }: { cv: CvFieldsFragment | undefined }) {
  const expiryNote = nearestExpiryNote(cv);

  return (
    <article
      aria-label="Pratinjau dokumen CV"
      className="mx-auto flex w-full min-w-0 max-w-[760px] flex-col gap-6 rounded-tp-lg border border-tp-line bg-tp-surface px-5 py-6 shadow-card sm:px-8 sm:py-8"
    >
      <header className="min-w-0 border-b border-tp-line pb-4">
        <p className="tp-label">Curriculum Vitae</p>
        <p className="tp-h2 mt-1 break-words">CV saya</p>
        <p className="mt-1 text-[13px] text-tp-muted">
          Ringkasan, pendidikan, sertifikasi, keahlian, dan pengalaman kerja.
        </p>
      </header>

      <section className="min-w-0">
        <h2 className="tp-h3">Ringkasan</h2>
        <p className="mt-2 break-words text-sm leading-6 text-tp-text">{cv?.summary || "—"}</p>
      </section>

      <section className="min-w-0">
        <h2 className="tp-h3">Pengalaman kerja</h2>
        <div className="mt-2">
          <CvWorkExperienceList experiences={cv?.workExperience ?? []} />
        </div>
      </section>

      <section className="min-w-0">
        <h2 className="tp-h3">Pendidikan</h2>
        <div className="mt-2">
          <CvEducationList educations={cv?.educations ?? []} />
        </div>
      </section>

      <section className="min-w-0">
        <h2 className="tp-h3">Sertifikasi</h2>
        <div className="mt-2">
          <CvCertificationList certifications={cv?.certifications ?? []} />
        </div>
      </section>

      <section className="min-w-0">
        <h2 className="tp-h3">Keahlian</h2>
        <div className="mt-2">
          <CvSkillLevelGroups skills={cv?.skills ?? []} />
        </div>
      </section>

      {expiryNote ? (
        <p className="border-t border-tp-line pt-4 text-[13px] text-tp-muted">{expiryNote}</p>
      ) : null}
    </article>
  );
}
