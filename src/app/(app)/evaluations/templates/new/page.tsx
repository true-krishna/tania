"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { CreateEvaluationTemplateDocument } from "@/generated/graphql";
import type { EvaluationAnswerType } from "@/generated/graphql/types";

type CriterionRow = { label: string; answerType: EvaluationAnswerType };

/**
 * Create evaluation template (Admin) — US7 / FR-31.
 * A template is a named list of criteria, each with a fixed answer type and an
 * implicit order (array index). Answer types come from the served enum.
 */
export default function NewEvaluationTemplatePage() {
  const [createTemplate, { loading }] = useMutation(CreateEvaluationTemplateDocument);
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
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal membuat template.");
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-4">
      <PageHeader title="Buat Template Evaluasi" subtitle="Daftar kriteria dengan tipe jawaban fixed (Admin)." />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Label error={errors.name}>
          Nama Template
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Framework Performa 2025" />
        </Label>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-zinc-700">Kriteria</legend>
          {errors.criteria ? (
            <p className="text-xs font-normal text-red-600">{errors.criteria}</p>
          ) : null}
          {criteria.map((criterion, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <span className="mb-1 block text-xs text-zinc-500">Kriteria {index + 1}</span>
                <Input
                  value={criterion.label}
                  onChange={(e) => setCriterion(index, { label: e.target.value })}
                  placeholder="Label kriteria"
                />
              </div>
              <div className="w-44">
                <span className="mb-1 block text-xs text-zinc-500">Tipe jawaban</span>
                <Select
                  value={criterion.answerType}
                  onChange={(e) => setCriterion(index, { answerType: e.target.value as EvaluationAnswerType })}
                >
                  <option value="SCALE_1_5">Skala 1–5</option>
                  <option value="SCALE_1_10">Skala 1–10</option>
                  <option value="YES_NO">Ya / Tidak</option>
                  <option value="FREE_TEXT">Teks bebas</option>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => removeCriterion(index)}
                disabled={criteria.length === 1}
                className="mb-1 inline-flex h-9 items-center rounded-md border border-surface-border px-3 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
                aria-label={`Hapus kriteria ${index + 1}`}
              >
                Hapus
              </button>
            </div>
          ))}
        </fieldset>

        <div>
          <Button type="button" variant="secondary" onClick={addCriterion}>
            + Tambah Kriteria
          </Button>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            Simpan
          </Button>
          <Link
            href="/evaluations/templates"
            className="inline-flex items-center rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </section>
  );
}

function Label({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
      {children}
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}