"use client";

import { EntraAccountActionModal } from "@/features/entra/EntraAccountActionModal";
import type { ConfirmAction } from "./types";

export function EntraConfirmModals({
  confirm,
  busy,
  onClose,
  onConfirmDisable,
  onConfirmReprovision,
}: {
  confirm: ConfirmAction | null;
  busy: boolean;
  onClose: () => void;
  onConfirmDisable: () => void;
  onConfirmReprovision: () => void;
}) {
  if (!confirm) return null;

  if (confirm.kind === "disable") {
    return (
      <EntraAccountActionModal
        busy={busy}
        confirmLabel="Nonaktifkan"
        description={`Akun Entra ${confirm.employee.fullName} tidak akan dapat dipakai login sampai diaktifkan kembali. Nonaktifkan sekarang?`}
        onClose={onClose}
        onConfirm={onConfirmDisable}
        open
        title="Nonaktifkan akun Entra"
      />
    );
  }

  return (
    <EntraAccountActionModal
      busy={busy}
      confirmLabel="Provisi ulang"
      description={`Akun Entra lama ${confirm.employee.fullName} akan dinonaktifkan, lalu dibuat atau diundang ulang mengikuti contract_type kontrak aktifnya. Lanjutkan?`}
      onClose={onClose}
      onConfirm={onConfirmReprovision}
      open
      title="Provisi ulang akun Entra"
    />
  );
}
