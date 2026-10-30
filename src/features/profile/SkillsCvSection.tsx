"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CvCertificationList } from "@/features/cv/CvCertificationList";
import { CvEducationList } from "@/features/cv/CvEducationList";
import { CvSkillLevelGroups } from "@/features/cv/CvSkillLevelGroups";
import { CvWorkExperienceList } from "@/features/cv/CvWorkExperienceList";
import { TalentCvEditor } from "@/features/cv/TalentCvEditor";
import type { CvFieldsFragment } from "@/generated/graphql";
import type { RefetchableQueryState } from "@/lib/apollo/toQueryState";
import { AskTaniaInsight } from "./AskTaniaInsight";
import { ProfileErrorState } from "./ProfileErrorState";
import { ProfilePanelSkeleton } from "./ProfilePanelSkeleton";
import { SectionHeader } from "./SectionHeader";

export function SkillsCvSection({
  canEdit,
  cv,
}: {
  canEdit: boolean;
  cv: RefetchableQueryState<CvFieldsFragment | undefined>;
}) {
  const [editing, setEditing] = React.useState(false);

  if (cv.status === "loading") return <ProfilePanelSkeleton label="Memuat profil CV…" />;
  if (cv.status === "error") {
    return (
      <ProfileErrorState message={cv.error ?? "Gagal memuat profil CV."} onRetry={cv.refetch} />
    );
  }

  const profile = cv.data;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <Card className="min-w-0">
            <SectionHeader
              label={profile ? `${profile.skills.length} terdata` : undefined}
              title="Keahlian"
            />
            <div className="mt-3">
              <CvSkillLevelGroups skills={profile?.skills ?? []} />
            </div>
          </Card>
          <AskTaniaInsight cv={profile} />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <Card className="min-w-0">
            <SectionHeader
              label={profile ? `${profile.certifications.length} terdata` : undefined}
              title="Sertifikasi"
            />
            <div className="mt-3">
              <CvCertificationList certifications={profile?.certifications ?? []} />
            </div>
          </Card>
          <Card className="min-w-0">
            <SectionHeader title="Pendidikan & pengalaman" />
            <div className="mt-3 flex flex-col gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-tp-text">Pendidikan</h3>
                <div className="mt-2">
                  <CvEducationList educations={profile?.educations ?? []} />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-tp-text">Pengalaman kerja</h3>
                <div className="mt-2">
                  <CvWorkExperienceList experiences={profile?.workExperience ?? []} />
                </div>
              </div>
            </div>
          </Card>
          {profile ? null : (
            <p className="tp-empty">
              <strong>Profil CV belum diisi</strong>
              {canEdit
                ? "Gunakan tombol Ubah profil CV di bawah untuk melengkapinya."
                : "Belum ada data CV untuk akun ini."}
            </p>
          )}
        </div>
      </div>
      {canEdit ? (
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <Button
              onClick={() => setEditing((current) => !current)}
              type="button"
              variant="secondary"
            >
              {editing ? "Selesai mengubah" : "Ubah profil CV"}
            </Button>
          </div>
          {editing ? <TalentCvEditor /> : null}
        </div>
      ) : null}
    </div>
  );
}
