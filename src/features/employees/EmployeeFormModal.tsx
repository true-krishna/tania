"use client";

import * as React from "react";
import { useMutation, ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { ErrorState, LoadingState } from "@/components/DataState";
import { EMPLOYEE_STATUS_LABEL, GENDER_LABEL } from "@/features/employees/labels";
import { useEmployee } from "@/features/employees/useEmployee";
import {
  CreateEmployeeDocument,
  UpdateEmployeeDocument,
  type CreateEmployeeInput,
  type EmployeeStatus,
  type Gender,
  type UpdateEmployeeInput,
} from "@/generated/graphql";
import { mapSubmitError } from "@/lib/errors";
import { useToast } from "@/components/Toast/Toast";

type Mode = "create" | "edit";

type CreateFormValues = {
  nik: string;
  fullName: string;
  email: string;
  birthDate: string;
  gender: "" | Gender;
  phone: string;
  address: string;
  latestEducation: string;
  institutionName: string;
  major: string;
  joinedAt: string;
};

type EditFormValues = {
  nikBaru: string;
  fullName: string;
  email: string;
  birthDate: string;
  gender: "" | Gender;
  phone: string;
  address: string;
  latestEducation: string;
  institutionName: string;
  major: string;
  joinedAt: string;
  status: EmployeeStatus;
};

type EmployeeData = NonNullable<ReturnType<typeof useEmployee>["data"]>;

const CONFLICT_MESSAGE =
  "Email atau NIK sudah terdaftar. Periksa kembali isian tersebut.";

const CREATE_EMPTY: CreateFormValues = {
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

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  employeeId?: string;
}

export function EmployeeFormModal({ open, onClose, mode, employeeId }: EmployeeFormModalProps) {
  const isEdit = mode === "edit";
  const { status: employeeStatus, data: employee, error: employeeError } = useEmployee(
    isEdit && employeeId ? employeeId : ""
  );

  const title = isEdit ? `Ubah Data — ${employee?.fullName ?? ""}` : "Tambah Karyawan";
  const subtitle = isEdit
    ? "NIK selalu tampil tersamar; isi NIK baru hanya bila ingin menggantinya."
    : "Lengkapi data diri karyawan baru. Identitas kepegawaian (nomor induk) diisi pada kontrak.";

  const content = isEdit ? (
    employeeStatus === "loading" ? (
      <LoadingState />
    ) : employeeStatus === "error" ? (
      <ErrorState message={employeeError ?? "Gagal memuat data karyawan."} />
    ) : !employee ? (
      <ErrorState message="Karyawan tidak ditemukan." />
    ) : (
      <EditEmployeeForm
        employee={employee}
        employeeId={employeeId ?? ""}
        onClose={onClose}
      />
    )
  ) : (
    <CreateEmployeeForm onClose={onClose} />
  );

  return (
    <Modal
      onClose={onClose}
      open={open}
      size="lg"
      subtitle={subtitle}
      title={title}
    >
      {content}
    </Modal>
  );
}

function CreateEmployeeForm({ onClose }: { onClose: () => void }) {
  const { pushToast } = useToast();
  const [createEmployee, { loading }] = useMutation(CreateEmployeeDocument, {
    refetchQueries: ["Employees"],
  });

  const [values, setValues] = React.useState<CreateFormValues>(CREATE_EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof CreateFormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function set<K extends keyof CreateFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(toCheck: CreateFormValues): Partial<Record<keyof CreateFormValues, string>> {
    const next: Partial<Record<keyof CreateFormValues, string>> = {};
    if (!toCheck.nik.trim()) next.nik = "NIK wajib diisi.";
    else if (!/^\d{16}$/.test(toCheck.nik.trim()))
      next.nik = "NIK harus terdiri dari 16 digit angka.";
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
      pushToast("success", `Karyawan ${values.fullName} berhasil dibuat.`);
      onClose();
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        CONFLICT_MESSAGE,
        "Gagal membuat karyawan."
      );
      if (submitError.field && submitError.field in values) {
        setErrors((prev) => ({
          ...prev,
          [submitError.field as keyof CreateFormValues]: submitError.message,
        }));
      } else {
        setFormError(submitError.message);
      }
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
    >
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
            ...(Object.keys(GENDER_LABEL) as Array<keyof typeof GENDER_LABEL>).map(
              (value) => ({ value, label: GENDER_LABEL[value] })
            ),
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
      <InputControl
        error={errors.latestEducation}
        helper="(opsional)"
        label="Pendidikan terakhir"
      >
        <Input
          onChange={(e) => set("latestEducation", e.target.value)}
          placeholder="cth. S1"
          type="text"
          value={values.latestEducation}
        />
      </InputControl>
      <InputControl
        error={errors.institutionName}
        helper="(opsional)"
        label="Nama institusi"
      >
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
      <div className="flex justify-end gap-2 border-t border-tp-line pt-3">
        <Button onClick={onClose} type="button" variant="secondary">
          Batal
        </Button>
        <Button disabled={loading} type="submit">
          Simpan
        </Button>
      </div>
    </form>
  );
}

function EditEmployeeForm({
  employee,
  employeeId,
  onClose,
}: {
  employee: EmployeeData;
  employeeId: string;
  onClose: () => void;
}) {
  const { pushToast } = useToast();
  const [updateEmployee, { loading }] = useMutation(UpdateEmployeeDocument, {
    refetchQueries: ["Employees"],
  });

  const [values, setValues] = React.useState<EditFormValues>({
    nikBaru: "",
    fullName: employee.fullName,
    email: employee.email,
    birthDate: employee.birthDate ?? "",
    gender: employee.gender ?? "",
    phone: employee.phone ?? "",
    address: employee.address ?? "",
    latestEducation: employee.latestEducation ?? "",
    institutionName: employee.institutionName ?? "",
    major: employee.major ?? "",
    joinedAt: employee.joinedAt,
    status: employee.status,
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof EditFormValues, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  function set<K extends keyof EditFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate(toCheck: EditFormValues): Partial<Record<keyof EditFormValues, string>> {
    const next: Partial<Record<keyof EditFormValues, string>> = {};
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
      await updateEmployee({ variables: { id: employeeId, input } });
      pushToast("success", `Perubahan data ${values.fullName} berhasil disimpan.`);
      onClose();
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        CONFLICT_MESSAGE,
        "Gagal menyimpan perubahan."
      );
      if (submitError.field && submitError.field in values) {
        setErrors((prev) => ({
          ...prev,
          [submitError.field as keyof EditFormValues]: submitError.message,
        }));
      } else {
        setFormError(submitError.message);
      }
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
    >
      {formError ? <ErrorState message={formError} /> : null}
      <div className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
        <span>NIK saat ini</span>
        <span className="font-mono text-sm font-normal text-zinc-700">
          {employee.nikMasked}
        </span>
      </div>
      <InputControl
        error={errors.nikBaru}
        helper="(opsional — kosongkan bila tidak berubah)"
        label="NIK baru"
      >
        <Input
          inputMode="numeric"
          onChange={(e) => set("nikBaru", e.target.value)}
          placeholder="16 digit nomor KTP"
          type="text"
          value={values.nikBaru}
        />
      </InputControl>
      <InputControl error={errors.fullName} label="Nama lengkap">
        <Input
          onChange={(e) => set("fullName", e.target.value)}
          type="text"
          value={values.fullName}
        />
      </InputControl>
      <InputControl error={errors.email} label="Email">
        <Input
          onChange={(e) => set("email", e.target.value)}
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
            ...(Object.keys(GENDER_LABEL) as Array<keyof typeof GENDER_LABEL>).map(
              (value) => ({ value, label: GENDER_LABEL[value] })
            ),
          ]}
          value={values.gender}
        />
      </InputControl>
      <InputControl error={errors.phone} label="Telepon">
        <Input
          onChange={(e) => set("phone", e.target.value)}
          type="text"
          value={values.phone}
        />
      </InputControl>
      <InputControl error={errors.address} label="Alamat">
        <Input
          onChange={(e) => set("address", e.target.value)}
          type="text"
          value={values.address}
        />
      </InputControl>
      <InputControl
        error={errors.latestEducation}
        helper="(opsional)"
        label="Pendidikan terakhir"
      >
        <Input
          onChange={(e) => set("latestEducation", e.target.value)}
          type="text"
          value={values.latestEducation}
        />
      </InputControl>
      <InputControl
        error={errors.institutionName}
        helper="(opsional)"
        label="Nama institusi"
      >
        <Input
          onChange={(e) => set("institutionName", e.target.value)}
          type="text"
          value={values.institutionName}
        />
      </InputControl>
      <InputControl error={errors.major} helper="(opsional)" label="Jurusan">
        <Input
          onChange={(e) => set("major", e.target.value)}
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
      <InputControl label="Status kepegawaian">
        <Select
          onChange={(e) => set("status", e.target.value)}
          options={(
            Object.keys(EMPLOYEE_STATUS_LABEL) as Array<
              keyof typeof EMPLOYEE_STATUS_LABEL
            >
          ).map((value) => ({ value, label: EMPLOYEE_STATUS_LABEL[value] }))}
          value={values.status}
        />
      </InputControl>
      <div className="flex justify-end gap-2 border-t border-tp-line pt-3">
        <Button onClick={onClose} type="button" variant="secondary">
          Batal
        </Button>
        <Button disabled={loading} type="submit">
          Simpan
        </Button>
      </div>
    </form>
  );
}
