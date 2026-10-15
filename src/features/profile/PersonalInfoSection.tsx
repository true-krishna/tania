import { Card } from "@/components/Card";
import { EmptyState } from "@/components/DataState";
import { EMPLOYEE_STATUS_LABEL, GENDER_LABEL } from "@/features/employees/labels";
import type { ProfileEmployee } from "./useProfile";

/**
 * Personal-information section of `/profile` (TAN-188) — the same field set as
 * the employee detail page's "Data diri" card, read-only and scoped to the
 * signed-in user.
 */
export function PersonalInfoSection({ employee }: { employee: ProfileEmployee | undefined }) {
  if (!employee) {
    return <EmptyState message="Data karyawan tidak ditemukan untuk akun ini." />;
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Data diri</h2>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Field label="NIK" value={employee.nikMasked} mono />
        <Field label="Email" value={employee.email} />
        <Field label="Tanggal Lahir" value={employee.birthDate ?? "—"} />
        <Field
          label="Jenis Kelamin"
          value={employee.gender ? GENDER_LABEL[employee.gender] : "—"}
        />
        <Field label="Telepon" value={employee.phone ?? "—"} />
        <Field label="Alamat" value={employee.address ?? "—"} />
        <Field label="Pendidikan Terakhir" value={employee.latestEducation ?? "—"} />
        <Field label="Institusi" value={employee.institutionName ?? "—"} />
        <Field label="Jurusan" value={employee.major ?? "—"} />
        <Field label="Tanggal Bergabung" value={employee.joinedAt} />
        <Field label="Unit / Divisi" value={employee.unit?.name ?? "—"} />
        <Field label="Job Role" value={employee.jobRole?.name ?? "—"} />
        <Field label="Chapter" value={employee.chapter?.name ?? "Tanpa chapter"} />
        <Field label="Status" value={EMPLOYEE_STATUS_LABEL[employee.status]} />
        <Field
          label="Assignable"
          value={employee.assignable && employee.status !== "INACTIVE" ? "Ya" : "Tidak"}
        />
      </dl>
    </Card>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className={mono ? "font-mono text-zinc-900" : "text-zinc-900"}>{value}</dd>
    </div>
  );
}