"use client";

import * as React from "react";

interface ModalContextValue {
  titleId: string;
  subtitleId: string;
  onClose: () => void;
  setHasSubtitle: (value: boolean) => void;
}

export const ModalContext = React.createContext<ModalContextValue | null>(null);

export function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("Modal subcomponents must be rendered inside <Modal>.");
  }
  return context;
}
