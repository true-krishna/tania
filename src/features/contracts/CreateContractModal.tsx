"use client";

import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { CreateContractModalFrame } from "./CreateContractModalFrame";
import { Button } from "@/components/Button";
import { CreateContractFields } from "./CreateContractFields";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useToast } from "@/components/Toast";
import { useEmployees } from "@/features/employees/useEmployees";
import { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import {
  CreateEmploymentContractDocument,
  EmploymentContractsDocument,
  type BandPosition,
  type ContractType,
  type CreateEmploymentContractInput,
  type WorkLocation,
} from "@/generated/graphql";
import { CONTRACT_TYPE_ORDER, isOpenEndedContractType } from "@/features/contracts/labels";
import { mapSubmitError } from "@/lib/errors";

export type FormValues = {
  employeeId: string;
  contractNo: string;
  contractType: ContractType;
  officeEmail: string;
  nomorInduk: string;
  bandPosition: BandPosition;
  jobRoleId: string;
  jobTitle: string;
  jobLevel: string;
  workLocation: WorkLocation | "";
  unitId: string;
  startDate: string;
  endDate: string;
  notes: string;
};

const EMPTY: FormValues = {
  employeeId: "",
  contractNo: "",
  contractType: CONTRACT_TYPE_ORDER[0],
  officeEmail: "",
  nomorInduk: "",
  bandPosition: "UNDEFINED",
  jobRoleId: "",
  jobTitle: "",
  jobLevel: "",
  workLocation: "",
  unitId: "",
  startDate: "",
  endDate: "",
  notes: "",
};

const CONFLICT_MESSAGE =
  "Nomor kontrak atau nomor induk sudah dipakai. Periksa kembali isian tersebut.";

export function CreateContractModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const units = useUnits();
  const jobRoles = useJobRoles();
  const employees = useEmployees({}, 100);
  const [createContract, { loading }] = useMutation(CreateEmploymentContractDocument, {
    refetchQueries: [{ query: EmploymentContractsDocument }],
  });
  const { pushToast } = useToast();
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [wasOpen, setWasOpen] = React.useState(false);
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

  if (units.status === "loading" || jobRoles.status === "loading" || employees.status === "loading")
    return (
      <CreateContractModalFrame onClose={onClose} open={open}>
        <LoadingState />
      </CreateContractModalFrame>
    );
  if (units.status === "error")
    return (
      <CreateContractModalFrame onClose={onClose} open={open}>
        <ErrorState message={units.error ?? "Gagal memuat unit."} />
      </CreateContractModalFrame>
    );
  if (jobRoles.status === "error")
    return (
      <CreateContractModalFrame onClose={onClose} open={open}>
        <ErrorState message={jobRoles.error ?? "Gagal memuat job role."} />
      </CreateContractModalFrame>
    );
  if (employees.status === "error")
    return (
      <CreateContractModalFrame onClose={onClose} open={open}>
        <ErrorState message={employees.error ?? "Gagal memuat karyawan."} />
      </CreateContractModalFrame>
    );

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(toCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!toCheck.employeeId) next.employeeId = "Karyawan wajib dipilih.";
    if (!toCheck.contractNo.trim()) next.contractNo = "Nomor kontrak wajib diisi.";
    if (!toCheck.nomorInduk.trim()) next.nomorInduk = "Nomor induk wajib diisi.";
    if (!toCheck.jobRoleId) next.jobRoleId = "Job role wajib dipilih.";
    if (!toCheck.workLocation) next.workLocation = "Work location wajib dipilih.";
    if (!toCheck.unitId) next.unitId = "Unit wajib dipilih.";
    if (!toCheck.startDate) next.startDate = "Tanggal mulai wajib diisi.";
    if (!isOpenEndedContractType(toCheck.contractType)) {
      if (!toCheck.endDate) next.endDate = "Tanggal selesai wajib untuk kontrak berbatas waktu.";
      else if (toCheck.startDate && toCheck.endDate < toCheck.startDate)
        next.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
    } else if (toCheck.endDate) {
      next.endDate = "Tanggal selesai harus kosong untuk kontrak tanpa batas waktu.";
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    const workLocation = values.workLocation;
    if (!workLocation) return;
    const input: CreateEmploymentContractInput = {
      employeeId: values.employeeId,
      contractNo: values.contractNo.trim(),
      contractType: values.contractType,
      nomorInduk: values.nomorInduk.trim(),
      bandPosition: values.bandPosition,
      jobRoleId: values.jobRoleId,
      workLocation,
      unitId: values.unitId,
      startDate: values.startDate,
    };
    if (values.endDate) input.endDate = values.endDate;
    const optional = {
      officeEmail: values.officeEmail.trim(),
      jobTitle: values.jobTitle.trim(),
      jobLevel: values.jobLevel.trim(),
      notes: values.notes.trim(),
    };
    if (optional.officeEmail) input.officeEmail = optional.officeEmail;
    if (optional.jobTitle) input.jobTitle = optional.jobTitle;
    if (optional.jobLevel) input.jobLevel = optional.jobLevel;
    if (optional.notes) input.notes = optional.notes;
    try {
      const result = await createContract({ variables: { input } });
      const created = result.data?.createEmploymentContract;
      pushToast("success", `Kontrak ${created?.contractNo ?? values.contractNo} berhasil dibuat.`);
      onClose();
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        CONFLICT_MESSAGE,
        "Gagal membuat kontrak.",
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

  return (
    <CreateContractModalFrame
      actions={
        <>
          <Button onClick={onClose} type="button" variant="secondary">
            Batal
          </Button>
          <Button disabled={loading} form={formId} type="submit">
            {loading ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
    >
      <CreateContractFields
        employees={employees.employees ?? []}
        errors={errors}
        formError={formError}
        formId={formId}
        jobRoles={jobRoles.data ?? []}
        onChange={set}
        onContractTypeChange={(next) => {
          setValues((v) => ({ ...v, contractType: next, endDate: "" }));
          setErrors((er) => ({ ...er, endDate: undefined }));
        }}
        onSubmit={onSubmit}
        units={units.data ?? []}
        values={values}
      />
    </CreateContractModalFrame>
  );
}
