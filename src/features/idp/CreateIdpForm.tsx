"use client";

import { useMutation } from "@apollo/client";
import * as React from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import { CreateIdpDocument } from "@/generated/graphql";
import type { DevelopmentMethod } from "@/generated/graphql/types";

type ActionRow = {
  description: string;
  method: DevelopmentMethod;
  dueDate: string;
};

type FormValues = {
  employeeId: string;
  developmentObjective: string;
  currentAssessment: string;
  gapAnalysis: string;
  timelineStart: string;
  timelineEnd: string;
  successIndicators: string;
};

const EMPTY: FormValues = {
  employeeId: "",
  developmentObjective: "",
  currentAssessment: "",
  gapAnalysis: "",
  timelineStart: "",
  timelineEnd: "",
  successIndicators: "",
};

const METHOD_LABEL: Record<DevelopmentMethod, string> = {
  PROJECT_ASSIGNMENT: "Penugasan project",
  MENTORING: "Mentoring",
  TRAINING: "Training",
  CROSS_FUNCTIONAL_EXPOSURE: "Exposure lintas fungsi",
  SELF_STUDY: "Belajar mandiri",
};

const BLOCK =
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-tp-brand-red focus:ring-2 focus:ring-tp-brand-red/20";

export interface CreateIdpFormProps {
  formId: string;
  onBusyChange: (busy: boolean) => void;
  onSuccess?: () => void;
}

export function CreateIdpForm({ formId, onBusyChange, onSuccess }: CreateIdpFormProps) {
  const talents = useAssignableTalents();
  const [createIdp] = useMutation(CreateIdpDocument);
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [actions, setActions] = React.useState<ActionRow[]>([]);
  const { pushToast } = useToast();

  React.useEffect(() => {
    onBusyChange(talents.status !== "ready");
    return () => onBusyChange(false);
  }, [onBusyChange, talents.status]);

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(valuesToCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!valuesToCheck.employeeId) next.employeeId = "Talent wajib dipilih.";
    if (!valuesToCheck.developmentObjective) next.developmentObjective = "Development objective wajib diisi.";
    if (!valuesToCheck.currentAssessment) next.currentAssessment = "Penilaian kondisi saat ini wajib diisi.";
    if (!valuesToCheck.gapAnalysis) next.gapAnalysis = "Identifikasi gap wajib diisi.";
    if (!valuesToCheck.timelineStart) next.timelineStart = "Tanggal mulai wajib diisi.";
    if (!valuesToCheck.timelineEnd) next.timelineEnd = "Tanggal selesai wajib diisi.";
    if (!valuesToCheck.successIndicators) next.successIndicators = "Success indicators wajib diisi.";
    return next;
  }

  function updateAction(index: number, patch: Partial<ActionRow>) {
    setActions((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onBusyChange(true);
    try {
      await createIdp({
        variables: {
          input: {
            employeeId: values.employeeId,
            developmentObjective: values.developmentObjective,
            currentAssessment: values.currentAssessment,
            gapAnalysis: values.gapAnalysis,
            timelineStart: values.timelineStart,
            timelineEnd: values.timelineEnd,
            successIndicators: values.successIndicators,
            actions: actions
              .filter((a) => a.description.trim())
              .map((a) => ({
                description: a.description.trim(),
                method: a.method,
                dueDate: a.dueDate || undefined,
              })),
          },
        },
      });
      pushToast("success", "IDP berhasil dibuat.");
      onSuccess?.();
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal membuat IDP.");
    } finally {
      onBusyChange(false);
    }
  }

  if (talents.status === "loading") {
    return <div className="py-8 text-sm text-tp-muted">Memuat daftar talent…</div>;
  }

  if (talents.status === "error") {
    return (
      <div className="py-8 text-sm text-tp-ink-peach">
        {talents.error ?? "Gagal memuat talent."}
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" id={formId} onSubmit={onSubmit}>
      <InputControl error={errors.employeeId} label="Talent">
        <Select
          onChange={(e) => set("employeeId", e.target.value)}
          options={[
            { value: "", label: "— pilih talent (assignable) —" },
            ...(talents.data ?? []).map((emp) => ({
              value: emp.id,
              label: `${emp.fullName} (${emp.nomorInduk ?? "—"})`,
            })),
          ]}
          value={values.employeeId}
        />
      </InputControl>

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Komponen Plan</h2>
        <InputControl error={errors.developmentObjective} label="Development Objective">
          <textarea
            className={BLOCK}
            onChange={(e) => set("developmentObjective", e.target.value)}
            placeholder="Target peran/kapabilitas spesifik yang ingin dicapai…"
            rows={3}
            value={values.developmentObjective}
          />
        </InputControl>
        <InputControl error={errors.currentAssessment} label="Penilaian Kondisi Saat Ini">
          <textarea
            className={BLOCK}
            onChange={(e) => set("currentAssessment", e.target.value)}
            placeholder="Kekuatan & keterbatasan talent saat ini…"
            rows={3}
            value={values.currentAssessment}
          />
        </InputControl>
        <InputControl error={errors.gapAnalysis} label="Identifikasi Gap">
          <textarea
            className={BLOCK}
            onChange={(e) => set("gapAnalysis", e.target.value)}
            placeholder="Selisih kondisi saat ini vs kebutuhan peran…"
            rows={3}
            value={values.gapAnalysis}
          />
        </InputControl>
        <InputControl error={errors.successIndicators} label="Success Indicators">
          <textarea
            className={BLOCK}
            onChange={(e) => set("successIndicators", e.target.value)}
            placeholder="Kriteria yang menunjukkan pengembangan berhasil…"
            rows={3}
            value={values.successIndicators}
          />
        </InputControl>
        <div className="grid grid-cols-2 gap-4">
          <InputControl error={errors.timelineStart} label="Timeline Mulai">
            <Input onChange={(e) => set("timelineStart", e.target.value)} type="date" value={values.timelineStart} />
          </InputControl>
          <InputControl error={errors.timelineEnd} label="Timeline Selesai">
            <Input onChange={(e) => set("timelineEnd", e.target.value)} type="date" value={values.timelineEnd} />
          </InputControl>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Aksi Pengembangan (opsional)
        </h2>
        {actions.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada aksi. Tambahkan di bawah, atau lewati dan tambahkan nanti.</p>
        ) : null}
        {actions.map((action, index) => (
          <div className="flex flex-col gap-3 rounded-md border border-zinc-100 p-3" key={index}>
            <InputControl label="Deskripsi / tindakan">
              <Input
                onChange={(e) => updateAction(index, { description: e.target.value })}
                placeholder="Mis. Ikuti training Go lanjutan"
                value={action.description}
              />
            </InputControl>
            <div className="grid grid-cols-2 gap-3">
              <InputControl label="Metode">
                <Select
                  onChange={(e) => updateAction(index, { method: e.target.value as DevelopmentMethod })}
                  options={(Object.keys(METHOD_LABEL) as DevelopmentMethod[]).map((m) => ({
                    value: m,
                    label: METHOD_LABEL[m],
                  }))}
                  value={action.method}
                />
              </InputControl>
              <InputControl label="Tenggat (opsional)">
                <Input
                  onChange={(e) => updateAction(index, { dueDate: e.target.value })}
                  type="date"
                  value={action.dueDate}
                />
              </InputControl>
            </div>
            <div>
              <Button
                className="text-red-600 hover:bg-red-50"
                onClick={() => setActions((rows) => rows.filter((_, i) => i !== index))}
                type="button"
                variant="ghost"
              >
                Hapus aksi
              </Button>
            </div>
          </div>
        ))}
        <div>
          <Button
            onClick={() =>
              setActions((rows) => [
                ...rows,
                { description: "", method: "TRAINING", dueDate: "" },
              ])
            }
            type="button"
            variant="secondary"
          >
            + Tambah aksi
          </Button>
        </div>
      </Card>
    </form>
  );
}
