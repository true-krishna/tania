import type {
  CreateEmployeeInput,
  EmployeeStatus,
  Gender,
  UpdateEmployeeInput,
} from "@/generated/graphql";
import type { useEmployee } from "./useEmployee";

export type EmployeeFormMode = "create" | "edit";

export type EmployeeData = NonNullable<ReturnType<typeof useEmployee>["data"]>;

export type PersonalFormValues = {
  address: string;
  birthDate: string;
  email: string;
  fullName: string;
  gender: "" | Gender;
  institutionName: string;
  joinedAt: string;
  latestEducation: string;
  major: string;
  phone: string;
};

export type CreateFormValues = PersonalFormValues & {
  nik: string;
};

export type EditFormValues = PersonalFormValues & {
  nikBaru: string;
  status: EmployeeStatus;
};

export type ValidPersonalFormValues = Omit<PersonalFormValues, "gender"> & {
  gender: Gender;
};

export type PersonalInput = Omit<CreateEmployeeInput, "nik">;

const CREATE_EMPTY: CreateFormValues = {
  address: "",
  birthDate: "",
  email: "",
  fullName: "",
  gender: "",
  institutionName: "",
  joinedAt: "",
  latestEducation: "",
  major: "",
  nik: "",
  phone: "",
};

export function createEmptyFormValues(): CreateFormValues {
  return { ...CREATE_EMPTY };
}

export function createEditFormValues(employee: EmployeeData): EditFormValues {
  return {
    address: employee.address ?? "",
    birthDate: employee.birthDate ?? "",
    email: employee.email,
    fullName: employee.fullName,
    gender: employee.gender ?? "",
    institutionName: employee.institutionName ?? "",
    joinedAt: employee.joinedAt,
    latestEducation: employee.latestEducation ?? "",
    major: employee.major ?? "",
    nikBaru: "",
    phone: employee.phone ?? "",
    status: employee.status,
  };
}

function buildOptionalFields(values: PersonalFormValues) {
  const latestEducation = values.latestEducation.trim();
  const institutionName = values.institutionName.trim();
  const major = values.major.trim();

  return {
    ...(latestEducation ? { latestEducation } : {}),
    ...(institutionName ? { institutionName } : {}),
    ...(major ? { major } : {}),
  };
}

export function buildPersonalInput(
  values: ValidPersonalFormValues
): PersonalInput {
  return {
    address: values.address.trim(),
    birthDate: values.birthDate,
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    gender: values.gender,
    joinedAt: values.joinedAt,
    phone: values.phone.trim(),
    ...buildOptionalFields(values),
  };
}

export function buildCreateEmployeeInput(
  values: CreateFormValues & { gender: Gender }
): CreateEmployeeInput {
  return {
    nik: values.nik.trim(),
    ...buildPersonalInput(values),
  };
}

export function buildUpdateEmployeeInput(
  values: EditFormValues & { gender: Gender }
): UpdateEmployeeInput {
  const nikBaru = values.nikBaru.trim();

  return {
    status: values.status,
    ...buildPersonalInput(values),
    ...(nikBaru ? { nik: nikBaru } : {}),
  };
}
