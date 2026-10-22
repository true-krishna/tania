"use client";

import Link from "next/link";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { useEvaluationPeriods } from "@/features/evaluations/useEvaluationPeriods";
import { PeriodStateBadge } from "@/features/evaluations/EvaluationBadges";
import { EVALUATION_PERIOD_NEW } from "@/lib/constants/routes";

export default function EvaluationPeriodsPage() {
  const { status, data, error } = useEvaluationPeriods();
  const { pageRows, pagination } = useTablePagination(data);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat periode."} />;
  if (!data || data.length === 0)
    return (
      <section className="flex flex-col gap-4">
        <PageHeader
          actions={
            <Link className="no-underline" href={EVALUATION_PERIOD_NEW}>
            <Button variant="primary">+ Buat Periode</Button>
          </Link>
          }
          subtitle="Kelola periode evaluasi performa (Admin)."
          title="Periode Evaluasi"
        />
        <EmptyState message="Belum ada periode evaluasi. Buat periode pertama." />
      </section>
    );

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        actions={
          <Link className="no-underline" href={EVALUATION_PERIOD_NEW}>
            <Button variant="primary">+ Buat Periode</Button>
          </Link>
        }
        subtitle="Kelola periode evaluasi performa (Admin)."
        title="Periode Evaluasi"
      />
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
    </section>
  );
}