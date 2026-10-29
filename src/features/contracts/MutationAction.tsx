"use client";

import Link from "next/link";
import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { useJobRoles, useUnits } from "@/features/master-data/useMasterData";
import {
  EmployeeDocument,
  EmploymentContractDocument,
  RecordEmployeeMutationDocument,
  type BandPosition,
  type RecordMutationInput,
  type WorkLocation,
} from "@/generated/graphql";
import { workLocationFormValue } from "./labels";
import { ContractCycleSection } from "./ContractCycleSection";
import { ContractCycleSuccess } from "./ContractCycleSuccess";
import { MUTATION_NOTICE, todayISO, type Contract } from "./contractCycle";
import { mapSubmitError } from "@/lib/errors";
import { CONTRACT_DETAIL } from "@/lib/constants/routes";

type MutationValues = {
  bandPosition: BandPosition;
  contractNo: string;
  effectiveDate: string;
  endDate: string;
  jobLevel: string;
  jobRoleId: string;
  jobTitle: string;
  nomorInduk: string;
  notes: string;
  officeEmail: string;
  unitId: string;
  workLocation: WorkLocation | "";
};

export function MutationAction({ contract }: { contract: Contract }) {
  const units = useUnits();
  const jobRoles = useJobRoles();
  const [values, setValues] = React.useState<MutationValues>(() => ({
    bandPosition: contract.bandPosition,
    contractNo: "",
    effectiveDate: todayISO(),
    endDate: "",
    jobLevel: contract.jobLevel ?? "",
    jobRoleId: contract.jobRole.id,
    jobTitle: contract.jobTitle ?? "",
    nomorInduk: contract.nomorInduk,
    notes: "",
    officeEmail: contract.officeEmail ?? "",
    unitId: contract.unit.id,
    workLocation: workLocationFormValue(contract.workLocation),
  }));
  const [errors, setErrors] = React.useState<Partial<Record<keyof MutationValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [record, { data, loading }] = useMutation(RecordEmployeeMutationDocument, {
    refetchQueries: [
      { query: EmploymentContractDocument, variables: { id: contract.id } },
      {
        query: EmployeeDocument,
        variables: { id: contract.employee.id },
      },
    ],
  });

  function setField<Key extends keyof MutationValues>(key: Key, value: MutationValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError(null);
  }

  function validate(toCheck: MutationValues): Partial<Record<keyof MutationValues, string>> {
    const next: Partial<Record<keyof MutationValues, string>> = {};
    if (!toCheck.effectiveDate) {
      next.effectiveDate = "Tanggal efektif wajib diisi.";
    }
    if (!toCheck.contractNo.trim()) {
      next.contractNo = "Nomor kontrak baru wajib diisi.";
    }
    if (!toCheck.nomorInduk.trim()) {
      next.nomorInduk = "Nomor induk wajib diisi.";
    }
    if (!toCheck.unitId) next.unitId = "Unit baru wajib dipilih.";
    if (!toCheck.jobRoleId) next.jobRoleId = "Job role baru wajib dipilih.";
    if (!toCheck.workLocation) {
      next.workLocation = "Work location wajib dipilih.";
    }
    return next;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    const workLocation = values.workLocation;
    if (!workLocation) return;

    const input: RecordMutationInput = {
      bandPosition: values.bandPosition,
      contractNo: values.contractNo.trim(),
      effectiveDate: values.effectiveDate,
      employeeId: contract.employee.id,
      jobRoleId: values.jobRoleId,
      nomorInduk: values.nomorInduk.trim(),
      unitId: values.unitId,
      workLocation,
    };
    if (values.endDate) input.endDate = values.endDate;
    const optional = {
      jobLevel: values.jobLevel.trim(),
      jobTitle: values.jobTitle.trim(),
      notes: values.notes.trim(),
      officeEmail: values.officeEmail.trim(),
    };
    if (optional.officeEmail) input.officeEmail = optional.officeEmail;
    if (optional.jobTitle) input.jobTitle = optional.jobTitle;
    if (optional.jobLevel) input.jobLevel = optional.jobLevel;
    if (optional.notes) input.notes = optional.notes;

    try {
      await record({ variables: { input } });
    } catch (error) {
      const submitError = mapSubmitError(
        error instanceof ApolloError ? error : null,
        "Tidak dapat mencatat mutasi (nomor kontrak/nomor induk atau periode bertentangan).",
        "Gagal mencatat mutasi.",
      );
      if (submitError.field && submitError.field in values) {
        setErrors((previous) => ({
          ...previous,
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
      <ContractCycleSection
        success={
          <>
            <ContractCycleSuccess>
              Mutasi tercatat. Kontrak baru <strong>{created.contractNo}</strong> efektif{" "}
              {created.startDate}; kontrak lama tetap tersimpan sebagai riwayat.
            </ContractCycleSuccess>
            <Link className="w-fit no-underline" href={CONTRACT_DETAIL(created.id)}>
              <Button type="button" variant="secondary">
                Buka kontrak baru
              </Button>
            </Link>
          </>
        }
        title="Mutasi unit / posisi"
      />
    );
  }

  return (
    <ContractCycleSection notice={MUTATION_NOTICE} title="Mutasi unit / posisi">
      {formError ? <ErrorState message={formError} /> : null}
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <InputControl error={errors.effectiveDate} label="Tanggal efektif">
          <Input
            onChange={(event) => setField("effectiveDate", event.target.value)}
            type="date"
            value={values.effectiveDate}
          />
        </InputControl>
        <InputControl error={errors.contractNo} label="No. Kontrak baru">
          <Input
            onChange={(event) => setField("contractNo", event.target.value)}
            placeholder="cth. PKWT/2026/MUT-01"
            type="text"
            value={values.contractNo}
          />
        </InputControl>
        <InputControl error={errors.nomorInduk} label="Nomor induk karyawan">
          <Input
            onChange={(event) => setField("nomorInduk", event.target.value)}
            type="text"
            value={values.nomorInduk}
          />
        </InputControl>
        <InputControl error={errors.unitId} label="Unit baru">
          <Select
            onChange={(event) => setField("unitId", event.target.value)}
            options={[
              { label: "— pilih unit —", value: "" },
              ...(units.data ?? []).map((unit) => ({
                label: unit.name,
                value: unit.id,
              })),
            ]}
            value={values.unitId}
          />
        </InputControl>
        <InputControl error={errors.jobRoleId} label="Posisi / Job Role baru">
          <Select
            onChange={(event) => setField("jobRoleId", event.target.value)}
            options={[
              { label: "— pilih job role —", value: "" },
              ...(jobRoles.data ?? []).map((jobRole) => ({
                label: jobRole.name,
                value: jobRole.id,
              })),
            ]}
            value={values.jobRoleId}
          />
        </InputControl>
        <InputControl error={errors.workLocation} label="Work location">
          <Select
            onChange={(event) => setField("workLocation", event.target.value as WorkLocation | "")}
            options={[
              { label: "— pilih lokasi kerja —", value: "" },
              { label: "Jakarta", value: "JAKARTA" },
              { label: "Bandung", value: "BANDUNG" },
            ]}
            value={values.workLocation}
          />
        </InputControl>
        <InputControl error={errors.bandPosition} label="Band position">
          <Select
            onChange={(event) => setField("bandPosition", event.target.value as BandPosition)}
            options={[
              { label: "Belum ditetapkan", value: "UNDEFINED" },
              { label: "I", value: "I" },
              { label: "II", value: "II" },
              { label: "III", value: "III" },
              { label: "IV", value: "IV" },
              { label: "V", value: "V" },
              { label: "VI", value: "VI" },
            ]}
            value={values.bandPosition}
          />
        </InputControl>
        <InputControl helper="(opsional)" label="Job title">
          <Input
            onChange={(event) => setField("jobTitle", event.target.value)}
            type="text"
            value={values.jobTitle}
          />
        </InputControl>
        <InputControl helper="(opsional)" label="Job level">
          <Input
            onChange={(event) => setField("jobLevel", event.target.value)}
            type="text"
            value={values.jobLevel}
          />
        </InputControl>
        <InputControl helper="(opsional)" label="Tanggal selesai">
          <Input
            onChange={(event) => setField("endDate", event.target.value)}
            type="date"
            value={values.endDate}
          />
        </InputControl>
        <InputControl helper="(opsional)" label="Catatan">
          <Input
            onChange={(event) => setField("notes", event.target.value)}
            type="text"
            value={values.notes}
          />
        </InputControl>
        <div>
          <Button disabled={loading} type="submit">
            {loading ? "Menyimpan…" : "Catat mutasi"}
          </Button>
        </div>
      </form>
    </ContractCycleSection>
  );
}
