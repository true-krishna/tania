"use client";

import type * as React from "react";
import { IconSend } from "@tabler/icons-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { CHAT_MAX_LENGTH } from "./assistantConfig";

type AssistantComposerProps = {
  busy: boolean;
  draft: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSend: () => void;
  quotaActive: boolean;
};

export function AssistantComposer({
  busy,
  draft,
  inputRef,
  onChange,
  onSend,
  quotaActive,
}: AssistantComposerProps) {
  const overLimit = draft.length > CHAT_MAX_LENGTH;

  return (
    <footer className="border-t border-tp-line px-5 py-4">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="assistant-input">
          Pertanyaan untuk asisten
        </label>
        <Input
          disabled={busy}
          id="assistant-input"
          maxLength={CHAT_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Tulis pertanyaan tentang karyawan atau kontrak…"
          ref={inputRef}
          value={draft}
        />
        <Button
          aria-label="Kirim pertanyaan"
          disabled={busy || quotaActive || !draft.trim() || overLimit}
          onClick={onSend}
        >
          <IconSend aria-hidden size={16} />
        </Button>
      </div>
      <p className="mt-2 text-xs text-tp-muted">
        {draft.length}/{CHAT_MAX_LENGTH} karakter
        {overLimit && " — maksimal 2.000 karakter."}
      </p>
    </footer>
  );
}
