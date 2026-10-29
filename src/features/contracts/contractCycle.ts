import type { EmploymentContractQuery } from "@/generated/graphql";

export type Contract = NonNullable<
  EmploymentContractQuery["employmentContract"]
>;

export const DEPENDENCY_WARNING =
  "Karyawan masih memiliki assignment aktif atau IDP berjalan. Tindakan ini tetap berjalan dan assignment/IDP berjalan tetap tersimpan sebagai riwayat.";

export const MUTATION_NOTICE =
  "Mutasi mengakhiri kontrak lama dan membuat kontrak baru efektif pada tanggal mutasi. Assignment aktif pada unit lama tetap tampil sebagai riwayat.";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
