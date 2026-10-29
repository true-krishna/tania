"use client";

import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { Button } from "@/components/Button";

export interface EntraAccountActionModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function EntraAccountActionModal({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: EntraAccountActionModalProps) {
  return (
    <Modal onClose={onClose} open={open} size="sm">
      <ModalTitle>{title}</ModalTitle>
      <ModalContent>
        <p className="text-sm text-zinc-600">{description}</p>
      </ModalContent>
      <ModalActions>
        <Button disabled={busy} onClick={onClose} type="button" variant="secondary">
          Batal
        </Button>
        <Button disabled={busy} onClick={onConfirm} type="button">
          {busy ? "Memproses…" : confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
}
