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
  UPDATE: "bg-brand-100 text-brand-700",
  DEACTIVATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-zinc-100 text-zinc-700",
  LOGOUT: "bg-zinc-100 text-zinc-700",
  RENEW: "bg-emerald-100 text-emerald-700",
  RESIGN: "bg-amber-100 text-amber-700",
  MUTATE: "bg-brand-100 text-brand-700",
  RETIRE: "bg-violet-100 text-violet-700",
  END: "bg-zinc-100 text-zinc-700",
  ANONYMIZE: "bg-zinc-100 text-zinc-700",
};
