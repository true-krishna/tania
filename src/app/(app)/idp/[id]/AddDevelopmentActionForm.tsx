"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { AddDevelopmentActionDocument, IdpDocument } from "@/generated/graphql";
import { errorText } from "@/lib/errors";
import { METHOD_LABEL } from "./labels";
import type { DevelopmentMethod } from "@/generated/graphql/types";

export function AddDevelopmentActionForm({ idpId }: { idpId: string }) {
  const [addAction, { loading }] = useMutation(AddDevelopmentActionDocument, {
    refetchQueries: [{ query: IdpDocument, variables: { id: idpId } }],
  });
  const [description, setDescription] = React.useState("");
  const [method, setMethod] = React.useState<DevelopmentMethod>("TRAINING");
  const [dueDate, setDueDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const { pushToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Deskripsi aksi wajib diisi.");
      return;
    }
    setError(null);
    try {
      await addAction({
        variables: {
          idpId,
          input: {
            description: description.trim(),
            method,
            dueDate: dueDate || undefined,
          },
        },
      });
      setDescription("");
      setDueDate("");
      pushToast("success", "Aksi pengembangan ditambahkan.");
    } catch (err) {
      pushToast("error", errorText(err, "Gagal menambah aksi."));
    }
  }

  return (
    <form className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4" onSubmit={onSubmit}>
      <h3 className="text-sm font-medium text-zinc-700">Tambah aksi pengembangan</h3>{" "}
      <InputControl label="Deskripsi / tindakan">
        <Input
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mis. Ikuti training Go lanjutan"
          value={description}
        />
      </InputControl>
      <div className="grid grid-cols-2 gap-3">
        <InputControl label="Metode">
          <Select
            onChange={(e) => setMethod(e.target.value as DevelopmentMethod)}
            options={(Object.keys(METHOD_LABEL) as DevelopmentMethod[]).map((m) => ({
              value: m,
              label: METHOD_LABEL[m],
            }))}
            value={method}
          />
        </InputControl>
        <InputControl label="Tenggat (opsional)">
          <Input onChange={(e) => setDueDate(e.target.value)} type="date" value={dueDate} />
        </InputControl>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div>
        <Button disabled={loading} type="submit">
          Tambah aksi
        </Button>
      </div>
    </form>
  );
}
