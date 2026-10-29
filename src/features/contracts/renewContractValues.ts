import type {
  ContractType,
  EmploymentContractQuery,
} from "@/generated/graphql";
import {
  isOpenEndedContractType,
  workLocationFormValue,
} from "./labels";
import type { BandPosition, WorkLocation } from "@/generated/graphql";

export type SourceContract = NonNullable<
  EmploymentContractQuery["employmentContract"]
>;

export type RenewContractFormValues = {
  bandPosition: BandPosition;
  contractNo: string;
  contractType: ContractType;
  endDate: string;
  jobLevel: string;
  jobRoleId: string;
  jobTitle: string;
  nomorInduk: string;
  notes: string;
  officeEmail: string;
  startDate: string;
  unitId: string;
  workLocation: WorkLocation | "";
};

export type RenewContractFormErrors = Partial<
  Record<keyof RenewContractFormValues, string>
>;

export function dayAfter(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function createRenewContractValues(
  contract: SourceContract
): RenewContractFormValues {
  return {
    bandPosition: contract.bandPosition,
    contractNo: "",
    contractType: contract.contractType,
    endDate: "",
    jobLevel: contract.jobLevel ?? "",
    jobRoleId: contract.jobRole.id,
    jobTitle: contract.jobTitle ?? "",
    nomorInduk: contract.nomorInduk,
    notes: "",
    officeEmail: contract.officeEmail ?? "",
    startDate: dayAfter(contract.endDate),
    unitId: contract.unit.id,
    workLocation: workLocationFormValue(contract.workLocation),
  };
}

export function validateRenewPeriod(
  values: RenewContractFormValues,
  predecessor: SourceContract
): RenewContractFormErrors {
  const errors: RenewContractFormErrors = {};

  if (!values.contractNo.trim()) {
    errors.contractNo = "Nomor kontrak wajib diisi.";
  }
  if (!values.startDate) {
    errors.startDate = "Tanggal mulai wajib diisi.";
  } else if (predecessor.endDate && values.startDate <= predecessor.endDate) {
    errors.startDate = `Tanggal mulai harus setelah kontrak lama berakhir (${predecessor.endDate}).`;
  }

  if (!isOpenEndedContractType(values.contractType)) {
    if (!values.endDate) {
      errors.endDate = "Tanggal selesai wajib untuk kontrak berbatas waktu.";
    } else if (values.startDate && values.endDate < values.startDate) {
      errors.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai.";
    }
  } else if (values.endDate) {
    errors.endDate =
      "Tanggal selesai harus kosong untuk kontrak tanpa batas waktu.";
  }

  return errors;
}

export function validateRenewAttributes(
  values: RenewContractFormValues
): RenewContractFormErrors {
  const errors: RenewContractFormErrors = {};

  if (!values.nomorInduk.trim()) {
    errors.nomorInduk = "Nomor induk wajib diisi.";
  }
  if (!values.unitId) errors.unitId = "Unit wajib dipilih.";
  if (!values.jobRoleId) errors.jobRoleId = "Job role wajib dipilih.";
  if (!values.workLocation) {
    errors.workLocation = "Work location wajib dipilih.";
  }

  return errors;
}
