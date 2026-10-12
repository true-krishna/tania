"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ToastStack } from "@/components/Toast";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import type { DevelopmentMethod } from "@/generated/graphql/types";
import { CreateIdpDocument } from "@/generated/graphql";

type ToastItem = { id: number; variant: "error" | "success"; message: string };

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
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-100";

function Label({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
      {children}
      {error ? <span className="text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}

export default function NewIdpPage() {
  const talents = useAssignableTalents();
  const [createIdp, { data, error, loading }] = useMutation(CreateIdpDocument);
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [actions, setActions] = React.useState<ActionRow[]>([]);
  const [submitted, setSubmitted] = React.useState(false);

  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const toastId = React.useRef(0);

  function addToast(variant: ToastItem["variant"], message: string) {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => dismissToast(id), 4000);
    return id;
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (talents.status === "loading") return <LoadingState />;
  if (talents.status === "error")
    return <ErrorState message={talents.error ?? "Gagal memuat talent."} />;

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
      setSubmitted(true);
      addToast("success", "IDP berhasil dibuat.");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal membuat IDP.");
    }
  }

  if (submitted && !loading) {
    const talentName = talents.data?.find((e) => e.id === values.employeeId)?.fullName;
    const ok = Boolean(data?.createIdp);
    return (
      <section className="flex max-w-xl flex-col gap-4">
        <div
          className={`rounded-md border p-4 text-sm ${
            ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {ok
            ? `IDP untuk ${talentName ?? ""} berhasil dibuat.`
            : error?.message ?? "Terjadi kesalahan saat membuat IDP."}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setActions([]);
            setSubmitted(false);
          }}
        >
          Buat IDP lain
        </Button>
      </section>
    );
  }

  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <PageHeader title="Buat IDP" subtitle="Rancang Individual Development Plan untuk talent (Chapter)." />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Label error={errors.employeeId}>
          Talent
          <Select value={values.employeeId} onChange={(e) => set("employeeId", e.target.value)}>
            <option value="">— pilih talent (assignable) —</option>
            {talents.data?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.nomorInduk ?? "—"})
              </option>
            ))}
          </Select>
        </Label>

        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Komponen Plan</h2>
          <Label error={errors.developmentObjective}>
            Development Objective
            <textarea
              className={BLOCK}
              rows={3}
              value={values.developmentObjective}
              onChange={(e) => set("developmentObjective", e.target.value)}
              placeholder="Target peran/kapabilitas spesifik yang ingin dicapai…"
            />
          </Label>
          <Label error={errors.currentAssessment}>
            Penilaian Kondisi Saat Ini
            <textarea
              className={BLOCK}
              rows={3}
              value={values.currentAssessment}
              onChange={(e) => set("currentAssessment", e.target.value)}
              placeholder="Kekuatan & keterbatasan talent saat ini…"
            />
          </Label>
          <Label error={errors.gapAnalysis}>
            Identifikasi Gap
            <textarea
              className={BLOCK}
              rows={3}
              value={values.gapAnalysis}
              onChange={(e) => set("gapAnalysis", e.target.value)}
              placeholder="Selisih kondisi saat ini vs kebutuhan peran…"
            />
          </Label>
          <Label error={errors.successIndicators}>
            Success Indicators
            <textarea
              className={BLOCK}
              rows={3}
              value={values.successIndicators}
              onChange={(e) => set("successIndicators", e.target.value)}
              placeholder="Kriteria yang menunjukkan pengembangan berhasil…"
            />
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Label error={errors.timelineStart}>
              Timeline Mulai
              <Input type="date" value={values.timelineStart} onChange={(e) => set("timelineStart", e.target.value)} />
            </Label>
            <Label error={errors.timelineEnd}>
              Timeline Selesai
              <Input type="date" value={values.timelineEnd} onChange={(e) => set("timelineEnd", e.target.value)} />
            </Label>
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
            <div key={index} className="flex flex-col gap-3 rounded-md border border-zinc-100 p-3">
              <Label>
                Deskripsi / tindakan
                <Input
                  value={action.description}
                  onChange={(e) => updateAction(index, { description: e.target.value })}
                  placeholder="Mis. Ikuti training Go lanjutan"
                />
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Label>
                  Metode
                  <Select
                    value={action.method}
                    onChange={(e) => updateAction(index, { method: e.target.value as DevelopmentMethod })}
                  >
                    {(Object.keys(METHOD_LABEL) as DevelopmentMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {METHOD_LABEL[m]}
                      </option>
                    ))}
                  </Select>
                </Label>
                <Label>
                  Tenggat (opsional)
                  <Input
                    type="date"
                    value={action.dueDate}
                    onChange={(e) => updateAction(index, { dueDate: e.target.value })}
                  />
                </Label>
              </div>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setActions((rows) => rows.filter((_, i) => i !== index))}
                >
                  Hapus aksi
                </Button>
              </div>
            </div>
          ))}
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setActions((rows) => [
                  ...rows,
                  { description: "", method: "TRAINING", dueDate: "" },
                ])
              }
            >
              + Tambah aksi
            </Button>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            Simpan
          </Button>
          <Link
            href="/idp"
            className="inline-flex items-center rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </section>
  );
}