import type { EntraNotifyStatus, EntraProvisionStatus } from "@/generated/graphql/types";

export const ENTRA_PROVISION_STATUS_LABEL: Record<EntraProvisionStatus, string> = {
  INVITED: "Undangan terkirim",
  CREATED: "Akun dibuat",
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

export const ENTRA_NOTIFY_STATUS_LABEL: Record<EntraNotifyStatus, string> = {
  SENT: "Email aktivasi terkirim",
  FAILED: "Email aktivasi gagal",
};

export const ENTRA_NOTIFY_STATUS_TONE: Record<EntraNotifyStatus, string> = {
  SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};
