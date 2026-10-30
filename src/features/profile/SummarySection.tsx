import { Card } from "@/components/Card";
import { EmptyState } from "@/components/DataState";
import { EMPLOYEE_STATUS_LABEL, GENDER_LABEL } from "@/features/employees/labels";
import type { RefetchableQueryState } from "@/lib/apollo/toQueryState";
import { formatProfileDate } from "./format";
import { ProfileDataGroup } from "./ProfileDataGroup";
import { ProfileErrorState } from "./ProfileErrorState";
import { ProfileField } from "./ProfileField";
import { ProfilePanelSkeleton } from "./ProfilePanelSkeleton";
import type { ProfileEmployee } from "./useProfile";

export function SummarySection({
  employee,
  error,
  onRetry,
  status,
}: {
  employee: ProfileEmployee | undefined;
  error: string | null;
  onRetry: () => void;
  status: RefetchableQueryState<ProfileEmployee | undefined>["status"];
}) {
  if (status === "loading") return <ProfilePanelSkeleton label="Memuat data diri…" />;
  if (status === "error") {
    return <ProfileErrorState message={error ?? "Gagal memuat profil."} onRetry={onRetry} />;
  }
  if (!employee) {
    return <EmptyState message="Data karyawan tidak ditemukan untuk akun ini." />;
  }

  return (
    <Card className="min-w-0">
      <h2 className="tp-h3">Data diri</h2>
      <div className="mt-4 flex flex-col gap-4">
        <ProfileDataGroup title="Kontak">
          <ProfileField label="Email" value={employee.email} />
          <ProfileField label="Telepon" reason="Belum diisi." value={employee.phone} />
          <ProfileField label="Alamat" reason="Belum diisi." value={employee.address} />
        </ProfileDataGroup>
        <ProfileDataGroup title="Kepegawaian">
          <ProfileField label="NIK" value={employee.nikMasked} />
          <ProfileField
            label="Tanggal lahir"
            reason="Belum diisi."
            value={formatProfileDate(employee.birthDate)}
          />
          <ProfileField
            label="Jenis kelamin"
            reason="Belum diisi."
            value={employee.gender ? GENDER_LABEL[employee.gender] : undefined}
          />
          <ProfileField label="Nomor induk" reason="Belum tercatat." value={employee.nomorInduk} />
          <ProfileField
            label="Unit / divisi"
            reason="Belum tercatat."
            value={employee.unit?.name}
          />
          <ProfileField label="Job role" reason="Belum tercatat." value={employee.jobRole?.name} />
          <ProfileField
            label="Chapter"
            reason="Belum ada chapter."
            value={employee.chapter?.name}
          />
          <ProfileField label="Status" value={EMPLOYEE_STATUS_LABEL[employee.status]} />
          <ProfileField
            label="Bergabung"
            reason="Belum tercatat."
            value={formatProfileDate(employee.joinedAt)}
          />
        </ProfileDataGroup>
        <ProfileDataGroup title="Pendidikan">
          <ProfileField
            label="Pendidikan terakhir"
            reason="Belum diisi."
            value={employee.latestEducation}
          />
          <ProfileField label="Institusi" reason="Belum diisi." value={employee.institutionName} />
          <ProfileField label="Jurusan" reason="Belum diisi." value={employee.major} />
        </ProfileDataGroup>
      </div>
    </Card>
  );
}
