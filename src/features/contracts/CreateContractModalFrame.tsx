"use client";

import * as React from "react";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";

export function CreateContractModalFrame({
  open,
  onClose,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Modal onClose={onClose} open={open} size="lg">
      <ModalTitle>Tambah Kontrak</ModalTitle>
      <ModalContent>{children}</ModalContent>
      {actions ? <ModalActions>{actions}</ModalActions> : null}
    </Modal>
  );
}
