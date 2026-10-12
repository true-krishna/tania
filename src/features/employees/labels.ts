import type { EmployeeStatus, Gender } from "@/generated/graphql/types";

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  RESIGNED: "Resign",
  RETIRED: "Pensiun",
};

export const GENDER_LABEL: Record<Gender, string> = {
  FEMALE: "Perempuan",
  MALE: "Laki-laki",
};
