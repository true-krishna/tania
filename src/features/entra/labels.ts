import type { EntraProvisionStatus } from "@/generated/graphql/types";

export const ENTRA_PROVISION_STATUS_LABEL: Record<EntraProvisionStatus, string> = {
  INVITED: "Undangan terkirim",
  // Keputusan TAN-273 (Opsi A): akun hasil create lahir tanpa kredensial
  // yang dapat dipakai dan menunggu aktivasi di luar aplikasi.
  CREATED: "Menunggu aktivasi",
  FAILED: "Gagal",
  DISABLED: "Dinonaktifkan",
};

/** Badge tone per provisioning outcome so failure is visible at a glance (FR-44). */
export const ENTRA_PROVISION_STATUS_TONE: Record<EntraProvisionStatus, string> = {
  INVITED: "bg-tp-tint-info text-tp-ink-info",
  CREATED: "bg-tp-tint-info text-tp-ink-info",
  FAILED: "bg-red-100 text-red-700",
  DISABLED: "bg-zinc-100 text-zinc-600",
};
