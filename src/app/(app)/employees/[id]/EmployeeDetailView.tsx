"use client";

import Link from "next/link";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { useEmployee } from "@/features/employees/useEmployee";
import { EmployeeFormModal } from "@/features/employees/EmployeeFormModal";
import { DeactivateEmployeeDocument } from "@/generated/graphql";
import { useModuleAccess } from "@/lib/auth/access";
import { useSessionRole } from "@/lib/auth/guard";
import { EMPLOYEES } from "@/lib/constants/routes";
import { EmployeeDetailContent } from "./EmployeeDetailContent";

type DetailTab = "overview" | "cv";

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Ringkasan" },
  { id: "cv", label: "CV" },
];

export function EmployeeDetailView({ employeeId: id }: { employeeId: string }) {
  const role = useSessionRole();
  const showCv = role === "CHAPTER" || role === "OPERATION" || role === "ADMIN";
  const tabs = DETAIL_TABS.filter((item) => item.id !== "cv" || showCv);
  const manage = useModuleAccess("employees").canManage;
  const showHistory = role === "OPERATION" || role === "ADMIN";
  const showEntra = useModuleAccess("entra").canRead;
  const linkContracts = useModuleAccess("contracts").canRead;
  const { status, data, error } = useEmployee(id);
  const [tab, setTab] = React.useState<DetailTab>("overview");
  const [editOpen, setEditOpen] = React.useState(false);
  const [deactivate, { loading: deactivating }] = useMutation(DeactivateEmployeeDocument, {
    refetchQueries: ["Employees", "Employee"],
  });

  return (
    <section className="flex flex-col gap-4">
      {role === "TALENT" ? null : (
        <Link className="w-fit text-sm text-zinc-500 hover:text-zinc-900" href={EMPLOYEES}>
          ← Kembali ke daftar
        </Link>
      )}
      <PageHeader
        actions={
          data && manage ? (
            <Button onClick={() => setEditOpen(true)} variant="secondary">
              Ubah data
            </Button>
          ) : undefined
        }
        subtitle={data ? `${data.nomorInduk ?? "Tanpa kontrak aktif"} · ${data.email}` : undefined}
        title={data?.fullName ?? "Detail karyawan"}
      />

      <div
        aria-label="Detail karyawan"
        className="flex gap-6 border-b border-board-border"
        role="tablist"
      >
        {tabs.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              aria-selected={selected}
              className={
                selected
                  ? "-mb-px border-b-2 border-tp-brand-navy px-1 py-2 text-sm font-semibold text-zinc-900"
                  : "-mb-px border-b-2 border-transparent px-1 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
              }
              key={item.id}
              onClick={() => setTab(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <EmployeeDetailContent
        data={data}
        deactivating={deactivating}
        error={error}
        id={id}
        linkContracts={linkContracts}
        manage={manage}
        onDeactivate={() => deactivate({ variables: { id } })}
        showEntra={showEntra}
        showHistory={showHistory}
        status={status}
        tab={tab}
      />

      <EmployeeFormModal
        employeeId={id}
        mode="edit"
        onClose={() => setEditOpen(false)}
        open={editOpen}
      />
    </section>
  );
}
