"use client";

import Link from "next/link";
import * as React from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useJobRoles, useUnits } from "@/features/master-data/useMasterData";

type FormValues = {
  fullName: string;
  employeeCode: string;
  email: string;
  unitId: string;
  jobRoleId: string;
  joinedAt: string;
};

const EMPTY: FormValues = {
  fullName: "",
  employeeCode: "",
  email: "",
  unitId: "",
  jobRoleId: "",
  joinedAt: "",
};

export default function NewEmployeePage() {
  const units = useUnits();
  const jobRoles = useJobRoles();
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitted, setSubmitted] = React.useState(false);

  if (units.status === "loading" || jobRoles.status === "loading") return <LoadingState />;
  if (units.status === "error") return <ErrorState message={units.error ?? "Gagal memuat unit."} />;
  if (jobRoles.status === "error")
    return <ErrorState message={jobRoles.error ?? "Gagal memuat job role."} />;

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(valuesToCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!valuesToCheck.fullName.trim()) next.fullName = "Nama lengkap wajib diisi.";
    if (!valuesToCheck.employeeCode.trim()) next.employeeCode = "Kode karyawan wajib diisi.";
    if (!valuesToCheck.email.trim()) next.email = "Email wajib diisi.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valuesToCheck.email.trim()))
      next.email = "Format email tidak valid.";
    if (!valuesToCheck.unitId) next.unitId = "Unit wajib dipilih.";
    if (!valuesToCheck.jobRoleId) next.jobRoleId = "Job role wajib dipilih.";
    if (!valuesToCheck.joinedAt) next.joinedAt = "Tanggal bergabung wajib diisi.";
    return next;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="flex max-w-xl flex-col gap-4">
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Karyawan <strong>{values.fullName}</strong> disiapkan untuk dibuat (mock). Saat backend
          US1 tersedia, submit ini akan memanggil mutasi <code>createEmployee</code>.
        </div>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setSubmitted(false);
          }}
          className="w-fit rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Tambah karyawan lain
        </button>
      </section>
    );
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Tambah Karyawan</h1>
        <p className="mt-1 text-sm text-zinc-600">Lengkapi data karyawan baru.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Label error={errors.fullName}>
          Nama lengkap
          <input
            type="text"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="cth. Ahmad Fauzi"
          />
        </Label>
        <Label error={errors.employeeCode}>
          Kode karyawan
          <input
            type="text"
            value={values.employeeCode}
            onChange={(e) => set("employeeCode", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="cth. EMP-0100"
          />
        </Label>
        <Label error={errors.email}>
          Email
          <input
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="cth. ahmad.fauzi@tania.co.id"
            autoComplete="email"
          />
        </Label>
        <Label error={errors.unitId}>
          Unit
          <select
            value={values.unitId}
            onChange={(e) => set("unitId", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— pilih unit —</option>
            {units.data?.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </Label>
        <Label error={errors.jobRoleId}>
          Job Role
          <select
            value={values.jobRoleId}
            onChange={(e) => set("jobRoleId", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">— pilih job role —</option>
            {jobRoles.data?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </Label>
        <Label error={errors.joinedAt}>
          Tanggal Bergabung
          <input
            type="date"
            value={values.joinedAt}
            onChange={(e) => set("joinedAt", e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </Label>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Simpan
          </button>
          <Link
            href="/employees"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Batal
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