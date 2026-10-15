"use client";

import Link from "next/link";
import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import {
  EmployeeDocument,
  EmploymentContractDocument,
  RecordEmployeeMutationDocument,
  ResignEmployeeDocument,
  RetireEmployeeDocument,
  type BandPosition,
  type EmploymentContractQuery,
  type RecordMutationInput,
  type WorkLocation,
} from "@/generated/graphql";
import { workLocationFormValue } from "@/features/contracts/labels";
import { graphQLErrorCode, mapSubmitError } from "@/lib/errors";

type Contract = NonNullable<EmploymentContractQuery["employmentContract"]>;

const DEPENDENCY_WARNING =
  "Karyawan masih memiliki assignment aktif atau IDP berjalan. Tindakan ini tetap berjalan dan assignment/IDP berjalan tetap tersimpan sebagai riwayat.";

const MUTATION_NOTICE =
  "Mutasi mengakhiri kontrak lama dan membuat kontrak baru efektif pada tanggal mutasi. Assignment aktif pada unit lama tetap tampil sebagai riwayat.";

function isPrecondition(error: unknown): boolean {
  return error instanceof ApolloError && graphQLErrorCode(error) === "PRECONDITION_FAILED";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Lifecycle actions on the contract detail page (FR-37..39 / US11–13) — T026.
 * One door for resign / mutation / retirement. Termination actions surface the
 * dependency warning via the server's `acknowledgeActiveWork` precondition:
 * the first attempt is unacknowledged, and a rejection with
 * `PRECONDITION_FAILED` turns into a confirm step that retries acknowledged.
 */
export function ContractCycleActions({ contract }: { contract: Contract }) {
  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Aksi siklus karyawan</h2>
      <div className="flex flex-col gap-6">
        <ResignAction contract={contract} />
        <MutationAction contract={contract} />
        <RetireAction contract={contract} />
      </div>
    </Card>
  );
}

function ResignAction({ contract }: { contract: Contract }) {
  const [effectiveDate, setEffectiveDate] = React.useState(todayISO);
  const [reason, setReason] = React.useState("");
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [needsAck, setNeedsAck] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [resign, { loading }] = useMutation(ResignEmployeeDocument, {
    refetchQueries: [
      { query: EmploymentContractDocument, variables: { id: contract.id } },
      { query: EmployeeDocument, variables: { id: contract.employee.id } },
    ],
  });

  async function run(acknowledgeActiveWork: boolean) {
    setFormError(null);
    setDateError(null);
    if (!effectiveDate) {
      setDateError("Tanggal efektif wajib diisi.");
      return;
    }
    try {
      const trimmedReason = reason.trim();
      await resign({
        variables: {
          id: contract.employee.id,
          effectiveDate,
          acknowledgeActiveWork,
          ...(trimmedReason ? { reason: trimmedReason } : {}),
        },
      });
      setDone(true);
      setNeedsAck(false);
    } catch (err) {
      if (!acknowledgeActiveWork && isPrecondition(err)) {
        setNeedsAck(true);
        return;
      }
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        "Tidak dapat mencatat resign.",
        "Gagal mencatat resign."
      );
      if (submitError.field === "effectiveDate") setDateError(submitError.message);
      else setFormError(submitError.message);
    }
  }

  if (done) {
    return (
      <section className="flex flex-col gap-2 border-t border-board-border pt-4">
        <h3 className="text-sm font-semibold text-zinc-900">Resign</h3>
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Resign tercatat. Kontrak aktif diakhiri dan akun karyawan dinonaktifkan.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 border-t border-board-border pt-4">
      <h3 className="text-sm font-semibold text-zinc-900">Resign</h3>
      {formError ? <ErrorState message={formError} /> : null}
      {needsAck ? (
        <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{DEPENDENCY_WARNING}</p>
          <div className="flex gap-2">
            <Button type="button" variant="primary" onClick={() => run(true)} disabled={loading}>
              Ya, lanjutkan resign
            </Button>
            <Button type="button" variant="secondary" onClick={() => setNeedsAck(false)}>
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Label error={dateError ?? undefined}>
            Tanggal efektif
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => {
                setEffectiveDate(e.target.value);
                setDateError(null);
              }}
            />
          </Label>
          <Label>
            Alasan <span className="text-xs font-normal text-zinc-500">(opsional)</span>
            <Input type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Label>
          <div>
            <Button type="button" variant="secondary" onClick={() => run(false)} disabled={loading}>
              Catat resign
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

type MutationValues = {
  effectiveDate: string;
  contractNo: string;
  nomorInduk: string;
  officeEmail: string;
  unitId: string;
  jobRoleId: string;
  jobTitle: string;
  jobLevel: string;
  bandPosition: BandPosition;
  workLocation: WorkLocation | "";
  endDate: string;
  notes: string;
};

function MutationAction({ contract }: { contract: Contract }) {
  const units = useUnits();
  const jobRoles = useJobRoles();
  const [values, setValues] = React.useState<MutationValues>(() => ({
    effectiveDate: todayISO(),
    contractNo: "",
    nomorInduk: contract.nomorInduk,
    officeEmail: contract.officeEmail ?? "",
    unitId: contract.unit.id,
    jobRoleId: contract.jobRole.id,
    jobTitle: contract.jobTitle ?? "",
    jobLevel: contract.jobLevel ?? "",
    bandPosition: contract.bandPosition,
    workLocation: workLocationFormValue(contract.workLocation),
    endDate: "",
    notes: "",
  }));
  const [errors, setErrors] = React.useState<Partial<Record<keyof MutationValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [record, { data, loading }] = useMutation(RecordEmployeeMutationDocument, {
    refetchQueries: [
      { query: EmploymentContractDocument, variables: { id: contract.id } },
      { query: EmployeeDocument, variables: { id: contract.employee.id } },
    ],
  });

  function set<K extends keyof MutationValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(toCheck: MutationValues): Partial<Record<keyof MutationValues, string>> {
    const next: Partial<Record<keyof MutationValues, string>> = {};
    if (!toCheck.effectiveDate) next.effectiveDate = "Tanggal efektif wajib diisi.";
    if (!toCheck.contractNo.trim()) next.contractNo = "Nomor kontrak baru wajib diisi.";
    if (!toCheck.nomorInduk.trim()) next.nomorInduk = "Nomor induk wajib diisi.";
    if (!toCheck.unitId) next.unitId = "Unit baru wajib dipilih.";
    if (!toCheck.jobRoleId) next.jobRoleId = "Job role baru wajib dipilih.";
    if (!toCheck.workLocation) next.workLocation = "Work location wajib dipilih.";
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
    const input: RecordMutationInput = {
      employeeId: contract.employee.id,
      effectiveDate: values.effectiveDate,
      contractNo: values.contractNo.trim(),
      nomorInduk: values.nomorInduk.trim(),
      unitId: values.unitId,
      jobRoleId: values.jobRoleId,
      workLocation,
      bandPosition: values.bandPosition,
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
      await record({ variables: { input } });
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        "Tidak dapat mencatat mutasi (nomor kontrak/nomor induk atau periode bertentangan).",
        "Gagal mencatat mutasi."
      );
      if (submitError.field && submitError.field in values) {
        setErrors((prev) => ({
          ...prev,
          [submitError.field as keyof MutationValues]: submitError.message,
        }));
      } else {
        setFormError(submitError.message);
      }
    }
  }

  const created = data?.recordEmployeeMutation;
  if (created) {
    return (
      <section className="flex flex-col gap-2 border-t border-board-border pt-4">
        <h3 className="text-sm font-semibold text-zinc-900">Mutasi unit / posisi</h3>
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Mutasi tercatat. Kontrak baru <strong>{created.contractNo}</strong> efektif{" "}
          {created.startDate}; kontrak lama tetap tersimpan sebagai riwayat.
        </p>
        <Link href={`/contracts/${created.id}`} className="w-fit no-underline">
          <Button type="button" variant="secondary">
            Buka kontrak baru
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 border-t border-board-border pt-4">
      <h3 className="text-sm font-semibold text-zinc-900">Mutasi unit / posisi</h3>
      <p className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        {MUTATION_NOTICE}
      </p>
      {formError ? <ErrorState message={formError} /> : null}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Label error={errors.effectiveDate}>
          Tanggal efektif
          <Input
            type="date"
            value={values.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </Label>
        <Label error={errors.contractNo}>
          No. Kontrak baru
          <Input
            type="text"
            value={values.contractNo}
            onChange={(e) => set("contractNo", e.target.value)}
            placeholder="cth. PKWT/2026/MUT-01"
          />
        </Label>
        <Label error={errors.nomorInduk}>
          Nomor induk karyawan
          <Input
            type="text"
            value={values.nomorInduk}
            onChange={(e) => set("nomorInduk", e.target.value)}
          />
        </Label>
        <Label error={errors.unitId}>
          Unit baru
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
          Posisi / Job Role baru
          <Select
            value={values.jobRoleId}
            onChange={(e) => set("jobRoleId", e.target.value)}
            options={[
              { value: "", label: "— pilih job role —" },
              ...(jobRoles.data ?? []).map((role) => ({ value: role.id, label: role.name })),
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
        <Label>
          Job title <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.jobTitle}
            onChange={(e) => set("jobTitle", e.target.value)}
          />
        </Label>
        <Label>
          Job level <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.jobLevel}
            onChange={(e) => set("jobLevel", e.target.value)}
          />
        </Label>
        <Label>
          Tanggal selesai <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="date"
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </Label>
        <Label>
          Catatan <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input type="text" value={values.notes} onChange={(e) => set("notes", e.target.value)} />
        </Label>
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan…" : "Catat mutasi"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function RetireAction({ contract }: { contract: Contract }) {
  const [effectiveDate, setEffectiveDate] = React.useState(todayISO);
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [needsAck, setNeedsAck] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [retire, { loading }] = useMutation(RetireEmployeeDocument, {
    refetchQueries: [
      { query: EmploymentContractDocument, variables: { id: contract.id } },
      { query: EmployeeDocument, variables: { id: contract.employee.id } },
    ],
  });

  async function run(acknowledgeActiveWork: boolean) {
    setFormError(null);
    setDateError(null);
    if (!effectiveDate) {
      setDateError("Tanggal efektif wajib diisi.");
      return;
    }
    try {
      await retire({
        variables: {
          id: contract.employee.id,
          effectiveDate,
          acknowledgeActiveWork,
        },
      });
      setDone(true);
      setNeedsAck(false);
    } catch (err) {
      if (!acknowledgeActiveWork && isPrecondition(err)) {
        setNeedsAck(true);
        return;
      }
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        "Tidak dapat mencatat pensiun.",
        "Gagal mencatat pensiun."
      );
      if (submitError.field === "effectiveDate") setDateError(submitError.message);
      else setFormError(submitError.message);
    }
  }

  if (done) {
    return (
      <section className="flex flex-col gap-2 border-t border-board-border pt-4">
        <h3 className="text-sm font-semibold text-zinc-900">Pensiun</h3>
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Pensiun tercatat. Kontrak aktif diakhiri dan status karyawan menjadi pensiun.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 border-t border-board-border pt-4">
      <h3 className="text-sm font-semibold text-zinc-900">Pensiun</h3>
      {formError ? <ErrorState message={formError} /> : null}
      {needsAck ? (
        <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{DEPENDENCY_WARNING}</p>
          <div className="flex gap-2">
            <Button type="button" variant="primary" onClick={() => run(true)} disabled={loading}>
              Ya, lanjutkan pensiun
            </Button>
            <Button type="button" variant="secondary" onClick={() => setNeedsAck(false)}>
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Label error={dateError ?? undefined}>
            Tanggal efektif
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => {
                setEffectiveDate(e.target.value);
                setDateError(null);
              }}
            />
          </Label>
          <div>
            <Button type="button" variant="secondary" onClick={() => run(false)} disabled={loading}>
              Catat pensiun
            </Button>
          </div>
        </>
      )}
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
