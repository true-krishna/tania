"use client";

import * as React from "react";
import { IconSparkles } from "@tabler/icons-react";
import { AssistantPanel } from "./AssistantPanel";
import { useSessionRole } from "@/lib/auth/guard";

/**
 * Bubble asisten yang tertanam di app shell (FR-01 "tertanam", T026): tombol
 * melayang di atas app shell, bukan halaman terpisah. Hanya dirender untuk
 * CHAPTER/OPERATION — guard UI ini hanya kenyamanan, otorisasi sebenarnya ada
 * di server (ChatService). Membuka dari halaman mana pun.
 */
export function AssistantBubble() {
  const role = useSessionRole();
  const allowed = role === "CHAPTER" || role === "OPERATION";
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  if (!allowed) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Buka asisten data"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-30 flex h-12 w-12 items-center justify-center rounded-tp-md bg-tp-brand-red text-tp-brand-on-red shadow-card hover:bg-tp-brand-red-deep motion-reduce:transition-none"
      >
        <IconSparkles size={22} aria-hidden />
      </button>
      <AssistantPanel open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} />
    </>
  );
}
