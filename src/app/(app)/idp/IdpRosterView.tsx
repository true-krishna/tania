"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import { CreateIdpForm } from "@/features/idp/CreateIdpForm";
import { useIdps } from "@/features/idp/useIdps";
import type { IdpStatus } from "@/generated/graphql/types";
import { IdpRosterTable } from "./IdpRosterTable";

export function IdpRosterView({ managing }: { managing: boolean }) {
  const [status, setStatus] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const formId = React.useId();
  const {
    status: query,
    data,
    error,
    refetch,
  } = useIdps({
    status: (status || undefined) as IdpStatus | undefined,
  });
  const { pageRows, pagination, resetPage } = useTablePagination(data);

  function handleCreateSuccess() {
    setCreateOpen(false);
    void refetch();
  }

  function changeFilter(key: string, value: string) {
    if (key === "status") setStatus(value);
    resetPage();
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        actions={
          managing ? (
            <Button onClick={() => setCreateOpen(true)} variant="primary">
              + Buat IDP
            </Button>
          ) : undefined
        }
        subtitle={
          managing
            ? "Kelola Individual Development Plan talent dalam chapter Anda."
            : "Individual Development Plan talent (hanya baca)."
        }
        title="IDP"
      />

      <TableFilterBar
        fields={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "", label: "Semua" },
              { value: "IN_PROGRESS", label: "Berjalan" },
              { value: "NEEDS_REVIEW", label: "Perlu review" },
              { value: "COMPLETED", label: "Selesai" },
            ],
            type: "select",
          },
        ]}
        onChange={changeFilter}
        values={{ status }}
      />

      <IdpRosterTable
        data={data}
        error={error}
        pageRows={pageRows}
        pagination={pagination}
        query={query}
      />

      <Modal onClose={() => setCreateOpen(false)} open={createOpen} size="lg">
        <ModalTitle subtitle="Rancang Individual Development Plan untuk talent (Chapter).">
          Buat IDP
        </ModalTitle>
        <ModalContent>
          <CreateIdpForm
            formId={formId}
            onBusyChange={setSubmitting}
            onSuccess={handleCreateSuccess}
          />
        </ModalContent>
        <ModalActions>
          <Button disabled={submitting} form={formId} type="submit">
            Simpan
          </Button>
          <Button onClick={() => setCreateOpen(false)} type="button" variant="secondary">
            Batal
          </Button>
        </ModalActions>
      </Modal>
    </section>
  );
}
