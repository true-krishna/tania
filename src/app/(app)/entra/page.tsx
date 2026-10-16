"use client";

import Link from "next/link";
import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { BoardTable, type Column } from "@/components/BoardTable";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination, useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import {
  EmployeesWithoutEntraDocument,
  ProvisionEntraAccountDocument,
} from "@/generated/graphql";
import {
  ENTRA_PROVISION_STATUS_LABEL,
  ENTRA_PROVISION_STATUS_TONE,
} from "@/features/entra/labels";
import {
  ENTRA_LIST_VARIABLES,
  useEmployeesWithoutEntra,
} from "@/features/entra/useEmployeesWithoutEntra";
import { mapSubmitError } from "@/lib/errors";
import { orDash } from "@/lib/cell";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";

const COLUMNS: Column[] = [
  { key: "name", label: "Nama" },
  { key: "email", label: "Email" },
  { key: "provision", label: "Hasil provisi" },
  { key: "action", label: "Aksi", className: "col-action" },
];

export default function EntraProvisioningPage() {
  const { status, employees, totalCount, error } = useEmployeesWithoutEntra();
  const { pageRows, pagination } = useTablePagination(employees, { totalItems: totalCount });
  const [provisionEntra] = useMutation(ProvisionEntraAccountDocument, {
    refetchQueries: [
      { query: EmployeesWithoutEntraDocument, variables: { ...ENTRA_LIST_VARIABLES } },
    ],
    awaitRefetchQueries: true,
  });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  async function provision(employeeId: string, fullName: string) {
    setBusyId(employeeId);
    setMessage(null);
    try {
      const result = await provisionEntra({ variables: { employeeId } });
      const provisioned = result.data?.provisionEntraAccount.entraProvision;
      if (!provisioned) return;
      if (provisioned.status === "FAILED") {
        setMessage({
          tone: "error",
          text: `Provisi akun ${fullName} gagal: ${provisioned.lastError ?? "kesalahan tidak diketahui"}. Coba lagi nanti.`,
        });
      } else {
        setMessage({
          tone: "ok",
          text: `Provisi akun ${fullName} berhasil (${ENTRA_PROVISION_STATUS_LABEL[provisioned.status].toLowerCase()}).`,
        });
      }
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        "Akun Entra talent ini sudah terdaftar.",
        "Gagal memprovisi akun Entra."
      );
      setMessage({ tone: "error", text: submitError.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Provisi Akun Entra"
        subtitle="Talent yang belum memiliki akun Microsoft Entra — provisioning manual atau ulang setelah gagal (Operation)."
      />

      {message ? (
        <div
          className={`rounded-md border p-4 text-sm ${
            message.tone === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </div>
      ) : null}

      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState message={error ?? "Terjadi kesalahan."} /> : null}

      {status === "ready" && employees?.length === 0 ? (
        <EmptyState message="Semua talent sudah memiliki akun Entra." />
      ) : null}

      {status === "ready" && employees && employees.length > 0 ? (
        <>
          <BoardTable caption="Talent tanpa akun Entra" columns={COLUMNS} footer={<Pagination {...pagination} />}>
            {pageRows.map((employee) => {
              const outcome = employee.entraProvision;
              const failed = outcome?.status === "FAILED";
              return (
                <tr
                  key={employee.id}
                  className="border-b border-board-border transition-colors hover:bg-zinc-50"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={EMPLOYEE_DETAIL(employee.id)}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {employee.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">{orDash(employee.email)}</td>
                  <td className="px-4 py-2.5">
                    {outcome ? (
                      <>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ENTRA_PROVISION_STATUS_TONE[outcome.status]}`}
                        >
                          {ENTRA_PROVISION_STATUS_LABEL[outcome.status]}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {orDash(
                            failed
                              ? outcome.lastError
                              : outcome.upn ?? outcome.action
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-500">Belum dibuat</span>
                    )}
                  </td>
                  <td className="col-action">
                    <RowActionsMenu
                      label={`Aksi ${employee.fullName}`}
                      actions={[
                        {
                          label: busyId === employee.id ? "Memproses…" : failed ? "Coba lagi" : "Provisioning",
                          onSelect: () => void provision(employee.id, employee.fullName),
                          disabled: busyId !== null,
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </BoardTable>
        </>
      ) : null}
    </section>
  );
}
