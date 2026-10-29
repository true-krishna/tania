"use client";

import type * as React from "react";
import { EmptyState, StatusBadge } from "@/components/DataState";
import { Table } from "@/components/Table";
import type { EvaluationTemplatesQuery } from "@/generated/graphql";

type TemplateRow = EvaluationTemplatesQuery["evaluationTemplates"][number];

type TemplatePagination = React.ComponentProps<typeof Table>["pagination"];

const ANSWER_TYPE_LABEL: Record<string, string> = {
  SCALE_1_5: "Skala 1–5",
  SCALE_1_10: "Skala 1–10",
  YES_NO: "Ya / Tidak",
  FREE_TEXT: "Teks bebas",
};

export function EvaluationTemplatesTable({
  isEmpty,
  visibleTemplates,
  pageRows,
  pagination,
}: {
  isEmpty: boolean;
  visibleTemplates: readonly TemplateRow[];
  pageRows: readonly TemplateRow[];
  pagination: TemplatePagination;
}) {
  if (isEmpty) {
    return <EmptyState message="Belum ada template evaluasi. Buat template pertama." />;
  }
  if (visibleTemplates.length === 0) {
    return <p className="text-sm text-tp-muted">Tidak ada template yang cocok dengan pencarian.</p>;
  }

  return (
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
  );
}
