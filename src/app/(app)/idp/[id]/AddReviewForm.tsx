"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { useToast } from "@/components/Toast";
import { AddIdpReviewDocument, IdpDocument } from "@/generated/graphql";
import { errorText } from "@/lib/errors";

const BLOCK =
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm";

export function AddReviewForm({ idpId }: { idpId: string }) {
  const [addReview, { loading }] = useMutation(AddIdpReviewDocument, {
    refetchQueries: [{ query: IdpDocument, variables: { id: idpId } }],
  });
  const [reviewDate, setReviewDate] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [followUp, setFollowUp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const { pushToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewDate || !summary.trim()) {
      setError("Tanggal dan ringkasan hasil wajib diisi.");
      return;
    }
    setError(null);
    try {
      await addReview({
        variables: {
          idpId,
          input: {
            reviewDate,
            summary: summary.trim(),
            followUp: followUp.trim() || undefined,
          },
        },
      });
      setReviewDate("");
      setSummary("");
      setFollowUp("");
      pushToast("success", "Hasil review dicatat.");
    } catch (err) {
      pushToast("error", errorText(err, "Gagal mencatat review."));
    }
  }

  return (
    <form className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4" onSubmit={onSubmit}>
      <h3 className="text-sm font-medium text-zinc-700">Catat hasil review</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InputControl label="Tanggal review">
          <Input
            aria-label="Tanggal review"
            onChange={(e) => setReviewDate(e.target.value)}
            type="date"
            value={reviewDate}
          />
        </InputControl>
      </div>
      <InputControl label="Ringkasan hasil">
        <textarea
          aria-label="Ringkasan hasil"
          className={BLOCK}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Catat perkembangan talent sejak review terakhir…"
          rows={3}
          value={summary}
        />
      </InputControl>
      <InputControl label="Tindak lanjut (opsional)">
        <textarea
          aria-label="Tindak lanjut"
          className={BLOCK}
          onChange={(e) => setFollowUp(e.target.value)}
          rows={2}
          value={followUp}
        />
      </InputControl>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div>
        <Button disabled={loading} type="submit">
          Simpan review
        </Button>
      </div>
    </form>
  );
}
