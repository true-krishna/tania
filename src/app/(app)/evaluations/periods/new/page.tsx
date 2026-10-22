"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { useEvaluationTemplates } from "@/features/evaluations/useEvaluationTemplates";
import { CreateEvaluationPeriodDocument } from "@/generated/graphql";
import { EVALUATION_PERIODS } from "@/lib/constants/routes";

type FormValues = { name: string; templateId: string; startDate: string; endDate: string };
const EMPTY: FormValues = { name: "", templateId: "", startDate: "", endDate: "" };

export default function NewEvaluationPeriodPage() {
  const templates = useEvaluationTemplates();
  const [createPeriod, { loading }] = useMutation(CreateEvaluationPeriodDocument);
  const { pushToast } = useToast();
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});

  if (templates.status === "loading") return <LoadingState />;
  if (templates.status === "error")
    return <ErrorState message={templates.error ?? "Gagal memuat template."} />;

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(v: FormValues) {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!v.name) next.name = "Nama periode wajib diisi.";
    if (!v.templateId) next.templateId = "Template evaluasi wajib dipilih.";
    if (!v.startDate) next.startDate = "Tanggal mulai wajib diisi.";
    if (!v.endDate) next.endDate = "Tanggal selesai wajib diisi.";
    if (v.startDate && v.endDate && v.endDate < v.startDate)
      next.endDate = "Tanggal selesai harus setelah tanggal mulai.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      await createPeriod({
        variables: {
          input: {
            name: values.name,
            templateId: values.templateId,
            startDate: values.startDate,
            endDate: values.endDate,
          },
        },
      });
      pushToast("success", `Periode "${values.name}" berhasil dibuat.`);
      setValues(EMPTY);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal membuat periode.");
    }
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <PageHeader subtitle="Periode terpinned ke satu template (Admin)." title="Buat Periode Evaluasi" />
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <InputControl error={errors.name} label="Nama Periode">
          <Input onChange={(e) => set("name", e.target.value)} placeholder="cth: Q3 2025" value={values.name} />
        </InputControl>
        <InputControl error={errors.templateId} label="Template Evaluasi">
          <Select
            onChange={(e) => set("templateId", e.target.value)}
            options={[
              { value: "", label: "— pilih template —" },
              ...(templates.data ?? []).map((t) => ({ value: t.id, label: t.name })),
            ]}
            value={values.templateId}
          />
        </InputControl>
        <div className="grid grid-cols-2 gap-3">
          <InputControl error={errors.startDate} label="Tanggal Mulai">
            <Input onChange={(e) => set("startDate", e.target.value)} type="date" value={values.startDate} />
          </InputControl>
          <InputControl error={errors.endDate} label="Tanggal Selesai">
            <Input onChange={(e) => set("endDate", e.target.value)} type="date" value={values.endDate} />
          </InputControl>
        </div>
        <div className="flex gap-2">
          <Button disabled={loading} type="submit">
            Simpan
          </Button>
          <Link
            className="inline-flex items-center rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
            href={EVALUATION_PERIODS}
          >
            Batal
          </Link>
        </div>
      </form>
    </section>
  );
}
