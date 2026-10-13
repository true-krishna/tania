"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { ErrorState } from "@/components/DataState";
import { CreateEmployeeDocument, type CreateEmployeeInput } from "@/generated/graphql";
import { mapSubmitError } from "@/lib/errors";
import { AuthGuard } from "@/lib/auth/guard";

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
  autoCreateEntra: boolean;
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
  autoCreateEntra: true,
};

const CONFLICT_MESSAGE =
  "Email atau NIK sudah terdaftar. Periksa kembali isian tersebut.";

export default function NewEmployeePage() {
  return (
    <AuthGuard module="employees" manage>
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
      autoCreateEntra: values.autoCreateEntra,
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
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setFormError(null);
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
      <PageHeader
        title="Tambah Karyawan"
        subtitle="Lengkapi data diri karyawan baru. Identitas kepegawaian (nomor induk) diisi pada kontrak."
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {formError ? <ErrorState message={formError} /> : null}
        <Label error={errors.nik}>
          NIK
          <Input
            type="text"
            value={values.nik}
            onChange={(e) => set("nik", e.target.value)}
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
            placeholder="cth. Ahmad Fauzi"
          />
        </Label>
        <Label error={errors.email}>
          Email
          <Input
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="cth. ahmad.fauzi@tania.co.id"
            autoComplete="email"
          />
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
            <option value="FEMALE">Perempuan</option>
            <option value="MALE">Laki-laki</option>
          </Select>
        </Label>
        <Label error={errors.phone}>
          Telepon
          <Input
            type="text"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="cth. 081234567890"
          />
        </Label>
        <Label error={errors.address}>
          Alamat
          <Input
            type="text"
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Alamat domisili"
          />
        </Label>
        <Label error={errors.latestEducation}>
          Pendidikan terakhir{" "}
          <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.latestEducation}
            onChange={(e) => set("latestEducation", e.target.value)}
            placeholder="cth. S1"
          />
        </Label>
        <Label error={errors.institutionName}>
          Nama institusi{" "}
          <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.institutionName}
            onChange={(e) => set("institutionName", e.target.value)}
            placeholder="cth. Universitas Telkom"
          />
        </Label>
        <Label error={errors.major}>
          Jurusan <span className="text-xs font-normal text-zinc-500">(opsional)</span>
          <Input
            type="text"
            value={values.major}
            onChange={(e) => set("major", e.target.value)}
            placeholder="cth. Teknik Informatika"
          />
        </Label>
        <Label error={errors.joinedAt}>
          Tanggal Bergabung
          <Input
            type="date"
            value={values.joinedAt}
            onChange={(e) => set("joinedAt", e.target.value)}
          />
        </Label>

        <label className="flex items-start gap-2 text-sm font-medium text-zinc-800">
          <input
            type="checkbox"
            checked={values.autoCreateEntra}
            onChange={(e) =>
              setValues((v) => ({ ...v, autoCreateEntra: e.target.checked }))
            }
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Buatkan akun Microsoft Entra
            <span className="block text-xs font-normal text-zinc-500">
              Dinonaktifkan bila akun dibuat manual. Karyawan tanpa akun Entra
              dapat diprovisi dari halaman Provisi Akun Entra (FR-43).
            </span>
          </span>
        </label>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            Simpan
          </Button>
          <Link href="/employees" className="no-underline">
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
