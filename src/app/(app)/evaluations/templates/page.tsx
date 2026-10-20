"use client";

import Link from "next/link";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { useEvaluationTemplates } from "@/features/evaluations/useEvaluationTemplates";
import { EVALUATION_TEMPLATE_NEW } from "@/lib/constants/routes";

/**
 * Evaluation templates (Admin) — US7 / FR-31.
 * Lists every evaluation framework with its criteria (fixed answer types).
 * Changing a template only affects future periods (FR-31).
 */
export default function EvaluationTemplatesPage() {
  const { status, data, error } = useEvaluationTemplates();
  const { pageRows, pagination } = useTablePagination(data);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat template."} />;
  if (!data || data.length === 0)
    return (
      <section className="flex flex-col gap-4">
        <PageHeader
          title="Template Evaluasi"
          subtitle="Framework penilaian yang dikelola Admin (FR-31)."
          actions={
            <Link href={EVALUATION_TEMPLATE_NEW} className="no-underline">
            <Button variant="primary">+ Buat Template</Button>
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
          <Link href={EVALUATION_TEMPLATE_NEW} className="no-underline">
            <Button variant="primary">+ Buat Template</Button>
          </Link>
        }
      />
      <Table
        caption="Daftar template evaluasi"
        rowKey={(template) => template.id}
        dataSource={pageRows}
        pagination={pagination}
        columns={[
          {
            key: "name",
            title: "Nama",
            className: "text-zinc-900",
            render: (_value, template) => template.name,
          },
          {
            key: "criteria",
            title: "Kriteria",
            render: (_value, template) =>
              template.criteria.length ? (
                <ul className="flex flex-col gap-0.5 text-xs text-zinc-600">
                  {template.criteria.map((c) => (
                    <li key={c.id}>
                      {c.position}. {c.label} —{" "}
                      <span className="text-zinc-400">{ANSWER_TYPE_LABEL[c.answerType]}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                "-"
              ),
          },
          {
            key: "status",
            title: "Status",
            render: (_value, template) => <StatusBadge active={template.isActive} />,
          },
        ]}
      />
    </section>
  );
}

const ANSWER_TYPE_LABEL: Record<string, string> = {
  SCALE_1_5: "Skala 1–5",
  SCALE_1_10: "Skala 1–10",
  YES_NO: "Ya / Tidak",
  FREE_TEXT: "Teks bebas",
};