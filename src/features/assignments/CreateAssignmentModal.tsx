"use client";

import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import { CreateAssignmentDocument } from "@/generated/graphql";
import { mapAssignmentSubmitError } from "@/lib/errors";

type FormValues = {
  employeeId: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
};

const EMPTY: FormValues = {
  employeeId: "",
  projectId: "",
  periodStart: "",
  periodEnd: "",
};

type CreateAssignmentModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function CreateAssignmentModal({ open, onClose, onCreated }: CreateAssignmentModalProps) {
  const projects = useProjects({ skip: !open });
  const talents = useAssignableTalents({ skip: !open });
  const [createAssignment, { loading }] = useMutation(CreateAssignmentDocument);
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [wasOpen, setWasOpen] = React.useState(open);
  const { pushToast } = useToast();
  const formId = React.useId();

  if (open && !wasOpen) {
    setWasOpen(true);
    setValues(EMPTY);
    setErrors({});
    setFormError(null);
  }
  if (!open && wasOpen) {
    setWasOpen(false);
  }

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(valuesToCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!valuesToCheck.employeeId) next.employeeId = "Talent wajib dipilih.";
    if (!valuesToCheck.projectId) next.projectId = "Project wajib dipilih.";
    if (!valuesToCheck.periodStart) next.periodStart = "Tanggal mulai wajib diisi.";
    if (
      valuesToCheck.periodEnd &&
      valuesToCheck.periodStart &&
      valuesToCheck.periodEnd < valuesToCheck.periodStart
    ) {
      next.periodEnd = "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.";
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      const result = await createAssignment({
        variables: {
          input: {
            employeeId: values.employeeId,
            projectId: values.projectId,
            periodStart: values.periodStart,
            periodEnd: values.periodEnd || undefined,
          },
        },
        refetchQueries: ["Assignments"],
      });
      if (result.data?.createAssignment) {
        const talentName = talents.data?.find((t) => t.id === values.employeeId)?.fullName;
        const projectName = projects.data?.find((p) => p.id === values.projectId)?.name;
        pushToast(
          "success",
          `Assignment ${talentName ?? ""} → ${projectName ?? ""} berhasil dibuat.`,
        );
        onCreated?.();
        onClose();
      }
    } catch (err) {
      const submitError = mapAssignmentSubmitError(
        err instanceof ApolloError ? err : null,
        "Gagal membuat assignment.",
      );
      if (submitError.field && submitError.field in values) {
        setErrors((prev) => ({
          ...prev,
          [submitError.field as keyof FormValues]: submitError.message,
        }));
      } else {
        setFormError(submitError.message);
      }
    }
  }

  const loadingData = projects.status === "loading" || talents.status === "loading";
  const dataError =
    projects.status === "error"
      ? projects.error ?? "Gagal memuat project."
      : talents.status === "error"
        ? talents.error ?? "Gagal memuat talent."
        : null;

  return (
    <Modal onClose={onClose} open={open} size="md">
      <ModalTitle>Buat Assignment</ModalTitle>
      <ModalContent>
        <form
          aria-label="Buat Assignment"
          className="flex flex-col gap-4"
          id={formId}
          onSubmit={onSubmit}
        >
          {loadingData ? (
            <p className="text-sm text-tp-muted">Memuat data…</p>
          ) : dataError ? (
            <p className="text-sm text-red-700" role="alert">
              {dataError}
            </p>
          ) : (
            <>
              {formError ? (
                <p className="text-sm text-red-700" role="alert">
                  {formError}
                </p>
              ) : null}
              <InputControl error={errors.employeeId} label="Talent">
                <Select
                  onChange={(e) => set("employeeId", e.target.value)}
                  options={[
                    { value: "", label: "— pilih talent (assignable) —" },
                    ...(talents.data ?? []).map((emp) => ({
                      value: emp.id,
                      label: `${emp.fullName} (${emp.nomorInduk ?? "—"})`,
                    })),
                  ]}
                  value={values.employeeId}
                />
              </InputControl>
              <InputControl error={errors.projectId} label="Project">
                <Select
                  onChange={(e) => set("projectId", e.target.value)}
                  options={[
                    { value: "", label: "— pilih project —" },
                    ...(projects.data ?? [])
                      .filter((p) => p.isActive)
                      .map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  value={values.projectId}
                />
              </InputControl>
              <InputControl error={errors.periodStart} label="Tanggal Mulai">
                <Input
                  onChange={(e) => set("periodStart", e.target.value)}
                  type="date"
                  value={values.periodStart}
                />
              </InputControl>
              <InputControl
                error={errors.periodEnd}
                helper="(opsional, kosong = aktif)"
                label="Tanggal Selesai"
              >
                <Input
                  onChange={(e) => set("periodEnd", e.target.value)}
                  type="date"
                  value={values.periodEnd}
                />
              </InputControl>
            </>
        )}
      </form>
      </ModalContent>
      <ModalActions>
        <Button
          disabled={loading || loadingData}
          onClick={onClose}
          type="button"
          variant="secondary"
        >
          Batal
        </Button>
        <Button
          disabled={loading || loadingData || !!dataError}
          form={formId}
          type="submit"
        >
          Simpan
        </Button>
      </ModalActions>
    </Modal>
  );
}
