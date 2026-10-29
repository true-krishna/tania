"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import { useEvaluationTemplates } from "@/features/evaluations/useEvaluationTemplates";
import { EvaluationTemplateCreateForm } from "@/features/evaluations/EvaluationTemplateCreateForm";
import { EvaluationTemplatesTable } from "./EvaluationTemplatesTable";

export default function EvaluationTemplatesPage() {
  const { status, data, error } = useEvaluationTemplates();
  const [search, setSearch] = React.useState("");
  const visibleTemplates = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return data ?? [];
    return (data ?? []).filter((template) => template.name.toLowerCase().includes(needle));
  }, [data, search]);
  const { pageRows, pagination } = useTablePagination(visibleTemplates);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const formId = React.useId();

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
      {isEmpty ? null : (
        <TableFilterBar
          search={{
            label: "Cari template",
            onChange: setSearch,
            placeholder: "Cari nama template…",
            value: search,
          }}
        />
      )}
      <EvaluationTemplatesTable
        isEmpty={isEmpty}
        pageRows={pageRows}
        pagination={pagination}
        visibleTemplates={visibleTemplates}
      />
      <Modal onClose={() => setModalOpen(false)} open={modalOpen} size="lg">
        <ModalTitle>Buat Template Evaluasi</ModalTitle>
        <ModalContent>
          <EvaluationTemplateCreateForm
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
