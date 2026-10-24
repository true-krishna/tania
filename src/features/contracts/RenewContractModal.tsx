"use client";

import * as React from "react";
import { ApolloError, useMutation, useQuery } from "@apollo/client";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { InputControl } from "@/components/InputControl";
import { useToast } from "@/components/Toast";
import { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import {
  EmploymentContractDocument,
  EmploymentContractsDocument,
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

function validatePeriod(
  toCheck: FormValues,
  predecessor: SourceContract
): Partial<Record<keyof FormValues, string>> {
  const next: Partial<Record<keyof FormValues, string>> = {};
  if (!toCheck.contractNo.trim()) next.contractNo = "Nomor kontrak wajib diisi.";
  if (!toCheck.startDate) next.startDate = "Tanggal mulai wajib diisi.";
  else if (predecessor.endDate && toCheck.startDate <= predecessor.endDate)
    next.startDate = `Tanggal mulai harus setelah kontrak lama berakhir (${predecessor.endDate}).`;
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

interface RenewFormProps {
  contract: SourceContract;
  initialValues: FormValues;
  units: ReturnType<typeof useUnits>;
  jobRoles: ReturnType<typeof useJobRoles>;
  onSuccess: () => void;
}

function RenewContractForm({
  contract,
  initialValues: init,
  units,
  jobRoles,
  onSuccess,
}: RenewFormProps) {
  const [renew, { loading }] = useMutation(RenewEmploymentContractDocument, {
    refetchQueries: [{ query: EmploymentContractsDocument }],
  });
  const { pushToast } = useToast();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [values, setValues] = React.useState<FormValues>(init);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function goToAttributes(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validatePeriod(values, contract);
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
      const result = await renew({ variables: { input } });
      const created = result.data?.renewEmploymentContract;
      pushToast(
        "success",
        `Kontrak perpanjangan ${created?.contractNo ?? values.contractNo} berhasil dibuat.`
      );
      onSuccess();
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

  return (
    <form className="flex flex-col gap-4" onSubmit={step === 1 ? goToAttributes : onSubmit}>
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
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit">Lanjut</Button>
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
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setStep(1)} type="button" variant="secondary">
              Kembali
            </Button>
            <Button disabled={loading} type="submit">
              {loading ? "Menyimpan…" : "Simpan perpanjangan"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

export function RenewContractModal({
  open,
  contractId,
  onClose,
}: {
  open: boolean;
  contractId: string | null;
  onClose: () => void;
}) {
  const units = useUnits();
  const jobRoles = useJobRoles();
  const { data: contractData, loading: contractLoading } = useQuery(
    EmploymentContractDocument,
    { variables: { id: contractId ?? "" }, skip: !open || !contractId },
  );

  if (!open || !contractId) return null;

  if (contractLoading || !contractData?.employmentContract)
    return (
      <Modal onClose={onClose} open={open} size="lg" title="Perpanjang Kontrak">
        <LoadingState />
      </Modal>
    );

  const contract = contractData.employmentContract;

  if (units.status === "loading" || jobRoles.status === "loading")
    return (
      <Modal onClose={onClose} open={open} size="lg" title="Perpanjang Kontrak">
        <LoadingState />
      </Modal>
    );
  if (units.status === "error")
    return (
      <Modal onClose={onClose} open={open} size="lg" title="Perpanjang Kontrak">
        <ErrorState message={units.error ?? "Gagal memuat unit."} />
      </Modal>
    );
  if (jobRoles.status === "error")
    return (
      <Modal onClose={onClose} open={open} size="lg" title="Perpanjang Kontrak">
        <ErrorState message={jobRoles.error ?? "Gagal memuat job role."} />
      </Modal>
    );

  return (
    <Modal onClose={onClose} open={open} size="lg" title="Perpanjang Kontrak">
      <RenewContractForm
        contract={contract}
        initialValues={initialValues(contract)}
        jobRoles={jobRoles}
        onSuccess={onClose}
        units={units}
      />
    </Modal>
  );
}
