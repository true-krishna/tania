import { Card } from "@/components/Card";
import { DescriptionItem } from "@/components/DescriptionItem";
import { EmptyState } from "@/components/DataState";
import { EMPLOYEE_STATUS_LABEL, GENDER_LABEL } from "@/features/employees/labels";
import type { ProfileEmployee } from "./useProfile";

export function PersonalInfoSection({ employee }: { employee: ProfileEmployee | undefined }) {
  if (!employee) {
    return <EmptyState message="Data karyawan tidak ditemukan untuk akun ini." />;
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Data diri</h2>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <DescriptionItem label="NIK" mono value={employee.nikMasked} />
        <DescriptionItem label="Email" value={employee.email} />
        <DescriptionItem label="Tanggal Lahir" value={employee.birthDate ?? "—"} />
        <DescriptionItem
          label="Jenis Kelamin"
          value={employee.gender ? GENDER_LABEL[employee.gender] : "—"}
        />
        <DescriptionItem label="Telepon" value={employee.phone ?? "—"} />
        <DescriptionItem label="Alamat" value={employee.address ?? "—"} />
        <DescriptionItem label="Pendidikan Terakhir" value={employee.latestEducation ?? "—"} />
        <DescriptionItem label="Institusi" value={employee.institutionName ?? "—"} />
        <DescriptionItem label="Jurusan" value={employee.major ?? "—"} />
        <DescriptionItem label="Tanggal Bergabung" value={employee.joinedAt} />
        <DescriptionItem label="Unit / Divisi" value={employee.unit?.name ?? "—"} />
        <DescriptionItem label="Job Role" value={employee.jobRole?.name ?? "—"} />
        <DescriptionItem label="Chapter" value={employee.chapter?.name ?? "Tanpa chapter"} />
        <DescriptionItem label="Status" value={EMPLOYEE_STATUS_LABEL[employee.status]} />
        <DescriptionItem
          label="Assignable"
          value={employee.assignable && employee.status !== "INACTIVE" ? "Ya" : "Tidak"}
        />
      </dl>
    </Card>
  );
}
