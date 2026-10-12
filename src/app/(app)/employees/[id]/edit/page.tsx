"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ErrorState, LoadingState } from "@/components/DataState";
import { useEmployee } from "@/features/employees/useEmployee";
import { EMPLOYEE_STATUS_LABEL, GENDER_LABEL } from "@/features/employees/labels";
import {
  EmployeeDocument,
  UpdateEmployeeDocument,
  type EmployeeQuery,
  type EmployeeStatus,
  type Gender,
  type UpdateEmployeeInput,
} from "@/generated/graphql";
import { mapSubmitError } from "@/lib/errors";

type EmployeeData = NonNullable<EmployeeQuery["employee"]>;

type FormValues = {
  nikBaru: string;
  fullName: string;
  email: string;
  birthDate: string;
  gender: Gender | "";
  phone: string;
  address: string;
  latestEducation: string;
  institutionName: string;
  major: string;
  joinedAt: string;
  status: EmployeeStatus;
};

const CONFLICT_MESSAGE =
  "Email atau NIK sudah terdaftar. Periksa kembali isian tersebut.";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { status, data: employee, error } = useEmployee(id);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data karyawan."} />;
  if (!employee) return <ErrorState message="Karyawan tidak ditemukan." />;

  return (
    <>
      <PageHeader
        title={`Ubah Data — ${employee.fullName}`}
        subtitle="NIK selalu tampil tersamar; isi NIK baru hanya bila ingin menggantinya."
      />
      <EditEmployeeForm id={id} employee={employee} />
    </>
  );
}

function EditEmployeeForm({ id, employee }: { id: string; employee: EmployeeData }) {
  const [updateEmployee, { loading: saving, data: saved }] = useMutation(UpdateEmployeeDocument, {
    refetchQueries: [{ query: EmployeeDocument, variables: { id } }],
  });
  const [values, setValues] = React.useState<FormValues>(() => ({
    nikBaru: "",
    fullName: employee.fullName,
    email: employee.email,
    birthDate: employee.birthDate,
    gender: employee.gender,
    phone: employee.phone ?? "",
    address: employee.address ?? "",
    latestEducation: employee.latestEducation ?? "",
    institutionName: employee.institutionName ?? "",
    major: employee.major ?? "",
    joinedAt: employee.joinedAt,
    status: employee.status,
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
    if (toCheck.nikBaru.trim() && !/^\d{16}$/.test(toCheck.nikBaru.trim()))
      next.nikBaru = "NIK harus terdiri dari 16 digit angka.";
    if (!toCheck.fullName.trim()) next.fullName = "Nama lengkap wajib diisi.";
    if (!toCheck.email.trim()) next.email = "Email wajib diisi.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toCheck.email.trim()))
      next.email = "Format email tidak valid.";
    if (!toCheck.birthDate) next.birthDate = "Tanggal lahir wajib diisi.";
    if (!toCheck.gender) next.gender = "Jenis kelamin wajib dipilih.";
    if (!toCheck.phone.trim()) next.phone = "Telepon wajib diisi.";
    if (!toCheck.address.trim()) next.address = "Alamat wajib diisi.";
    if (!toCheck.joinedAt) next.joinedAt = "Tanggal bergabung wajib diisi.";
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    const gender = values.gender;
    if (!gender) return;
    const input: UpdateEmployeeInput = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      birthDate: values.birthDate,
      gender,
      phone: values.phone.trim(),
      address: values.address.trim(),
      joinedAt: values.joinedAt,
      status: values.status,
    };
    const nikBaru = values.nikBaru.trim();
    if (nikBaru) input.nik = nikBaru;
    const optional = {
      latestEducation: values.latestEducation.trim(),
      institutionName: values.institutionName.trim(),
      major: values.major.trim(),
    };
    if (optional.latestEducation) input.latestEducation = optional.latestEducation;
    if (optional.institutionName) input.institutionName = optional.institutionName;
    if (optional.major) input.major = optional.major;
    try {
      await updateEmployee({ variables: { id, input } });
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

  if (saved?.updateEmployee) {
    return (
      <section className="flex max-w-xl flex-col gap-4">
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Perubahan data {saved.updateEmployee.fullName} berhasil disimpan.
        </div>
        <Link href={`/employees/${id}`} className="w-fit">
          <Button type="button" variant="secondary">
            Kembali ke detail karyawan
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {formError ? <ErrorState message={formError} /> : null}
        <div className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
          <span>NIK saat ini</span>
          <span className="font-mono text-sm font-normal text-zinc-700">{employee.nikMasked}</span>
        </div>
        <Label error={errors.nikBaru}>
          NIK baru{" "}
          <span className="text-xs font-normal text-zinc-500">
            (opsional — kosongkan bila tidak berubah)
          </span>
          <Input
            type="text"
            value={values.nikBaru}
            onChange={(e) => set("nikBaru", e.target.value)}
            placeholder="16 digit nomor KTP"
            inputMode="numeric"
          />
        </Label>
        <Label error={errors.fullName}>
          Nama lengkap
          <Input
            type="text"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </Label>
        <Label error={errors.email}>
          Email
          <Input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
        </Label>
        <Label error={errors.birthDate}>
          Tanggal lahir
          <Input
            type="date"
            value={values.birthDate}
            onChange={(e) => set("birthDate", e.target.value)}
          />
        </Label>
        <Label error={errors.gender}>
          Jenis kelamin
          <Select value={values.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">— pilih jenis kelamin —</option>
            {(Object.keys(GENDER_LABEL) as Array<keyof typeof GENDER_LABEL>).map((value) => (
              <option key={value} value={value}>
                {GENDER_LABEL[value]}
              </option>
            ))}
          </Select>
        </Label>
        <Label error={errors.phone}>
          Telepon
          <Input type="text" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </Label>
        <Label error={errors.address}>
          Alamat
          <Input type="text" value={values.address} onChange={(e) => set("address", e.target.value)} />
        </Label>
        <Label error={errors.latestEducation}>
          Pendidikan terakhir{" "}
          <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.latestEducation}
            onChange={(e) => set("latestEducation", e.target.value)}
          />
        </Label>
        <Label error={errors.institutionName}>
          Nama institusi{" "}
          <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.institutionName}
            onChange={(e) => set("institutionName", e.target.value)}
          />
        </Label>
        <Label error={errors.major}>
          Jurusan <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input type="text" value={values.major} onChange={(e) => set("major", e.target.value)} />
        </Label>
        <Label error={errors.joinedAt}>
          Tanggal Bergabung
          <Input
            type="date"
            value={values.joinedAt}
            onChange={(e) => set("joinedAt", e.target.value)}
          />
        </Label>
        <Label>
          Status kepegawaian
          <Select value={values.status} onChange={(e) => set("status", e.target.value)}>
            {(Object.keys(EMPLOYEE_STATUS_LABEL) as Array<keyof typeof EMPLOYEE_STATUS_LABEL>).map(
              (value) => (
                <option key={value} value={value}>
                  {EMPLOYEE_STATUS_LABEL[value]}
                </option>
              )
            )}
          </Select>
        </Label>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            Simpan
          </Button>
          <Link href={`/employees/${id}`} className="no-underline">
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
