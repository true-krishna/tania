"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ErrorState } from "@/components/DataState";
import { CreateEmployeeDocument, type CreateEmployeeInput } from "@/generated/graphql";
import { mapSubmitError } from "@/lib/errors";
import { AuthGuard } from "@/lib/auth/guard";
import { EMPLOYEES } from "@/lib/constants/routes";

type FormValues = {
  nik: string;
  fullName: string;
  email: string;
  birthDate: string;
  gender: "" | "FEMALE" | "MALE";
  phone: string;
  address: string;
  latestEducation: string;
  institutionName: string;
  major: string;
  joinedAt: string;
};

const EMPTY: FormValues = {
  nik: "",
  fullName: "",
  email: "",
  birthDate: "",
  gender: "",
  phone: "",
  address: "",
  latestEducation: "",
  institutionName: "",
  major: "",
  joinedAt: "",
};

const CONFLICT_MESSAGE =
  "Email atau NIK sudah terdaftar. Periksa kembali isian tersebut.";

export default function NewEmployeePage() {
  return (
    <AuthGuard manage module="employees">
      <NewEmployeeForm />
    </AuthGuard>
  );
}

function NewEmployeeForm() {
  const [createEmployee, { data, error, loading }] = useMutation(CreateEmployeeDocument);
  const [values, setValues] = React.useState<FormValues>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  function set<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(valuesToCheck: FormValues): Partial<Record<keyof FormValues, string>> {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!valuesToCheck.nik.trim()) next.nik = "NIK wajib diisi.";
    else if (!/^\d{16}$/.test(valuesToCheck.nik.trim()))
      next.nik = "NIK harus terdiri dari 16 digit angka.";
    if (!valuesToCheck.fullName.trim()) next.fullName = "Nama lengkap wajib diisi.";
    if (!valuesToCheck.email.trim()) next.email = "Email wajib diisi.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valuesToCheck.email.trim()))
      next.email = "Format email tidak valid.";
    if (!valuesToCheck.birthDate) next.birthDate = "Tanggal lahir wajib diisi.";
    if (!valuesToCheck.gender) next.gender = "Jenis kelamin wajib dipilih.";
    if (!valuesToCheck.phone.trim()) next.phone = "Telepon wajib diisi.";
    if (!valuesToCheck.address.trim()) next.address = "Alamat wajib diisi.";
    if (!valuesToCheck.joinedAt) next.joinedAt = "Tanggal bergabung wajib diisi.";
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
    const input: CreateEmployeeInput = {
      nik: values.nik.trim(),
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      birthDate: values.birthDate,
      gender,
      phone: values.phone.trim(),
      address: values.address.trim(),
      joinedAt: values.joinedAt,
    };
    const optional = {
      latestEducation: values.latestEducation.trim(),
      institutionName: values.institutionName.trim(),
      major: values.major.trim(),
    };
    if (optional.latestEducation) input.latestEducation = optional.latestEducation;
    if (optional.institutionName) input.institutionName = optional.institutionName;
    if (optional.major) input.major = optional.major;
    try {
      await createEmployee({ variables: { input } });
      setSubmitted(true);
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        CONFLICT_MESSAGE,
        "Gagal membuat karyawan."
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
    const ok = Boolean(data?.createEmployee);
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
            ? `Karyawan ${values.fullName} berhasil dibuat.`
            : error?.message ?? "Terjadi kesalahan saat membuat karyawan."}
        </div>
        <button
          className="w-fit rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setFormError(null);
            setSubmitted(false);
          }}
          type="button"
        >
          Tambah karyawan lain
        </button>
      </section>
    );
  }

  return (
    <section className="flex max-w-xl flex-col gap-4">
      <PageHeader
        subtitle="Lengkapi data diri karyawan baru. Identitas kepegawaian (nomor induk) diisi pada kontrak."
        title="Tambah Karyawan"
      />

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {formError ? <ErrorState message={formError} /> : null}
        <InputControl error={errors.nik} label="NIK">
          <Input
            inputMode="numeric"
            onChange={(e) => set("nik", e.target.value)}
            placeholder="16 digit nomor KTP"
            type="text"
            value={values.nik}
          />
        </InputControl>
        <InputControl error={errors.fullName} label="Nama lengkap">
          <Input
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="cth. Ahmad Fauzi"
            type="text"
            value={values.fullName}
          />
        </InputControl>
        <InputControl error={errors.email} label="Email">
          <Input
            autoComplete="email"
            onChange={(e) => set("email", e.target.value)}
            placeholder="cth. ahmad.fauzi@tania.co.id"
            type="email"
            value={values.email}
          />
        </InputControl>
        <InputControl error={errors.birthDate} label="Tanggal lahir">
          <Input
            onChange={(e) => set("birthDate", e.target.value)}
            type="date"
            value={values.birthDate}
          />
        </InputControl>
        <InputControl error={errors.gender} label="Jenis kelamin">
          <Select
            onChange={(e) => set("gender", e.target.value)}
            options={[
              { value: "", label: "— pilih jenis kelamin —" },
              { value: "FEMALE", label: "Perempuan" },
              { value: "MALE", label: "Laki-laki" },
            ]}
            value={values.gender}
          />
        </InputControl>
        <InputControl error={errors.phone} label="Telepon">
          <Input
            onChange={(e) => set("phone", e.target.value)}
            placeholder="cth. 081234567890"
            type="text"
            value={values.phone}
          />
        </InputControl>
        <InputControl error={errors.address} label="Alamat">
          <Input
            onChange={(e) => set("address", e.target.value)}
            placeholder="Alamat domisili"
            type="text"
            value={values.address}
          />
        </InputControl>
        <InputControl error={errors.latestEducation} helper="(opsional)" label="Pendidikan terakhir">
          <Input
            onChange={(e) => set("latestEducation", e.target.value)}
            placeholder="cth. S1"
            type="text"
            value={values.latestEducation}
          />
        </InputControl>
        <InputControl error={errors.institutionName} helper="(opsional)" label="Nama institusi">
          <Input
            onChange={(e) => set("institutionName", e.target.value)}
            placeholder="cth. Universitas Telkom"
            type="text"
            value={values.institutionName}
          />
        </InputControl>
        <InputControl error={errors.major} helper="(opsional)" label="Jurusan">
          <Input
            onChange={(e) => set("major", e.target.value)}
            placeholder="cth. Teknik Informatika"
            type="text"
            value={values.major}
          />
        </InputControl>
        <InputControl error={errors.joinedAt} label="Tanggal Bergabung">
          <Input
            onChange={(e) => set("joinedAt", e.target.value)}
            type="date"
            value={values.joinedAt}
          />
        </InputControl>

        <div className="flex gap-2">
          <Button disabled={loading} type="submit">
            Simpan
          </Button>
          <Link className="no-underline" href={EMPLOYEES}>
            <Button type="button" variant="secondary">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </section>
  );
}
