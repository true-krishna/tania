import { ApolloError } from "@apollo/client";
import type { Dispatch, SetStateAction } from "react";
import { mapSubmitError } from "@/lib/errors";
import type {
  CreateFormValues,
  EditFormValues,
  PersonalFormValues,
} from "./employeeFormValues";

export type FormErrors<TValues> = Partial<Record<keyof TValues, string>>;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NIK_PATTERN = /^\d{16}$/;

export const CONFLICT_MESSAGE =
  "Email atau NIK sudah terdaftar. Periksa kembali isian tersebut.";

export function validatePersonalFields(
  values: PersonalFormValues
): FormErrors<PersonalFormValues> {
  const errors: FormErrors<PersonalFormValues> = {};

  if (!values.fullName.trim()) errors.fullName = "Nama lengkap wajib diisi.";
  if (!values.email.trim()) errors.email = "Email wajib diisi.";
  else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Format email tidak valid.";
  }
  if (!values.birthDate) errors.birthDate = "Tanggal lahir wajib diisi.";
  if (!values.gender) errors.gender = "Jenis kelamin wajib dipilih.";
  if (!values.phone.trim()) errors.phone = "Telepon wajib diisi.";
  if (!values.address.trim()) errors.address = "Alamat wajib diisi.";
  if (!values.joinedAt) errors.joinedAt = "Tanggal bergabung wajib diisi.";

  return errors;
}

export function validateCreateForm(
  values: CreateFormValues
): FormErrors<CreateFormValues> {
  const errors: FormErrors<CreateFormValues> = validatePersonalFields(values);

  if (!values.nik.trim()) errors.nik = "NIK wajib diisi.";
  else if (!NIK_PATTERN.test(values.nik.trim())) {
    errors.nik = "NIK harus terdiri dari 16 digit angka.";
  }

  return errors;
}

export function validateEditForm(
  values: EditFormValues
): FormErrors<EditFormValues> {
  const errors: FormErrors<EditFormValues> = validatePersonalFields(values);

  if (values.nikBaru.trim() && !NIK_PATTERN.test(values.nikBaru.trim())) {
    errors.nikBaru = "NIK harus terdiri dari 16 digit angka.";
  }

  return errors;
}

type ApplyEmployeeSubmitErrorOptions<TValues extends object> = {
  error: unknown;
  fallbackMessage: string;
  setErrors: Dispatch<SetStateAction<FormErrors<TValues>>>;
  setFormError: (message: string) => void;
  values: TValues;
};

export function applyEmployeeSubmitError<TValues extends object>({
  error,
  fallbackMessage,
  setErrors,
  setFormError,
  values,
}: ApplyEmployeeSubmitErrorOptions<TValues>) {
  const submitError = mapSubmitError(
    error instanceof ApolloError ? error : null,
    CONFLICT_MESSAGE,
    fallbackMessage
  );
  const field = submitError.field;

  if (field && field in values) {
    setErrors((previous) => ({
      ...previous,
      [field as keyof TValues]: submitError.message,
    }));
    return;
  }

  setFormError(submitError.message);
}
