"use client";

import Link from "next/link";
import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import {
  EmploymentContractDocument,
  RenewEmploymentContractDocument,
  type BandPosition,
  type ContractType,
  type EmploymentContractQuery,
  type RenewContractInput,
  type WorkLocation,
} from "@/generated/graphql";
import { mapSubmitError } from "@/lib/errors";

type SourceContract = NonNullable<EmploymentContractQuery["employmentContract"]>;

type FormValues = {
  contractType: ContractType;
  contractNo: string;
  startDate: string;
  endDate: string;
  nomorInduk: string;
  officeEmail: string;
  bandPosition: BandPosition;
  jobRoleId: string;
  jobTitle: string;
  jobLevel: string;
  workLocation: WorkLocation | "";
  unitId: string;
  notes: string;
};

const CONFLICT_MESSAGE =
  "Nomor kontrak atau nomor induk sudah dipakai, atau periode bertumpang tindih. Periksa kembali isian tersebut.";

function dayAfter(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function initialValues(contract: SourceContract): FormValues {
  return {
    contractType: contract.contractType,
    contractNo: "",
    startDate: dayAfter(contract.endDate),
    endDate: "",
    nomorInduk: contract.nomorInduk,
    officeEmail: contract.officeEmail ?? "",
    bandPosition: contract.bandPosition,
    jobRoleId: contract.jobRole.id,
    jobTitle: contract.jobTitle ?? "",
    jobLevel: contract.jobLevel ?? "",
    workLocation: contract.workLocation,
    unitId: contract.unit.id,
    notes: "",
  };
}

/**
 * Renewal wizard (FR-36 / US10) — T025.
 * Step 1 captures the new period (starting after the current contract ends);
 * step 2 captures the TMS attributes and, optionally, a new unit/position that
 * becomes effective on the new contract. The result carries
 * `predecessorContractId`, so the old contract stays readable as history.
 */
export function RenewContractWizard({ contract }: { contract: SourceContract }) {
  const units = useUnits();
  const jobRoles = useJobRoles();
  const [renew, { data, loading }] = useMutation(RenewEmploymentContractDocument, {
    refetchQueries: [
      { query: EmploymentContractDocument, variables: { id: contract.id } },
    ],
  });
  const [step, setStep] = React.useState<1 | 2>(1);
  const [values, setValues] = React.useState<FormValues>(() => initialValues(contract));
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  if (units.status === "loading" || jobRoles.status === "loading") return <LoadingState />;
  if (units.status === "error")
    return <ErrorState message={units.error ?? "Gagal memuat unit."} />;
  if (jobRoles.status === "error")
    return <ErrorState message={jobRoles.error ?? "Gagal memuat job role."} />;

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validatePeriod(toCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!toCheck.contractNo.trim()) next.contractNo = "Nomor kontrak wajib diisi.";
    if (!toCheck.startDate) next.startDate = "Tanggal mulai wajib diisi.";
    else if (contract.endDate && toCheck.startDate <= contract.endDate)
      next.startDate = `Tanggal mulai harus setelah kontrak lama berakhir (${contract.endDate}).`;
    if (toCheck.contractType === "PKWT") {
      if (!toCheck.endDate) next.endDate = "Tanggal selesai wajib untuk PKWT.";
      else if (toCheck.startDate && toCheck.endDate < toCheck.startDate)
        next.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
    } else if (toCheck.endDate) {
      next.endDate = "Tanggal selesai harus kosong untuk PKWTT.";
    }
    return next;
  }

  function validateAttributes(
    toCheck: FormValues
  ): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!toCheck.nomorInduk.trim()) next.nomorInduk = "Nomor induk wajib diisi.";
    if (!toCheck.unitId) next.unitId = "Unit wajib dipilih.";
    if (!toCheck.jobRoleId) next.jobRoleId = "Job role wajib dipilih.";
    if (!toCheck.workLocation) next.workLocation = "Work location wajib dipilih.";
    return next;
  }

  function goToAttributes(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validatePeriod(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    setStep(2);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateAttributes(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    const workLocation = values.workLocation;
    if (!workLocation) return;
    const input: RenewContractInput = {
      predecessorContractId: contract.id,
      contractNo: values.contractNo.trim(),
      contractType: values.contractType,
      nomorInduk: values.nomorInduk.trim(),
      jobRoleId: values.jobRoleId,
      unitId: values.unitId,
      workLocation,
      bandPosition: values.bandPosition,
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
      await renew({ variables: { input } });
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        CONFLICT_MESSAGE,
        "Gagal membuat perpanjangan kontrak."
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

  const created = data?.renewEmploymentContract;
  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Kontrak perpanjangan <strong>{created.contractNo}</strong> dibuat, mulai{" "}
          {created.startDate}. Kontrak lama {contract.contractNo} tetap tersimpan sebagai riwayat.
        </div>
        <div className="flex gap-2">
          <Link href={`/contracts/${created.id}`} className="no-underline">
            <Button type="button" variant="primary">
              Buka kontrak baru
            </Button>
          </Link>
          <Link href={`/contracts/${contract.id}`} className="no-underline">
            <Button type="button" variant="secondary">
              Kembali ke kontrak lama
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={step === 1 ? goToAttributes : onSubmit} className="flex max-w-xl flex-col gap-4">
      {formError ? <ErrorState message={formError} /> : null}
      <p className="text-xs font-medium text-zinc-500">
        Langkah {step} dari 2 — {step === 1 ? "Periode kontrak baru" : "Atribut & penempatan"}
      </p>

      {step === 1 ? (
        <>
          <Label error={errors.contractType}>
            Jenis kontrak
            <Select
              value={values.contractType}
              onChange={(e) => {
                const next = e.target.value as ContractType;
                setValues((v) => ({ ...v, contractType: next, endDate: "" }));
                setErrors((er) => ({ ...er, endDate: undefined }));
              }}
            >
              <option value="PKWT">PKWT</option>
              <option value="PKWTT">PKWTT</option>
            </Select>
          </Label>
          <Label error={errors.contractNo}>
            No. Kontrak baru
            <Input
              type="text"
              value={values.contractNo}
              onChange={(e) => set("contractNo", e.target.value)}
              placeholder="cth. PKWT/2027/001"
            />
          </Label>
          <Label error={errors.startDate}>
            Tanggal mulai
            <Input
              type="date"
              value={values.startDate}
              min={dayAfter(contract.endDate) || undefined}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Label>
          {values.contractType === "PKWT" ? (
            <Label error={errors.endDate}>
              Tanggal selesai
              <Input
                type="date"
                value={values.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </Label>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit">Lanjut</Button>
            <Link href={`/contracts/${contract.id}`} className="no-underline">
              <Button type="button" variant="secondary">
                Batal
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <Label error={errors.nomorInduk}>
            Nomor induk karyawan
            <Input
              type="text"
              value={values.nomorInduk}
              onChange={(e) => set("nomorInduk", e.target.value)}
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
            Unit <span className="text-xs font-normal text-zinc-500">(pindah unit bila diubah)</span>
            <Select value={values.unitId} onChange={(e) => set("unitId", e.target.value)}>
              <option value="">— pilih unit —</option>
              {(units.data ?? []).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </Label>
          <Label error={errors.jobRoleId}>
            Posisi / Job Role
            <Select value={values.jobRoleId} onChange={(e) => set("jobRoleId", e.target.value)}>
              <option value="">— pilih job role —</option>
              {(jobRoles.data ?? []).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
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
            >
              <option value="UNDEFINED">Belum ditetapkan</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
              <option value="VI">VI</option>
            </Select>
          </Label>
          <Label error={errors.workLocation}>
            Work location
            <Select
              value={values.workLocation}
              onChange={(e) => set("workLocation", e.target.value)}
            >
              <option value="">— pilih lokasi kerja —</option>
              <option value="JAKARTA">Jakarta</option>
              <option value="BANDUNG">Bandung</option>
            </Select>
          </Label>
          <Label error={errors.notes}>
            Catatan <span className="text-xs font-normal text-zinc-500">(opsional)</span>
            <Input
              type="text"
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Label>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan…" : "Simpan perpanjangan"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Kembali
            </Button>
          </div>
        </>
      )}
    </form>
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
