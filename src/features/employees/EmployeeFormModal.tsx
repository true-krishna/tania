"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { useEmployee } from "@/features/employees/useEmployee";
import { CreateEmployeeForm } from "./CreateEmployeeForm";
import { EditEmployeeForm } from "./EditEmployeeForm";
import type { EmployeeFormMode } from "./employeeFormValues";

type EmployeeFormModalProps = {
  employeeId?: string;
  mode: EmployeeFormMode;
  onClose: () => void;
  open: boolean;
};

export function EmployeeFormModal({ employeeId, mode, onClose, open }: EmployeeFormModalProps) {
  const formId = React.useId();
  const [submitting, setSubmitting] = React.useState(false);
  const isEdit = mode === "edit";
  const {
    status: employeeStatus,
    data: employee,
    error: employeeError,
  } = useEmployee(isEdit && employeeId ? employeeId : "");

  const title = isEdit ? `Ubah Data — ${employee?.fullName ?? ""}` : "Tambah Karyawan";
  const subtitle = isEdit
    ? "NIK selalu tampil tersamar; isi NIK baru hanya bila ingin menggantinya."
    : "Lengkapi data diri karyawan baru. Identitas kepegawaian (nomor induk) diisi pada kontrak.";

  let content: React.ReactNode;
  if (!isEdit) {
    content = <CreateEmployeeForm formId={formId} onBusyChange={setSubmitting} onClose={onClose} />;
  } else if (employeeStatus === "loading") {
    content = <LoadingState />;
  } else if (employeeStatus === "error") {
    content = <ErrorState message={employeeError ?? "Gagal memuat data karyawan."} />;
  } else if (!employee) {
    content = <ErrorState message="Karyawan tidak ditemukan." />;
  } else {
    content = (
      <EditEmployeeForm
        employee={employee}
        employeeId={employeeId ?? ""}
        formId={formId}
        onBusyChange={setSubmitting}
        onClose={onClose}
      />
    );
  }

  const hasForm = !isEdit || (employeeStatus === "ready" && Boolean(employee));

  return (
    <Modal onClose={onClose} open={open} size="lg">
      <ModalTitle subtitle={subtitle}>{title}</ModalTitle>
      <ModalContent>{content}</ModalContent>
      {hasForm ? (
        <ModalActions>
          <Button onClick={onClose} type="button" variant="secondary">
            Batal
          </Button>
          <Button disabled={submitting} form={formId} type="submit">
            Simpan
          </Button>
        </ModalActions>
      ) : null}
    </Modal>
  );
}
