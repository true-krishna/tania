"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import {
  CreateEvaluationTemplateDocument,
  EvaluationTemplatesDocument,
} from "@/generated/graphql";
import type { EvaluationAnswerType } from "@/generated/graphql/types";

type CriterionRow = { label: string; answerType: EvaluationAnswerType };

interface EvaluationTemplateCreateFormProps {
  onClose: () => void;
}

export function EvaluationTemplateCreateForm({ onClose }: EvaluationTemplateCreateFormProps) {
  const [createTemplate, { loading }] = useMutation(CreateEvaluationTemplateDocument, {
    refetchQueries: [EvaluationTemplatesDocument],
  });
  const { pushToast } = useToast();
  const [name, setName] = React.useState("");
  const [criteria, setCriteria] = React.useState<CriterionRow[]>([
    { label: "", answerType: "SCALE_1_5" },
  ]);
  const [errors, setErrors] = React.useState<Partial<Record<"name" | "criteria", string>>>({});

  function setCriterion(index: number, patch: Partial<CriterionRow>) {
    setCriteria((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setErrors((e) => ({ ...e, criteria: undefined }));
  }

  function addCriterion() {
    setCriteria((rows) => [...rows, { label: "", answerType: "SCALE_1_5" }]);
  }

  function removeCriterion(index: number) {
    setCriteria((rows) => rows.filter((_, i) => i !== index));
  }

  function validate() {
    const next: Partial<Record<"name" | "criteria", string>> = {};
    if (!name.trim()) next.name = "Nama template wajib diisi.";
    if (criteria.length === 0) next.criteria = "Tambahkan minimal satu kriteria.";
    if (criteria.some((c) => !c.label.trim())) next.criteria = "Setiap kriteria wajib memiliki label.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      await createTemplate({
        variables: {
          input: {
            name: name.trim(),
            criteria: criteria.map((c, i) => ({
              label: c.label.trim(),
              answerType: c.answerType,
              position: i + 1,
            })),
          },
        },
      });
      pushToast("success", `Template "${name.trim()}" berhasil dibuat.`);
      setName("");
      setCriteria([{ label: "", answerType: "SCALE_1_5" }]);
      onClose();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal membuat template.");
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <InputControl error={errors.name} label="Nama Template">
        <Input onChange={(e) => setName(e.target.value)} placeholder="cth: Framework Performa 2025" value={name} />
      </InputControl>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-zinc-700">Kriteria</legend>
        {errors.criteria ? (
          <p className="text-xs font-normal text-red-600">{errors.criteria}</p>
        ) : null}
        {criteria.map((criterion, index) => (
          <div className="flex items-end gap-2" key={index}>
            <div className="flex-1">
              <span className="mb-1 block text-xs text-zinc-500">Kriteria {index + 1}</span>
              <Input
                onChange={(e) => setCriterion(index, { label: e.target.value })}
                placeholder="Label kriteria"
                value={criterion.label}
              />
            </div>
            <div className="w-44">
              <span className="mb-1 block text-xs text-zinc-500">Tipe jawaban</span>
              <Select
                onChange={(e) => setCriterion(index, { answerType: e.target.value as EvaluationAnswerType })}
                options={[
                  { value: "SCALE_1_5", label: "Skala 1–5" },
                  { value: "SCALE_1_10", label: "Skala 1–10" },
                  { value: "YES_NO", label: "Ya / Tidak" },
                  { value: "FREE_TEXT", label: "Teks bebas" },
                ]}
                value={criterion.answerType}
              />
            </div>
            <button
              aria-label={`Hapus kriteria ${index + 1}`}
              className="mb-1 inline-flex h-9 items-center rounded-md border border-surface-border px-3 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
              disabled={criteria.length === 1}
              onClick={() => removeCriterion(index)}
              type="button"
            >
              Hapus
            </button>
          </div>
        ))}
      </fieldset>

      <div>
        <Button onClick={addCriterion} type="button" variant="secondary">
          + Tambah Kriteria
        </Button>
      </div>

      <div className="flex gap-2">
        <Button disabled={loading} type="submit">
          Simpan
        </Button>
        <Button onClick={onClose} type="button" variant="secondary">
          Batal
        </Button>
      </div>
    </form>
  );
}
