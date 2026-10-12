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
};

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
