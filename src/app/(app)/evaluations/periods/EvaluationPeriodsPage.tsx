"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import { useEvaluationPeriods } from "@/features/evaluations/useEvaluationPeriods";
import { EvaluationPeriodCreateForm } from "@/features/evaluations/EvaluationPeriodCreateForm";
import { EvaluationPeriodsTable } from "./EvaluationPeriodsTable";

export default function EvaluationPeriodsPage() {
  const { status, data, error } = useEvaluationPeriods();
  const [search, setSearch] = React.useState("");
  const visiblePeriods = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return data ?? [];
    return (data ?? []).filter((period) => period.name.toLowerCase().includes(needle));
  }, [data, search]);
  const { pageRows, pagination } = useTablePagination(visiblePeriods);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const formId = React.useId();

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
      {isEmpty ? null : (
        <TableFilterBar
          search={{
            label: "Cari periode",
            onChange: setSearch,
            placeholder: "Cari nama periode…",
            value: search,
          }}
        />
      )}
      <EvaluationPeriodsTable
        isEmpty={isEmpty}
        pageRows={pageRows}
        pagination={pagination}
        visiblePeriods={visiblePeriods}
      />
      <Modal onClose={() => setModalOpen(false)} open={modalOpen}>
        <ModalTitle>Buat Periode Evaluasi</ModalTitle>
        <ModalContent>
          <EvaluationPeriodCreateForm
            formId={formId}
            onBusyChange={setSubmitting}
            onClose={() => setModalOpen(false)}
          />
        </ModalContent>
        <ModalActions>
          <Button disabled={submitting} form={formId} type="submit">
            Simpan
          </Button>
          <Button onClick={() => setModalOpen(false)} type="button" variant="secondary">
            Batal
          </Button>
        </ModalActions>
      </Modal>
    </section>
  );
}
