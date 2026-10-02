"use client";

import Link from "next/link";
import { BoardTable } from "@/components/BoardTable";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useEvaluationTemplates } from "@/features/evaluations/useEvaluationTemplates";

/**
 * Evaluation templates (Admin) — US7 / FR-31.
 * Lists every evaluation framework with its criteria (fixed answer types).
 * Changing a template only affects future periods (FR-31).
 */
export default function EvaluationTemplatesPage() {
  const { status, data, error } = useEvaluationTemplates();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat template."} />;
  if (!data || data.length === 0)
    return (
      <section className="flex flex-col gap-4">
        <PageHeader
          title="Template Evaluasi"
          subtitle="Framework penilaian yang dikelola Admin (FR-31)."
          actions={
            <Link
              href="/evaluations/templates/new"
              className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              + Buat Template
            </Link>
          }
        />
        <EmptyState message="Belum ada template evaluasi. Buat template pertama." />
      </section>
    );

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Template Evaluasi"
        subtitle="Framework penilaian yang dikelola Admin (FR-31)."
        actions={
          <Link
            href="/evaluations/templates/new"
            className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            + Buat Template
          </Link>
        }
      />
      <BoardTable
        caption="Daftar template evaluasi"
        columns={[
          { key: "name", label: "Nama" },
          { key: "criteria", label: "Kriteria" },
          { key: "status", label: "Status" },
        ]}
      >
        {data.map((template) => (
          <tr key={template.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
            <td className="px-4 py-2.5 text-zinc-900">{template.name}</td>
            <td className="px-4 py-2.5">
              <ul className="flex flex-col gap-0.5 text-xs text-zinc-600">
                {template.criteria.map((c) => (
                  <li key={c.id}>
                    {c.position}. {c.label} —{" "}
                    <span className="text-zinc-400">{ANSWER_TYPE_LABEL[c.answerType]}</span>
                  </li>
                ))}
              </ul>
            </td>
            <td className="px-4 py-2.5">
              <StatusBadge active={template.isActive} />
            </td>
          </tr>
        ))}
      </BoardTable>
      <p className="text-xs text-zinc-500">{data.length} template ditampilkan.</p>
    </section>
  );
}

const ANSWER_TYPE_LABEL: Record<string, string> = {
  SCALE_1_5: "Skala 1–5",
  SCALE_1_10: "Skala 1–10",
  YES_NO: "Ya / Tidak",
  FREE_TEXT: "Teks bebas",
};