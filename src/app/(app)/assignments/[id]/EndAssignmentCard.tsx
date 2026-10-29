"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { EndAssignmentDocument } from "@/generated/graphql";
import { errorMessage } from "@/lib/errors";
import type { AssignmentNode } from "./types";

export function EndAssignmentCard({ assignment }: { assignment: AssignmentNode }) {
  const [endAssignment, { loading, error: endError }] = useMutation(EndAssignmentDocument);
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodEnd) {
      setError("Tanggal selesai wajib diisi.");
      return;
    }
    if (periodEnd < assignment.periodStart) {
      setError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    setError(null);
    await endAssignment({
      onError: () => undefined,
      variables: { id: assignment.id, periodEnd },
    });
  }

  return (
    <Card className="flex max-w-2xl flex-col gap-3 border-amber-200 bg-amber-50">
      <p className="text-sm text-amber-800">
        Mengakhiri assignment ini akan menandainya <strong>selesai</strong> dan mengosongkan talent
        untuk tugas berikutnya. Isi tanggal selesai terlebih dahulu.
      </p>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <InputControl error={error} label="Tanggal Selesai">
          <Input
            onChange={(e) => {
              setPeriodEnd(e.target.value);
              setError(null);
            }}
            type="date"
            value={periodEnd}
          />
        </InputControl>
        <div className="flex gap-2">
          <Button disabled={loading} type="submit">
            Akhiri assignment
          </Button>
        </div>
      </form>
      {endError ? (
        <p className="text-sm text-red-700" role="alert">
          {errorMessage(endError, "Gagal mengakhiri assignment.")}
        </p>
      ) : null}
    </Card>
  );
}
