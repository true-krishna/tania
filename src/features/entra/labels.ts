import type { EntraProvisionStatus } from "@/generated/graphql/types";

export const ENTRA_PROVISION_STATUS_LABEL: Record<EntraProvisionStatus, string> = {
  INVITED: "Undangan terkirim",
  CREATED: "Akun dibuat",
  FAILED: "Gagal",
  DISABLED: "Dinonaktifkan",
};

/** Badge tone per provisioning outcome so failure is visible at a glance (FR-44). */
export const ENTRA_PROVISION_STATUS_TONE: Record<EntraProvisionStatus, string> = {
  INVITED: "bg-brand-100 text-brand-700",
  CREATED: "bg-brand-100 text-brand-700",
  FAILED: "bg-red-100 text-red-700",
  DISABLED: "bg-zinc-100 text-zinc-600",
};
