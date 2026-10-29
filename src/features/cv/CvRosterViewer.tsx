"use client";

import * as React from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useCvProfile } from "@/features/cv/useCvProfile";
import { useEmployees } from "@/features/employees/useEmployees";
import { CvRosterContent } from "./CvRosterContent";

type CvAudience = "ADMIN" | "CHAPTER" | "OPERATION";

export function CvRosterViewer({ audience }: { audience: CvAudience }) {
  const talents = useEmployees({ assignableOnly: true });
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState("");
  const { status, data, error } = useCvProfile(selectedEmployeeId || null);

  if (talents.status === "loading") return <LoadingState />;
  if (talents.status === "error") {
    return <ErrorState message={talents.error ?? "Gagal memuat daftar talent."} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle={
          audience === "CHAPTER"
            ? "Lihat profil CV talent dalam chapter Anda (hanya-baca, FR-13)."
            : "Lihat profil CV seluruh talent (hanya-baca; konten CV milik talent, FR-13)."
        }
        title="Profil CV Talent"
      />
      <InputControl label="Pilih Talent">
        <Select
          aria-label="Pilih talent"
          onChange={(event) => setSelectedEmployeeId(event.target.value)}
          options={[
            { label: "— pilih talent —", value: "" },
            ...(talents.employees ?? []).map((employee) => ({
              label: `${employee.fullName} (${employee.nomorInduk ?? "—"})`,
              value: employee.id,
            })),
          ]}
          value={selectedEmployeeId}
        />
      </InputControl>

      <CvRosterContent
        data={data}
        error={error}
        selectedEmployeeId={selectedEmployeeId}
        status={status}
      />
    </section>
  );
}
