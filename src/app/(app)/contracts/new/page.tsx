"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useEmployees } from "@/features/employees/useEmployees";
import { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import {
  CreateEmploymentContractDocument,
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
import { CONTRACTS } from "@/lib/constants/routes";

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

export default function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const { employeeId: prefillEmployeeId } = React.use(searchParams);
  const units = useUnits();
  const jobRoles = useJobRoles();
  const employees = useEmployees({}, 100);
  const [createContract, { data, error, loading }] = useMutation(CreateEmploymentContractDocument);
  const [values, setValues] = React.useState<FormValues>(() => ({
    ...EMPTY,
    employeeId: prefillEmployeeId ?? "",
  }));
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  if (units.status === "loading" || jobRoles.status === "loading" || employees.status === "loading")
    return <LoadingState />;
  if (units.status === "error") return <ErrorState message={units.error ?? "Gagal memuat unit."} />;
  if (jobRoles.status === "error")
    return <ErrorState message={jobRoles.error ?? "Gagal memuat job role."} />;
  if (employees.status === "error")
    return <ErrorState message={employees.error ?? "Gagal memuat karyawan."} />;

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
      await createContract({ variables: { input } });
      setSubmitted(true);
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

  if (submitted) {
    const ok = Boolean(data?.createEmploymentContract);
    return (
      <section className="flex max-w-xl flex-col gap-4">
        <div
          className={`rounded-md border p-4 text-sm ${
            ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {ok
            ? `Kontrak ${values.contractNo} berhasil dibuat.`
            : error?.message ?? "Terjadi kesalahan saat membuat kontrak."}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setValues(EMPTY);
              setErrors({});
              setFormError(null);
              setSubmitted(false);
            }}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Tambah kontrak lain
          </button>
          <Link href={CONTRACTS} className="no-underline">
            <Button type="button" variant="secondary">
              Ke daftar kontrak
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <PageHeader
        title="Tambah Kontrak"
        subtitle="Kontrak kerja dengan atribut TMS. Nomor induk wajib dan unik antar kontrak aktif."
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {formError ? <ErrorState message={formError} /> : null}
        <Label error={errors.employeeId}>
          Karyawan
          <Select
            value={values.employeeId}
            onChange={(e) => set("employeeId", e.target.value)}
            options={[
              { value: "", label: "— pilih karyawan —" },
              ...(employees.employees ?? []).map((emp) => ({
                value: emp.id,
                label: `${emp.fullName} (${emp.nomorInduk ?? "—"})`,
              })),
            ]}
          />
        </Label>
        <Label error={errors.contractNo}>
          No. Kontrak
          <Input
            type="text"
            value={values.contractNo}
            onChange={(e) => set("contractNo", e.target.value)}
            placeholder="cth. PKWT/2026/001"
          />
        </Label>
        <Label error={errors.contractType}>
          Jenis kontrak
          <Select
            value={values.contractType}
            onChange={(e) => {
              const next = e.target.value as ContractType;
              setValues((v) => ({ ...v, contractType: next, endDate: "" }));
              setErrors((er) => ({ ...er, endDate: undefined }));
            }}
            options={CONTRACT_TYPE_ORDER.map((type) => ({
              value: type,
              label: CONTRACT_TYPE_LABEL[type],
            }))}
          />
        </Label>
        <Label error={errors.nomorInduk}>
          Nomor induk karyawan
          <Input
            type="text"
            value={values.nomorInduk}
            onChange={(e) => set("nomorInduk", e.target.value)}
            placeholder="cth. EMP-0100"
          />
        </Label>
        <Label error={errors.officeEmail}>
          Email kantor <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="email"
            value={values.officeEmail}
            onChange={(e) => set("officeEmail", e.target.value)}
          />
        </Label>
        <Label error={errors.unitId}>
          Unit
          <Select
            value={values.unitId}
            onChange={(e) => set("unitId", e.target.value)}
            options={[
              { value: "", label: "— pilih unit —" },
              ...(units.data ?? []).map((unit) => ({ value: unit.id, label: unit.name })),
            ]}
          />
        </Label>
        <Label error={errors.jobRoleId}>
          Posisi / Job Role
          <Select
            value={values.jobRoleId}
            onChange={(e) => set("jobRoleId", e.target.value)}
            options={[
              { value: "", label: "— pilih job role —" },
              ...(jobRoles.data ?? []).map((role) => ({ value: role.id, label: role.name })),
            ]}
          />
        </Label>
        <Label error={errors.jobTitle}>
          Job title <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.jobTitle}
            onChange={(e) => set("jobTitle", e.target.value)}
          />
        </Label>
        <Label error={errors.jobLevel}>
          Job level <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.jobLevel}
            onChange={(e) => set("jobLevel", e.target.value)}
          />
        </Label>
        <Label error={errors.bandPosition}>
          Band position
          <Select
            value={values.bandPosition}
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
          />
        </Label>
        <Label error={errors.workLocation}>
          Work location
          <Select
            value={values.workLocation}
            onChange={(e) => set("workLocation", e.target.value)}
            options={[
              { value: "", label: "— pilih lokasi kerja —" },
              { value: "JAKARTA", label: "Jakarta" },
              { value: "BANDUNG", label: "Bandung" },
            ]}
          />
        </Label>
        <Label error={errors.startDate}>
          Tanggal mulai
          <Input
            type="date"
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </Label>
        {!isOpenEndedContractType(values.contractType) ? (
          <Label error={errors.endDate}>
            Tanggal selesai
            <Input
              type="date"
              value={values.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Label>
        ) : null}
        <Label error={errors.notes}>
          Catatan <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input type="text" value={values.notes} onChange={(e) => set("notes", e.target.value)} />
        </Label>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            Simpan
          </Button>
          <Link href={CONTRACTS} className="no-underline">
            <Button type="button" variant="secondary">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </section>
  );
}

function Label({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
      {children}
      {error ? (
        <span className="text-xs font-normal text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
