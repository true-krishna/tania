import type { ChipVariant } from "@/components/Chip";
import type { EmployeeStatus, Gender } from "@/generated/graphql/types";

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  RESIGNED: "Resign",
  RETIRED: "Pensiun",
};

export const EMPLOYEE_STATUS_VARIANT: Record<EmployeeStatus, ChipVariant> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  RESIGNED: "warning",
  RETIRED: "neutral",
};

export const GENDER_LABEL: Record<Gender, string> = {
  FEMALE: "Perempuan",
  MALE: "Laki-laki",
};
