"use client";

import Link from "next/link";
import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Table } from "@/components/Table";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { TableFilterBar } from "@/components/TableFilterBar";
import {
  EmployeesWithoutEntraDocument,
  type EmployeesWithoutEntraQuery,
  ProvisionEntraAccountDocument,
  ReprovisionEntraAccountDocument,
  ResendEntraActivationEmailDocument,
  SetEntraAccountEnabledDocument,
} from "@/generated/graphql";
import type { EntraEmployeeSortField, SortDirection } from "@/generated/graphql/types";
import type { RowAction } from "@/components/RowActionsMenu";
import {
  ENTRA_NOTIFY_STATUS_LABEL,
  ENTRA_NOTIFY_STATUS_TONE,
  ENTRA_PROVISION_STATUS_LABEL,
  ENTRA_PROVISION_STATUS_TONE,
} from "@/features/entra/labels";
import { EntraAccountActionModal } from "@/features/entra/EntraAccountActionModal";
import {
  ENTRA_LIST_VARIABLES,
  useEmployeesWithoutEntra,
} from "@/features/entra/useEmployeesWithoutEntra";
import { mapSubmitError } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { orDash } from "@/lib/cell";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";

type SortState = { key: EntraEmployeeSortField; dir: SortDirection } | null;

function sortAria(
  sort: SortState,
  key: EntraEmployeeSortField
): "ascending" | "descending" | undefined {
  if (!sort || sort.key !== key) return undefined;
  return sort.dir === "ASC" ? "ascending" : "descending";
}

function SortHeader({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: EntraEmployeeSortField;
  sort: SortState;
  onToggle: (key: EntraEmployeeSortField) => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 hover:text-tp-text"
      onClick={() => onToggle(sortKey)}
      type="button"
    >
      {label}
      {sort?.key === sortKey ? (
        sort.dir === "ASC" ? (
          <IconChevronUp aria-hidden size={14} stroke={2} />
        ) : (
          <IconChevronDown aria-hidden size={14} stroke={2} />
        )
      ) : null}
    </button>
  );
}

type EntraListEmployee =
  EmployeesWithoutEntraQuery["employeesWithoutEntra"]["edges"][number]["node"];

type ConfirmAction =
  | { kind: "disable"; employee: EntraListEmployee }
  | { kind: "reprovision"; employee: EntraListEmployee };

export default function EntraProvisioningPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebouncedValue(searchInput);
  const [sort, setSort] = React.useState<SortState>(null);
  const sortBy: EntraEmployeeSortField = sort?.key ?? "FULL_NAME";
  const sortDirection: SortDirection = sort?.dir ?? "ASC";
  const { status, employees, totalCount, hasNextPage, loadingMore, loadMore, error } =
    useEmployeesWithoutEntra({ search, sortBy, sortDirection });
  const { pageRows, pagination, resetPage } = useTablePagination(employees, {
    totalItems: totalCount,
    hasMore: hasNextPage,
    loadingMore,
    loadMore,
  });
  const listVariables = React.useMemo(
    () => ({
      ...ENTRA_LIST_VARIABLES,
      search: search.trim() || null,
      sortBy,
      sortDirection,
    }),
    [search, sortBy, sortDirection]
  );
  const refetch = [
    { query: EmployeesWithoutEntraDocument, variables: listVariables },
  ];
  const [provisionEntra] = useMutation(ProvisionEntraAccountDocument, {
    refetchQueries: refetch,
    awaitRefetchQueries: true,
  });
  const [setEntraAccountEnabled] = useMutation(SetEntraAccountEnabledDocument, {
    refetchQueries: refetch,
    awaitRefetchQueries: true,
  });
  const [resendEntraActivationEmail] = useMutation(ResendEntraActivationEmailDocument, {
    refetchQueries: refetch,
    awaitRefetchQueries: true,
  });
  const [reprovisionEntraAccount] = useMutation(ReprovisionEntraAccountDocument, {
    refetchQueries: refetch,
    awaitRefetchQueries: true,
  });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<ConfirmAction | null>(null);
  const [message, setMessage] = React.useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  function toggleSort(key: EntraEmployeeSortField) {
    resetPage();
    setSort((current) => {
      if (!current || current.key !== key) return { key, dir: "ASC" };
      if (current.dir === "ASC") return { key, dir: "DESC" };
      return null;
    });
  }

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

  async function setEnabled(employeeId: string, fullName: string, enabled: boolean) {
    setBusyId(employeeId);
    setMessage(null);
    try {
      const result = await setEntraAccountEnabled({ variables: { employeeId, enabled } });
      const outcome = result.data?.setEntraAccountEnabled.entraProvision;
      if (!outcome) return;
      if (outcome.status === (enabled ? "CREATED" : "DISABLED") || outcome.status === "INVITED") {
        setMessage({
          tone: "ok",
          text: `Akun Entra ${fullName} berhasil ${enabled ? "diaktifkan" : "dinonaktifkan"}.`,
        });
      } else {
        setMessage({
          tone: "error",
          text: `Perubahan status akun ${fullName} gagal: ${outcome.lastError ?? "kesalahan tidak diketahui"}.`,
        });
      }
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        "Perubahan status akun Entra tidak dapat dilakukan.",
        "Gagal mengubah status akun Entra."
      );
      setMessage({ tone: "error", text: submitError.message });
    } finally {
      setBusyId(null);
    }
  }

  async function resendActivation(employeeId: string, fullName: string) {
    setBusyId(employeeId);
    setMessage(null);
    try {
      const result = await resendEntraActivationEmail({ variables: { employeeId } });
      const outcome = result.data?.resendEntraActivationEmail.entraProvision;
      if (outcome?.notifyStatus === "SENT") {
        setMessage({
          tone: "ok",
          text: `Email aktivasi ${fullName} berhasil dikirim ulang ke email pribadinya.`,
        });
      } else {
        setMessage({
          tone: "error",
          text: `Kirim ulang email aktivasi ${fullName} gagal: ${outcome?.notifyError ?? "kesalahan tidak diketahui"}.`,
        });
      }
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        "Kirim ulang email aktivasi hanya untuk akun hasil create.",
        "Gagal mengirim ulang email aktivasi."
      );
      setMessage({ tone: "error", text: submitError.message });
    } finally {
      setBusyId(null);
    }
  }

  async function reprovision(employeeId: string, fullName: string) {
    setBusyId(employeeId);
    setMessage(null);
    try {
      const result = await reprovisionEntraAccount({ variables: { employeeId } });
      const outcome = result.data?.reprovisionEntraAccount.entraProvision;
      if (!outcome) return;
      if (outcome.status === "FAILED") {
        setMessage({
          tone: "error",
          text: `Provisi ulang ${fullName} gagal: ${outcome.lastError ?? "kesalahan tidak diketahui"}. Coba lagi nanti.`,
        });
      } else {
        setMessage({
          tone: "ok",
          text: `Provisi ulang ${fullName} berhasil (${ENTRA_PROVISION_STATUS_LABEL[outcome.status].toLowerCase()}).`,
        });
      }
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        "Provisi ulang hanya untuk akun yang jenisnya tidak cocok dengan kontrak aktif.",
        "Gagal memprovisi ulang akun Entra."
      );
      setMessage({ tone: "error", text: submitError.message });
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  }

  function rowActions(employee: EntraListEmployee): RowAction[] {
    const outcome = employee.entraProvision;
    const linked = outcome !== null && outcome.status !== "FAILED";
    const actions: RowAction[] = [];
    if (!linked) {
      actions.push({
        label: busyId === employee.id ? "Memproses…" : outcome ? "Coba lagi" : "Provisioning",
        onSelect: () => void provision(employee.id, employee.fullName),
        disabled: busyId !== null,
      });
      return actions;
    }
    if (outcome.needsReprovision) {
      actions.push({
        label: "Provisi ulang",
        onSelect: () => setConfirm({ kind: "reprovision", employee }),
        disabled: busyId !== null,
      });
    }
    if (outcome.status === "CREATED" && outcome.notifyStatus === "FAILED") {
      actions.push({
        label: "Kirim ulang email aktivasi",
        onSelect: () => void resendActivation(employee.id, employee.fullName),
        disabled: busyId !== null,
      });
    }
    actions.push(
      outcome.status === "DISABLED"
        ? {
            label: "Aktifkan",
            onSelect: () => void setEnabled(employee.id, employee.fullName, true),
            disabled: busyId !== null,
          }
        : {
            label: "Nonaktifkan",
            danger: true,
            onSelect: () => setConfirm({ kind: "disable", employee }),
            disabled: busyId !== null,
          }
    );
    return actions;
  }

  const searching = search.trim().length > 0;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle="Talent yang belum memiliki akun Microsoft Entra, dan akun yang perlu diaktifkan kembali, dikirim ulang emailnya, atau diprovisi ulang (Operation)."
        title="Provisi Akun Entra"
      />

      <TableFilterBar
        search={{
          label: "Cari nama karyawan",
          onChange: (value) => {
            setSearchInput(value);
            resetPage();
          },
          placeholder: "Cari nama karyawan…",
          value: searchInput,
        }}
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
        <EmptyState
          message={
            searching
              ? "Tidak ada talent yang cocok dengan pencarian."
              : "Semua talent sudah memiliki akun Entra."
          }
        />
      ) : null}

      {status === "ready" && employees && employees.length > 0 ? (
        <Table
          caption="Talent untuk provisi akun Entra"
          columns={[
            {
              key: "name",
              title: (
                <SortHeader
                  label="Nama"
                  onToggle={toggleSort}
                  sort={sort}
                  sortKey="FULL_NAME"
                />
              ),
              headerProps: { "aria-sort": sortAria(sort, "FULL_NAME") },
              render: (_value, employee) => (
                <Link
                  className="font-medium text-zinc-900 hover:underline"
                  href={EMPLOYEE_DETAIL(employee.id)}
                >
                  {employee.fullName}
                </Link>
              ),
            },
            {
              key: "email",
              title: (
                <SortHeader
                  label="Email"
                  onToggle={toggleSort}
                  sort={sort}
                  sortKey="EMAIL"
                />
              ),
              headerProps: { "aria-sort": sortAria(sort, "EMAIL") },
              className: "text-zinc-600",
              render: (_value, employee) => orDash(employee.email),
            },
            {
              key: "provision",
              title: (
                <SortHeader
                  label="Hasil provisi"
                  onToggle={toggleSort}
                  sort={sort}
                  sortKey="PROVISION_STATUS"
                />
              ),
              headerProps: { "aria-sort": sortAria(sort, "PROVISION_STATUS") },
              render: (_value, employee) => {
                const outcome = employee.entraProvision;
                if (!outcome) return <span className="text-xs text-zinc-500">Belum dibuat</span>;
                const failed = outcome.status === "FAILED";
                return (
                  <>
                    {outcome.needsReprovision ? (
                      <span className="mb-1 inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Perlu provisi ulang
                      </span>
                    ) : null}
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ENTRA_PROVISION_STATUS_TONE[outcome.status]}`}
                    >
                      {ENTRA_PROVISION_STATUS_LABEL[outcome.status]}
                    </span>
                    {outcome.notifyStatus ? (
                      <span
                        className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ENTRA_NOTIFY_STATUS_TONE[outcome.notifyStatus]}`}
                      >
                        {ENTRA_NOTIFY_STATUS_LABEL[outcome.notifyStatus]}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-xs text-zinc-500">
                      {orDash(
                        failed
                          ? outcome.lastError
                          : outcome.notifyStatus === "FAILED" && outcome.notifyError
                            ? outcome.notifyError
                            : outcome.upn ?? outcome.action
                      )}
                    </span>
                  </>
                );
              },
            },
            {
              key: "action",
              title: "Aksi",
              className: "col-action",
              render: (_value, employee) => (
                <RowActionsMenu
                  actions={rowActions(employee)}
                  label={`Aksi ${employee.fullName}`}
                />
              ),
            },
          ]}
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(employee) => employee.id}
        />
      ) : null}

      {confirm?.kind === "disable" ? (
        <EntraAccountActionModal
          busy={busyId === confirm.employee.id}
          confirmLabel="Nonaktifkan"
          description={`Akun Entra ${confirm.employee.fullName} tidak akan dapat dipakai login sampai diaktifkan kembali. Nonaktifkan sekarang?`}
          onClose={() => setConfirm(null)}
          onConfirm={() => void setEnabled(confirm.employee.id, confirm.employee.fullName, false)}
          open
          title="Nonaktifkan akun Entra"
        />
      ) : null}
      {confirm?.kind === "reprovision" ? (
        <EntraAccountActionModal
          busy={busyId === confirm.employee.id}
          confirmLabel="Provisi ulang"
          description={`Akun Entra lama ${confirm.employee.fullName} akan dinonaktifkan, lalu dibuat atau diundang ulang mengikuti contract_type kontrak aktifnya. Lanjutkan?`}
          onClose={() => setConfirm(null)}
          onConfirm={() => void reprovision(confirm.employee.id, confirm.employee.fullName)}
          open
          title="Provisi ulang akun Entra"
        />
      ) : null}
    </section>
  );
}
