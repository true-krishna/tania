"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { useEvaluationTemplates } from "@/features/evaluations/useEvaluationTemplates";
import { CreateEvaluationPeriodDocument, EvaluationPeriodsDocument } from "@/generated/graphql";

type FormValues = { name: string; templateId: string; startDate: string; endDate: string };
const EMPTY: FormValues = { name: "", templateId: "", startDate: "", endDate: "" };

interface EvaluationPeriodCreateFormProps {
  formId: string;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
}

export function EvaluationPeriodCreateForm({
  formId,
  onBusyChange,
  onClose,
}: EvaluationPeriodCreateFormProps) {
  const templates = useEvaluationTemplates();
  const [createPeriod] = useMutation(CreateEvaluationPeriodDocument, {
    refetchQueries: [EvaluationPeriodsDocument],
  });
  const { pushToast } = useToast();
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});

  React.useEffect(() => {
    onBusyChange(templates.status !== "ready");
    return () => onBusyChange(false);
  }, [onBusyChange, templates.status]);

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
    onBusyChange(true);
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
      onClose();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal membuat periode.");
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" id={formId} onSubmit={onSubmit}>
      <InputControl error={errors.name} label="Nama Periode">
        <Input
          onChange={(e) => set("name", e.target.value)}
          placeholder="cth: Q3 2025"
          value={values.name}
        />
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
          <Input
            onChange={(e) => set("startDate", e.target.value)}
            type="date"
            value={values.startDate}
          />
        </InputControl>
        <InputControl error={errors.endDate} label="Tanggal Selesai">
          <Input
            onChange={(e) => set("endDate", e.target.value)}
            type="date"
            value={values.endDate}
          />
        </InputControl>
      </div>
    </form>
  );
}
