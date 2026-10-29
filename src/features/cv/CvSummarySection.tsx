"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { InputControl } from "@/components/InputControl";
import { useToast } from "@/components/Toast";
import {
  MyCvProfileDocument,
  UpsertCvProfileDocument,
  type CvFieldsFragment,
} from "@/generated/graphql";
import { CvSectionCard } from "./CvSectionCard";

const textareaClassName =
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm";

export function CvSummarySection({
  cv,
}: {
  cv: CvFieldsFragment | undefined;
}) {
  const { pushToast } = useToast();
  const [upsert, { loading }] = useMutation(UpsertCvProfileDocument, {
    refetchQueries: [{ query: MyCvProfileDocument }],
  });
  const [summary, setSummary] = React.useState(cv?.summary ?? "");

  async function saveSummary() {
    try {
      await upsert({ variables: { input: { summary: summary.trim() || null } } });
      pushToast("success", "Ringkasan profil disimpan.");
    } catch (error) {
      pushToast(
        "error",
        error instanceof Error ? error.message : "Gagal menyimpan ringkasan."
      );
    }
  }

  return (
    <CvSectionCard title="Ringkasan Profil">
      <InputControl label="Ringkasan">
        <textarea
          className={textareaClassName}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Tulis ringkasan singkat tentang diri Anda…"
          rows={4}
          value={summary}
        />
      </InputControl>
      <div>
        <Button disabled={loading} onClick={saveSummary}>
          Simpan Ringkasan
        </Button>
      </div>
    </CvSectionCard>
  );
}
