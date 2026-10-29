import type { EducationLevel } from "@/generated/graphql";

export const EDUCATION_LEVELS: readonly {
  label: string;
  value: EducationLevel;
}[] = [
  { label: "SMA/SMK Sederajat", value: "SMA_SMK_SEDERAJAT" },
  { label: "D3", value: "D3" },
  { label: "S1", value: "S1" },
  { label: "S2", value: "S2" },
  { label: "S3", value: "S3" },
];

export function formatDegree(degree: string | null | undefined): string {
  if (!degree) return "";
  return EDUCATION_LEVELS.find((level) => level.value === degree)?.label ?? degree;
}
