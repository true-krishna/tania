"use client";

import { useSessionRole } from "@/lib/auth/guard";
import { ChapterTalentOptions } from "./ChapterTalentOptions";
import { EmployeeTalentOptions } from "./EmployeeTalentOptions";

export function TalentOptions({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const role = useSessionRole();
  if (role === "CHAPTER") {
    return <ChapterTalentOptions labelledBy={labelledBy} onChange={onChange} value={value} />;
  }
  return <EmployeeTalentOptions labelledBy={labelledBy} onChange={onChange} value={value} />;
}
