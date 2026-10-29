"use client";

import { Button } from "@/components/Button";

type RoleActionData = {
  id: string;
  label: string;
  status: string;
  builtIn: boolean;
};

export function RoleActionsCell({
  role,
  confirming,
  busy,
  onDelete,
  onCancelDelete,
  onRequestDelete,
  onEdit,
  onToggleStatus,
}: {
  role: RoleActionData;
  confirming: boolean;
  busy: boolean;
  onDelete: () => void;
  onCancelDelete: () => void;
  onRequestDelete: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  if (role.builtIn) {
    return <span className="text-xs text-tp-muted">Role bawaan — tidak dapat diubah.</span>;
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-zinc-600">Hapus role {role.label}?</span>
        <Button disabled={busy} onClick={onDelete} type="button">
          Ya, hapus
        </Button>
        <Button onClick={onCancelDelete} type="button" variant="ghost">
          Batal
        </Button>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button onClick={onEdit} type="button" variant="ghost">
        Ubah label
      </Button>
      <Button disabled={busy} onClick={onToggleStatus} type="button" variant="ghost">
        {role.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
      </Button>
      <Button onClick={onRequestDelete} type="button" variant="ghost">
        Hapus
      </Button>
    </span>
  );
}
