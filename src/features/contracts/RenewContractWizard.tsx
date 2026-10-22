"use client";

import Link from "next/link";
import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { InputControl } from "@/components/InputControl";
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
import {
  CONTRACT_TYPE_LABEL,
  CONTRACT_TYPE_ORDER,
  isOpenEndedContractType,
  workLocationFormValue,
} from "@/features/contracts/labels";
import { mapSubmitError } from "@/lib/errors";
import { CONTRACT_DETAIL } from "@/lib/constants/routes";

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
    workLocation: workLocationFormValue(contract.workLocation),
    unitId: contract.unit.id,
    notes: "",
  };
}

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
    if (!isOpenEndedContractType(toCheck.contractType)) {
      if (!toCheck.endDate) next.endDate = "Tanggal selesai wajib untuk kontrak berbatas waktu.";
      else if (toCheck.startDate && toCheck.endDate < toCheck.startDate)
        next.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
    } else if (toCheck.endDate) {
      next.endDate = "Tanggal selesai harus kosong untuk kontrak tanpa batas waktu.";
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
          <Link className="no-underline" href={CONTRACT_DETAIL(created.id)}>
            <Button type="button" variant="primary">
              Buka kontrak baru
            </Button>
          </Link>
            <Link className="no-underline" href={CONTRACT_DETAIL(contract.id)}>
            <Button type="button" variant="secondary">
              Kembali ke kontrak lama
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="flex max-w-xl flex-col gap-4" onSubmit={step === 1 ? goToAttributes : onSubmit}>
      {formError ? <ErrorState message={formError} /> : null}
      <p className="text-xs font-medium text-zinc-500">
        Langkah {step} dari 2 — {step === 1 ? "Periode kontrak baru" : "Atribut & penempatan"}
      </p>

      {step === 1 ? (
        <>
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
          <InputControl error={errors.contractNo} label="No. Kontrak baru">
            <Input
              onChange={(e) => set("contractNo", e.target.value)}
              placeholder="cth. PKWT/2027/001"
              type="text"
              value={values.contractNo}
            />
          </InputControl>
          <InputControl error={errors.startDate} label="Tanggal mulai">
            <Input
              min={dayAfter(contract.endDate) || undefined}
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
          <div className="flex gap-2">
            <Button type="submit">Lanjut</Button>
          <Link className="no-underline" href={CONTRACT_DETAIL(contract.id)}>
              <Button type="button" variant="secondary">
                Batal
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <InputControl error={errors.nomorInduk} label="Nomor induk karyawan">
            <Input
              onChange={(e) => set("nomorInduk", e.target.value)}
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
          <InputControl
            error={errors.unitId}
            helper="(pindah unit bila diubah)"
            label="Unit"
          >
            <Select
              onChange={(e) => set("unitId", e.target.value)}
              options={[
                { value: "", label: "— pilih unit —" },
                ...(units.data ?? []).map((unit) => ({ value: unit.id, label: unit.name })),
              ]}
              value={values.unitId}
            />
          </InputControl>
          <InputControl error={errors.jobRoleId} label="Posisi / Job Role">
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
          <InputControl error={errors.notes} helper="(opsional)" label="Catatan">
            <Input
              onChange={(e) => set("notes", e.target.value)}
              type="text"
              value={values.notes}
            />
          </InputControl>
          <div className="flex gap-2">
            <Button disabled={loading} type="submit">
              {loading ? "Menyimpan…" : "Simpan perpanjangan"}
            </Button>
            <Button onClick={() => setStep(1)} type="button" variant="secondary">
              Kembali
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
