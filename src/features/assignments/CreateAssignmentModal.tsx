"use client";

import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import { CreateAssignmentDocument } from "@/generated/graphql";
import { mapAssignmentSubmitError } from "@/lib/errors";
import { AssignmentFormFields } from "./AssignmentFormFields";

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
  const projectDataError =
    projects.status === "error" ? (projects.error ?? "Gagal memuat project.") : null;
  const talentDataError =
    talents.status === "error" ? (talents.error ?? "Gagal memuat talent.") : null;
  const dataError = projectDataError ?? talentDataError;

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
          <AssignmentFormFields
            dataError={dataError}
            errors={errors}
            formError={formError}
            loading={loadingData}
            onChange={set}
            projects={projects.data ?? []}
            talents={talents.data ?? []}
            values={values}
          />
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
        <Button disabled={loading || loadingData || !!dataError} form={formId} type="submit">
          Simpan
        </Button>
      </ModalActions>
    </Modal>
  );
}
