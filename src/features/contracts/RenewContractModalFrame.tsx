"use client";

import type { ReactNode } from "react";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";

type RenewContractModalFrameProps = {
  actions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  open: boolean;
};

export function RenewContractModalFrame({
  actions,
  children,
  onClose,
  open,
}: RenewContractModalFrameProps) {
  return (
    <Modal onClose={onClose} open={open} size="lg">
      <ModalTitle>Perpanjang Kontrak</ModalTitle>
      <ModalContent>{children}</ModalContent>
      {actions ? <ModalActions>{actions}</ModalActions> : null}
    </Modal>
  );
}
