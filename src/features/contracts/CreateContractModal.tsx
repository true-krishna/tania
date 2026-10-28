"use client";

import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { InputControl } from "@/components/InputControl";
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
import {
  CONTRACT_TYPE_LABEL,
  CONTRACT_TYPE_ORDER,
  isOpenEndedContractType,
} from "@/features/contracts/labels";
import { mapSubmitError } from "@/lib/errors";

type FormValues = {
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

export function CreateContractModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
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

  const selectedJobRole = values.jobRoleId
    ? (jobRoles.data ?? []).find((jr) => jr.id === values.jobRoleId) ?? null
    : null;

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
        "Gagal membuat kontrak."
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
      <form className="flex flex-col gap-4" id={formId} onSubmit={onSubmit}>
        {formError ? <ErrorState message={formError} /> : null}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Identitas kontrak
        </h3>
        <InputControl error={errors.employeeId} label="Karyawan">
          <Select
            onChange={(e) => set("employeeId", e.target.value)}
            options={[
              { value: "", label: "— pilih karyawan —" },
              ...(employees.employees ?? []).map((emp) => ({
                value: emp.id,
                label: `${emp.fullName} (${emp.nomorInduk ?? "—"})`,
              })),
            ]}
            value={values.employeeId}
          />
        </InputControl>
        <InputControl error={errors.contractNo} label="No. Kontrak">
          <Input
            onChange={(e) => set("contractNo", e.target.value)}
            placeholder="cth. PKWT/2026/001"
            type="text"
            value={values.contractNo}
          />
        </InputControl>
        <InputControl error={errors.contractType} label="Jenis kontrak">
          <Select
            onChange={(e) => {
              const next = e.target.value as ContractType;
              setValues((v) => ({ ...v, contractType: next, endDate: "" }));
              setErrors((er) => ({ ...er, endDate: undefined }));
            }}
            options={CONTRACT_TYPE_ORDER.map((type) => ({
              value: type,
              label: CONTRACT_TYPE_LABEL[type],
            }))}
            value={values.contractType}
          />
        </InputControl>
        <InputControl error={errors.nomorInduk} label="Nomor induk karyawan">
          <Input
            onChange={(e) => set("nomorInduk", e.target.value)}
            placeholder="cth. EMP-0100"
            type="text"
            value={values.nomorInduk}
          />
        </InputControl>
        <InputControl error={errors.officeEmail} helper="(opsional)" label="Email kantor">
          <Input
            onChange={(e) => set("officeEmail", e.target.value)}
            type="email"
            value={values.officeEmail}
          />
        </InputControl>
        <h3 className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Posisi &amp; unit
        </h3>
        <InputControl error={errors.unitId} label="Unit">
          <Select
            onChange={(e) => set("unitId", e.target.value)}
            options={[
              { value: "", label: "— pilih unit —" },
              ...(units.data ?? []).map((unit) => ({ value: unit.id, label: unit.name })),
            ]}
            value={values.unitId}
          />
        </InputControl>
        <InputControl
          error={errors.jobRoleId}
          helper={
            selectedJobRole ? `Chapter: ${selectedJobRole.chapter?.name ?? "Tanpa chapter"}` : undefined
          }
          label="Posisi / Job Role"
        >
          <Select
            onChange={(e) => set("jobRoleId", e.target.value)}
            options={[
              { value: "", label: "— pilih job role —" },
              ...(jobRoles.data ?? []).map((role) => ({ value: role.id, label: role.name })),
            ]}
            value={values.jobRoleId}
          />
        </InputControl>
        <InputControl error={errors.jobTitle} helper="(opsional)" label="Job title">
          <Input
            onChange={(e) => set("jobTitle", e.target.value)}
            type="text"
            value={values.jobTitle}
          />
        </InputControl>
        <InputControl error={errors.jobLevel} helper="(opsional)" label="Job level">
          <Input
            onChange={(e) => set("jobLevel", e.target.value)}
            type="text"
            value={values.jobLevel}
          />
        </InputControl>
        <InputControl error={errors.bandPosition} label="Band position">
          <Select
            onChange={(e) => set("bandPosition", e.target.value)}
            options={[
              { value: "UNDEFINED", label: "Belum ditetapkan" },
              { value: "I", label: "I" },
              { value: "II", label: "II" },
              { value: "III", label: "III" },
              { value: "IV", label: "IV" },
              { value: "V", label: "V" },
              { value: "VI", label: "VI" },
            ]}
            value={values.bandPosition}
          />
        </InputControl>
        <InputControl error={errors.workLocation} label="Work location">
          <Select
            onChange={(e) => set("workLocation", e.target.value)}
            options={[
              { value: "", label: "— pilih lokasi kerja —" },
              { value: "JAKARTA", label: "Jakarta" },
              { value: "BANDUNG", label: "Bandung" },
            ]}
            value={values.workLocation}
          />
        </InputControl>
        <h3 className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Periode &amp; status
        </h3>
        <InputControl error={errors.startDate} label="Tanggal mulai">
          <Input
            onChange={(e) => set("startDate", e.target.value)}
            type="date"
            value={values.startDate}
          />
        </InputControl>
        {!isOpenEndedContractType(values.contractType) ? (
          <InputControl error={errors.endDate} label="Tanggal selesai">
            <Input
              onChange={(e) => set("endDate", e.target.value)}
              type="date"
              value={values.endDate}
            />
          </InputControl>
        ) : null}
        <InputControl error={errors.notes} helper="(opsional)" label="Catatan">
          <Input onChange={(e) => set("notes", e.target.value)} type="text" value={values.notes} />
        </InputControl>
      </form>
    </CreateContractModalFrame>
  );
}

function CreateContractModalFrame({
  open,
  onClose,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Modal onClose={onClose} open={open} size="lg">
      <ModalTitle>Tambah Kontrak</ModalTitle>
      <ModalContent>{children}</ModalContent>
      {actions ? <ModalActions>{actions}</ModalActions> : null}
    </Modal>
  );
}
