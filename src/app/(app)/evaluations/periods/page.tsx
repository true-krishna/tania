"use client";

import * as React from "react";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Modal } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { useEvaluationPeriods } from "@/features/evaluations/useEvaluationPeriods";
import { PeriodStateBadge } from "@/features/evaluations/EvaluationBadges";
import { EvaluationPeriodCreateForm } from "@/features/evaluations/EvaluationPeriodCreateForm";

export default function EvaluationPeriodsPage() {
  const { status, data, error } = useEvaluationPeriods();
  const { pageRows, pagination } = useTablePagination(data);
  const [modalOpen, setModalOpen] = React.useState(false);

  const actions = (
    <Button onClick={() => setModalOpen(true)} variant="primary">
      + Buat Periode
    </Button>
  );

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat periode."} />;

  const isEmpty = !data || data.length === 0;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        actions={actions}
        subtitle="Kelola periode evaluasi performa (Admin)."
        title="Periode Evaluasi"
      />
      {isEmpty ? (
        <EmptyState message="Belum ada periode evaluasi. Buat periode pertama." />
      ) : (
        <Table
          caption="Daftar periode evaluasi"
          columns={[
            {
              key: "name",
              title: "Nama",
              className: "text-zinc-900",
              render: (_value, period) => period.name,
            },
            {
              key: "range",
              title: "Rentang",
              className: "text-zinc-600",
              render: (_value, period) => (
                <>
                  {period.startDate} — {period.endDate}
                </>
              ),
            },
            {
              key: "template",
              title: "Template",
              className: "text-zinc-600",
              render: (_value, period) => period.template.name,
            },
            {
              key: "state",
              title: "State",
              render: (_value, period) => <PeriodStateBadge state={period.state} />,
            },
            {
              key: "status",
              title: "Status",
              render: (_value, period) => <StatusBadge active={period.isActive} />,
            },
          ]}
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(period) => period.id}
        />
      )}
      <Modal onClose={() => setModalOpen(false)} open={modalOpen} title="Buat Periode Evaluasi">
        <EvaluationPeriodCreateForm onClose={() => setModalOpen(false)} />
      </Modal>
    </section>
  );
}
