import type {
  BandPosition,
  ContractEndReason,
  ContractType,
  EmploymentContractStatus,
  WorkLocation,
} from "@/generated/graphql/types";

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  PKWT: "PKWT",
  PKWTT: "PKWTT",
  TPPBW_PROHIRE: "TPPBW PROHIRE",
  EMPLOYEE_MOBILIT: "EMPLOYEE MOBILIT",
  PROJECT_BASED_PROCUREMENT: "PROJECT BASED PROCUREMENT",
  OUTSOURCE_TKP: "OUTSOURCE TKP",
  KARYAWAN_TETAP: "KARYAWAN TETAP",
  TKWT_DIGITAL_TALENT: "TKWT DIGITAL TALENT",
};

/** Contract types in the order they appear in selects. */
export const CONTRACT_TYPE_ORDER: ContractType[] = [
  "PKWT",
  "PKWTT",
  "TPPBW_PROHIRE",
  "EMPLOYEE_MOBILIT",
  "PROJECT_BASED_PROCUREMENT",
  "OUTSOURCE_TKP",
  "KARYAWAN_TETAP",
  "TKWT_DIGITAL_TALENT",
];

/** Open-ended types run without a fixed end date (PKWTT / KARYAWAN TETAP). */
export function isOpenEndedContractType(contractType: ContractType): boolean {
  return contractType === "PKWTT" || contractType === "KARYAWAN_TETAP";
}

export const CONTRACT_STATUS_LABEL: Record<EmploymentContractStatus, string> = {
  ACTIVE: "Aktif",
  ENDED: "Berakhir",
  TERMINATED: "Dihentikan",
};

export const CONTRACT_END_REASON_LABEL: Record<ContractEndReason, string> = {
  EXPIRY: "Habis masa berlaku",
  RESIGN: "Resign",
  RETIREMENT: "Pensiun",
  MUTATION: "Mutasi",
};

export const WORK_LOCATION_LABEL: Record<WorkLocation, string> = {
  JAKARTA: "Jakarta",
  BANDUNG: "Bandung",
};

export const BAND_POSITION_LABEL: Record<BandPosition, string> = {
  I: "I",
  II: "II",
  III: "III",
  IV: "IV",
  V: "V",
  VI: "VI",
  UNDEFINED: "Belum ditetapkan",
};
