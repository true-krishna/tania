"use client";

import * as React from "react";
import { IconSparkles } from "@tabler/icons-react";
import { AssistantPanel } from "./AssistantPanel";
import { useSessionRole } from "@/lib/auth/guard";

export function AssistantBubble() {
  const role = useSessionRole();
  const allowed = role === "CHAPTER" || role === "OPERATION";
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  if (!allowed) return null;

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Buka asisten data"
        className="fixed right-6 bottom-6 z-30 flex h-12 w-12 items-center justify-center rounded-tp-md bg-tp-brand-red text-tp-brand-on-red shadow-card hover:bg-tp-brand-red-deep motion-reduce:transition-none"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <IconSparkles aria-hidden size={22} />
      </button>
      <AssistantPanel onClose={() => setOpen(false)} open={open} triggerRef={triggerRef} />
    </>
  );
}
