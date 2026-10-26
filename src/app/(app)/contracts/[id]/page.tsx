"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { InputControl } from "@/components/InputControl";
import { useEmploymentContract } from "@/features/contracts/useContract";
import {
  BAND_POSITION_LABEL,
  CONTRACT_END_REASON_LABEL,
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  WORK_LOCATION_LABEL,
  isOpenEndedContractType,
} from "@/features/contracts/labels";
import { RecordChangeHistory } from "@/features/audit/RecordChangeHistory";
import { ContractCycleActions } from "@/features/contracts/ContractCycleActions";
import { canManage } from "@/lib/auth/matrix";
import { useSessionRole } from "@/lib/auth/guard";
import {
  EmploymentContractDocument,
  UpdateEmploymentContractDocument,
  type BandPosition,
  type EmploymentContractQuery,
  type UpdateEmploymentContractInput,
  type WorkLocation,
} from "@/generated/graphql";
import { mapSubmitError } from "@/lib/errors";
import {
  CONTRACTS,
  CONTRACT_DETAIL,
  CONTRACT_RENEW,
  EMPLOYEE_DETAIL,
} from "@/lib/constants/routes";

type FormValues = {
  contractNo: string;
  officeEmail: string;
  bandPosition: BandPosition;
  jobTitle: string;
  jobLevel: string;
  workLocation: WorkLocation;
  notes: string;
};

const CONFLICT_MESSAGE = "Nomor kontrak sudah dipakai. Periksa kembali isian tersebut.";

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data: contract, error } = useEmploymentContract(id);
  const manage = canManage(useSessionRole(), "contracts");

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data kontrak."} />;
  if (!contract) return <ErrorState message="Kontrak tidak ditemukan." />;

  return (
    <section className="flex flex-col gap-4">
      <Link className="w-fit text-sm text-zinc-500 hover:text-zinc-900" href={CONTRACTS}>
        ← Kembali ke daftar kontrak
      </Link>
      <PageHeader
        actions={
          manage && !isOpenEndedContractType(contract.contractType) ? (
            <Link className="no-underline" href={CONTRACT_RENEW(id)}>
              <Button variant="primary">Perpanjang kontrak</Button>
            </Link>
          ) : undefined
        }
        subtitle={`${contract.employee.fullName} · ${CONTRACT_TYPE_LABEL[contract.contractType]} · ${CONTRACT_STATUS_LABEL[contract.status]}`}
        title={contract.contractNo ?? "—"}
      />

      <Card className="max-w-3xl">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Detail kontrak</h2>

        <h3 className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Identitas kontrak
        </h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Karyawan</dt>
            <dd className="text-zinc-900">
              <Link
                className="text-tp-brand-red-deep hover:underline"
                href={EMPLOYEE_DETAIL(contract.employee.id)}
              >
                {contract.employee.fullName}
              </Link>
              <span className="ml-2 font-mono text-xs text-zinc-500">
                {contract.employee.nikMasked}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">No. Kontrak</dt>
            <dd className="text-zinc-900">{contract.contractNo}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Jenis Kontrak</dt>
            <dd className="text-zinc-900">{CONTRACT_TYPE_LABEL[contract.contractType]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Nomor Induk</dt>
            <dd className="text-zinc-900">{contract.nomorInduk}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Email Kantor</dt>
            <dd className="text-zinc-900">{contract.officeEmail ?? "—"}</dd>
          </div>
        </dl>

        <hr className="my-4 border-board-border" />

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Posisi &amp; unit
        </h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Unit</dt>
            <dd className="text-zinc-900">{contract.unit.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Posisi / Job Role</dt>
            <dd className="text-zinc-900">{contract.jobRole.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Chapter</dt>
            <dd className="text-zinc-900">
              {contract.jobRole.chapter?.name ?? "Tanpa chapter"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Job Title</dt>
            <dd className="text-zinc-900">{contract.jobTitle ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Job Level</dt>
            <dd className="text-zinc-900">{contract.jobLevel ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Band Position</dt>
            <dd className="text-zinc-900">{BAND_POSITION_LABEL[contract.bandPosition]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Work Location</dt>
            <dd className="text-zinc-900">{WORK_LOCATION_LABEL[contract.workLocation]}</dd>
          </div>
        </dl>

        <hr className="my-4 border-board-border" />

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Periode &amp; status
        </h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Periode</dt>
            <dd className="text-zinc-900">
              {contract.startDate} — {contract.endDate ?? "tidak berbatas"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Status</dt>
            <dd className="text-zinc-900">{CONTRACT_STATUS_LABEL[contract.status]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Alasan Berakhir</dt>
            <dd className="text-zinc-900">
              {contract.endReason ? CONTRACT_END_REASON_LABEL[contract.endReason] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Dihentikan Pada</dt>
            <dd className="text-zinc-900">{contract.terminatedAt ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Kontrak Pendahulu</dt>
            <dd className="text-zinc-900">
              {contract.predecessor ? (
                <Link className="text-tp-brand-red-deep hover:underline" href={CONTRACT_DETAIL(contract.predecessor.id)}>
                  {contract.predecessor.contractNo}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Dibuat oleh</dt>
            <dd className="text-zinc-900">
              {contract.createdBy?.fullName ?? "—"} · {contract.createdAt}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Catatan</dt>
            <dd className="text-zinc-900">{contract.notes ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      {manage ? <ContractCycleActions contract={contract} /> : null}

      {manage ? (
        <>
          <Card className="max-w-3xl">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Ubah data kontrak</h2>
            <ContractEditForm contract={contract} id={id} />
          </Card>

          <Card className="max-w-3xl">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Riwayat perubahan</h2>
            <RecordChangeHistory entityId={id} entityType="employment_contract" />
          </Card>
        </>
      ) : null}
    </section>
  );
}

function ContractEditForm({
  id,
  contract,
}: {
  id: string;
  contract: NonNullable<EmploymentContractQuery["employmentContract"]>;
}) {
  const [updateContract, { loading: saving, data: saved }] = useMutation(
    UpdateEmploymentContractDocument,
    {
      refetchQueries: [{ query: EmploymentContractDocument, variables: { id } }],
    }
  );
  const [values, setValues] = React.useState<FormValues>(() => ({
    contractNo: contract.contractNo ?? "",
    officeEmail: contract.officeEmail ?? "",
    bandPosition: contract.bandPosition,
    jobTitle: contract.jobTitle ?? "",
    jobLevel: contract.jobLevel ?? "",
    workLocation: contract.workLocation,
    notes: contract.notes ?? "",
  }));
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(toCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!toCheck.contractNo.trim()) next.contractNo = "Nomor kontrak wajib diisi.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    const input: UpdateEmploymentContractInput = {
      contractNo: values.contractNo.trim(),
      bandPosition: values.bandPosition,
      workLocation: values.workLocation,
    };
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
      await updateContract({ variables: { id, input } });
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        CONFLICT_MESSAGE,
        "Gagal menyimpan perubahan."
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
    <form className="flex max-w-xl flex-col gap-4" onSubmit={onSubmit}>
      {formError ? <ErrorState message={formError} /> : null}
      {saved?.updateEmploymentContract ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Perubahan kontrak berhasil disimpan.
        </div>
      ) : null}
      <InputControl error={errors.contractNo} label="No. Kontrak">
        <Input
          onChange={(e) => set("contractNo", e.target.value)}
          type="text"
          value={values.contractNo}
        />
      </InputControl>
      <InputControl error={errors.officeEmail} helper="(opsional)" label="Email kantor">
        <Input
          onChange={(e) => set("officeEmail", e.target.value)}
          type="email"
          value={values.officeEmail}
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
            { value: "UNDEFINED", label: "Belum ditetapkan" },
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
        <Button disabled={saving} type="submit">
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}
