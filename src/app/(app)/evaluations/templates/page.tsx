"use client";

import * as React from "react";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { useEvaluationTemplates } from "@/features/evaluations/useEvaluationTemplates";
import { EvaluationTemplateCreateForm } from "@/features/evaluations/EvaluationTemplateCreateForm";

export default function EvaluationTemplatesPage() {
  const { status, data, error } = useEvaluationTemplates();
  const { pageRows, pagination } = useTablePagination(data);
  const [modalOpen, setModalOpen] = React.useState(false);

  const actions = (
    <Button onClick={() => setModalOpen(true)} variant="primary">
      + Buat Template
    </Button>
  );

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat template."} />;

  const isEmpty = !data || data.length === 0;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        actions={actions}
        subtitle="Framework penilaian yang dikelola Admin (FR-31)."
        title="Template Evaluasi"
      />
      {isEmpty ? (
        <EmptyState message="Belum ada template evaluasi. Buat template pertama." />
      ) : (
        <Table
          caption="Daftar template evaluasi"
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
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(template) => template.id}
        />
      )}
      <Modal
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        size="lg"
        title="Buat Template Evaluasi"
      >
        <EvaluationTemplateCreateForm onClose={() => setModalOpen(false)} />
      </Modal>
    </section>
  );
}

const ANSWER_TYPE_LABEL: Record<string, string> = {
  SCALE_1_5: "Skala 1–5",
  SCALE_1_10: "Skala 1–10",
  YES_NO: "Ya / Tidak",
  FREE_TEXT: "Teks bebas",
};
