"use client";

import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useMyCvProfile } from "@/features/cv/useMyCvProfile";
import { CvCertificationsSection } from "./CvCertificationsSection";
import { CvEducationsSection } from "./CvEducationsSection";
import { CvSkillsSection } from "./CvSkillsSection";
import { CvSummarySection } from "./CvSummarySection";
import { CvWorkExperienceSection } from "./CvWorkExperienceSection";

export function TalentCvEditor() {
  const { status, data, error } = useMyCvProfile();

  if (status === "loading") return <LoadingState />;
  if (status === "error") {
    return <ErrorState message={error ?? "Gagal memuat profil CV."} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle="Isi setiap bagian lalu simpan; pengalaman kerja terisi otomatis dari riwayat assignment."
        title="Profil CV"
      />
      <CvSummarySection cv={data} />
      <CvEducationsSection cv={data} />
      <CvCertificationsSection cv={data} />
      <CvSkillsSection cv={data} />
      <CvWorkExperienceSection cv={data} />
    </section>
  );
}
