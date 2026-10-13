import type {
  BandPosition,
  ContractEndReason,
  ContractType,
  EmploymentContractStatus,
  WorkLocation,
} from "@/generated/graphql/types";

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  TPPBW_PROHIRE: "TPPBW PROHIRE",
  EMPLOYEE_MOBILIT: "EMPLOYEE MOBILIT",
  PROJECT_BASED_PROCUREMENT: "PROJECT BASED PROCUREMENT",
  OUTSOURCE_TKP: "OUTSOURCE TKP",
  KARYAWAN_TETAP: "KARYAWAN TETAP",
  TKWT_DIGITAL_TALENT: "TKWT DIGITAL TALENT",
};

/** Contract types in the order they appear in selects. */
export const CONTRACT_TYPE_ORDER: ContractType[] = [
  "TPPBW_PROHIRE",
  "EMPLOYEE_MOBILIT",
  "PROJECT_BASED_PROCUREMENT",
  "OUTSOURCE_TKP",
  "KARYAWAN_TETAP",
  "TKWT_DIGITAL_TALENT",
];

/** Only KARYAWAN TETAP runs without a fixed end date. */
export function isOpenEndedContractType(contractType: ContractType): boolean {
  return contractType === "KARYAWAN_TETAP";
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
  UNDEFINED: "Belum ditetapkan",
};

/**
 * Work location as a form value. `UNDEFINED` is the sentinel for a contract
 * whose location was never recorded (legacy rows, FR-33 phase 1) — it is not a
 * user choice and `workLocation` is required on a contract (FR-34), so the form
 * asks for a real location instead of silently carrying the sentinel forward.
 */
export function workLocationFormValue(location: WorkLocation): WorkLocation | "" {
  return location === "UNDEFINED" ? "" : location;
}

export const BAND_POSITION_LABEL: Record<BandPosition, string> = {
  I: "I",
  II: "II",
  III: "III",
  IV: "IV",
  V: "V",
  VI: "VI",
  UNDEFINED: "Belum ditetapkan",
};
