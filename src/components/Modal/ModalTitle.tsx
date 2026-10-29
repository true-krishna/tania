"use client";

import { IconX } from "@tabler/icons-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { useModalContext } from "./ModalContext";

export interface ModalTitleProps extends Omit<React.ComponentPropsWithoutRef<"header">, "title"> {
  subtitle?: React.ReactNode;
}

export function ModalTitle({ subtitle, className, children, ...rest }: ModalTitleProps) {
  const { titleId, subtitleId, onClose, setHasSubtitle } = useModalContext();

  React.useEffect(() => {
    setHasSubtitle(Boolean(subtitle));
    return () => setHasSubtitle(false);
  }, [setHasSubtitle, subtitle]);

  return (
    <header
      className={cn(
        "flex shrink-0 items-start justify-between gap-4 border-b border-tp-line px-5 py-4",
        className,
      )}
      {...rest}
    >
      <div>
        <h2 className="text-[22px] font-bold leading-tight text-tp-text" id={titleId}>
          {children}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-tp-muted" id={subtitleId}>
            {subtitle}
          </p>
        ) : null}
      </div>
      <button
        aria-label="Tutup"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-tp-muted transition-colors duration-200 hover:bg-tp-bg hover:text-tp-text motion-reduce:transition-none"
        onClick={onClose}
        type="button"
      >
        <IconX aria-hidden size={20} />
      </button>
    </header>
  );
}
