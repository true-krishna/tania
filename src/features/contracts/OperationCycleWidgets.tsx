"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import {
  useEmployeesNeedingFollowUp,
  useExpiringContracts,
  useRetirementAge,
} from "@/features/contracts/useContractCycle";
import { usePreRetirementCandidates } from "@/features/employees/usePreRetirement";
import { CONTRACT_END_REASON_LABEL } from "@/features/contracts/labels";
import { CONTRACT_DETAIL, EMPLOYEE_DETAIL } from "@/lib/constants/routes";
import type { PreRetirementCandidatesQuery } from "@/generated/graphql";

type CandidateNode =
  PreRetirementCandidatesQuery["employees"]["edges"][number]["node"];

type PreRetirementHit = { node: CandidateNode; daysUntil: number };

const DAY_MS = 86_400_000;

function retirementDate(birthDate: string, age: number): Date | null {
  const born = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) return null;
  const retired = new Date(born);
  retired.setUTCFullYear(retired.getUTCFullYear() + age);
  return retired;
}

function daysUntil(target: Date, now: Date): number {
  return Math.ceil((target.getTime() - now.getTime()) / DAY_MS);
}

function computePreRetirement(
  candidates: CandidateNode[],
  age: number,
  now: Date
): PreRetirementHit[] {
  return candidates
    .map((node) => {
      const date = node.birthDate ? retirementDate(node.birthDate, age) : null;
      return date ? { node, daysUntil: daysUntil(date, now) } : null;
    })
    .filter((hit): hit is PreRetirementHit => hit !== null && hit.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </Card>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}

function Counts({ urgent, total }: { urgent: number; total: number }) {
  return (
    <p className="text-sm text-zinc-600">
      <span className="text-lg font-semibold text-zinc-900">{total}</span> dalam H-90 ·{" "}
      <span className="font-semibold text-amber-700">{urgent}</span> dalam H-30
    </p>
  );
}

/**
 * Operation dashboard cycle indicators (FR-40) — T027.
 * Contract expiry uses the served `expiringContracts(days)` query (H-90/H-30),
 * follow-up uses `employeesNeedingFollowUp`, and pre-retirement is derived from
 * each active employee's birth date and the Admin-managed retirement age.
 */
export function OperationCycleWidgets() {
  const expiring90 = useExpiringContracts(90);
  const expiring30 = useExpiringContracts(30);
  const followUp = useEmployeesNeedingFollowUp();
  const retirementAge = useRetirementAge();
  const candidates = usePreRetirementCandidates();

  const age = retirementAge.data ?? 56;
  const preRetirement = React.useMemo(
    () => computePreRetirement(candidates.data ?? [], age, new Date()),
    [candidates.data, age]
  );
  const preRetirementUrgent = preRetirement.filter((hit) => hit.daysUntil <= 30).length;
  const expiring90List = expiring90.data ?? [];
  const followUpList = followUp.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel title="Kontrak segera berakhir">
        {expiring90.status === "loading" ? (
          <EmptyNote>Memuat…</EmptyNote>
        ) : expiring90.status === "error" ? (
          <EmptyNote>Gagal memuat kontrak segera berakhir.</EmptyNote>
        ) : (
          <>
            <Counts urgent={expiring30.data?.length ?? 0} total={expiring90List.length} />
            {expiring90List.length ? (
              <ul className="flex flex-col gap-2">
                {expiring90List.map((contract) => (
                  <li key={contract.id} className="rounded-lg border border-surface-border px-3 py-2">
                    <Link
                      href={CONTRACT_DETAIL(contract.id)}
                      className="text-sm font-medium text-zinc-900 hover:underline"
                    >
                      {contract.employee.fullName}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {contract.contractNo} · berakhir {contract.endDate}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote>Tidak ada kontrak yang berakhir dalam 90 hari.</EmptyNote>
            )}
          </>
        )}
      </Panel>

      <Panel title="Perlu tindak lanjut">
        {followUp.status === "loading" ? (
          <EmptyNote>Memuat…</EmptyNote>
        ) : followUp.status === "error" ? (
          <EmptyNote>Gagal memuat daftar tindak lanjut.</EmptyNote>
        ) : (
          <>
            <p className="text-sm text-zinc-600">
              <span className="text-lg font-semibold text-zinc-900">{followUpList.length}</span>{" "}
              karyawan kontraknya habis tanpa perpanjangan
            </p>
            {followUpList.length ? (
              <ul className="flex flex-col gap-2">
                {followUpList.map((employee) => {
                  const last = employee.contracts.edges[0]?.node;
                  return (
                    <li
                      key={employee.id}
                      className="rounded-lg border border-surface-border px-3 py-2"
                    >
                      <Link
                        href={EMPLOYEE_DETAIL(employee.id)}
                        className="text-sm font-medium text-zinc-900 hover:underline"
                      >
                        {employee.fullName}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {last
                          ? `${last.contractNo} · ${last.endReason ? CONTRACT_END_REASON_LABEL[last.endReason] : "berakhir"}`
                          : "Tanpa kontrak aktif"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyNote>Tidak ada karyawan yang perlu tindak lanjut.</EmptyNote>
            )}
          </>
        )}
      </Panel>

      <Panel title="Pra-pensiun">
        {candidates.status === "loading" || retirementAge.status === "loading" ? (
          <EmptyNote>Memuat…</EmptyNote>
        ) : candidates.status === "error" || retirementAge.status === "error" ? (
          <EmptyNote>Gagal memuat data pra-pensiun.</EmptyNote>
        ) : (
          <>
            <p className="text-xs text-zinc-500">Usia pensiun: {age} tahun</p>
            <Counts urgent={preRetirementUrgent} total={preRetirement.length} />
            {preRetirement.length ? (
              <ul className="flex flex-col gap-2">
                {preRetirement.map((hit) => (
                  <li
                    key={hit.node.id}
                    className="rounded-lg border border-surface-border px-3 py-2"
                  >
                    <Link
                      href={EMPLOYEE_DETAIL(hit.node.id)}
                      className="text-sm font-medium text-zinc-900 hover:underline"
                    >
                      {hit.node.fullName}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {hit.node.nomorInduk ?? "—"} · pensiun dalam {Math.max(hit.daysUntil, 0)} hari
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote>Tidak ada karyawan dalam jendela pra-pensiun.</EmptyNote>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
