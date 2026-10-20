import type { AuditAction } from "@/generated/graphql/types";

export const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "Buat",
  UPDATE: "Ubah",
  DEACTIVATE: "Nonaktifkan",
  DELETE: "Hapus",
  LOGIN: "Login",
  LOGOUT: "Logout",
  RENEW: "Perpanjang",
  RESIGN: "Resign",
  MUTATE: "Mutasi",
  RETIRE: "Pensiun",
  END: "Akhiri kontrak",
  ANONYMIZE: "Anonimkan",
};

export const ACTION_PILL: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-tp-tint-info text-tp-ink-info",
  DEACTIVATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-zinc-100 text-zinc-700",
  LOGOUT: "bg-zinc-100 text-zinc-700",
  RENEW: "bg-emerald-100 text-emerald-700",
  RESIGN: "bg-amber-100 text-amber-700",
  MUTATE: "bg-tp-tint-info text-tp-ink-info",
  RETIRE: "bg-tp-tint-info text-tp-ink-info",
  END: "bg-zinc-100 text-zinc-700",
  ANONYMIZE: "bg-zinc-100 text-zinc-700",
};

/**
 * Human label of an audit `entityType` (FR-17). The server stores the
 * snake_case machine name of the mutated entity; the access-configuration
 * entities of the dynamic RBAC (`role`, `menu_access`, `access_config`) are part
 * of the trail too, so an Admin reads what changed instead of a raw key. An
 * unknown type falls back to the stored value: a new entity must never become
 * invisible in the trail.
 */
export const ENTITY_LABEL: Record<string, string> = {
  user: "Akun",
  employee: "Karyawan",
  employment_contract: "Kontrak kerja",
  assignment: "Assignment",
  idp: "IDP",
  development_action: "Aksi pengembangan",
  review_log: "Catatan review",
  performance_evaluation: "Evaluasi",
  evaluation_period: "Periode evaluasi",
  evaluation_template: "Template evaluasi",
  cv_profile: "Profil CV",
  cv_skill: "Keahlian CV",
  cv_education: "Pendidikan CV",
  cv_certification: "Sertifikasi CV",
  unit: "Unit",
  chapter: "Chapter",
  job_role: "Job role",
  project: "Project",
  setting: "Pengaturan",
  entra_account: "Akun Entra",
  role: "Role akses",
  menu_access: "Akses menu",
  access_config: "Konfigurasi akses",
};

/** Display label of an audit entity type, falling back to the stored value. */
export function entityLabel(entityType: string): string {
  return ENTITY_LABEL[entityType] ?? entityType;
}
