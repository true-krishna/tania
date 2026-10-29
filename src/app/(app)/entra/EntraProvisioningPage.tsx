"use client";

import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import type { RowAction } from "@/components/RowActionsMenu";
import {
  EmployeesWithoutEntraDocument,
  ProvisionEntraAccountDocument,
  ReprovisionEntraAccountDocument,
  ResendEntraActivationEmailDocument,
  SetEntraAccountEnabledDocument,
} from "@/generated/graphql";
import type { EntraEmployeeSortField, SortDirection } from "@/generated/graphql/types";
import { ENTRA_PROVISION_STATUS_LABEL } from "@/features/entra/labels";
import {
  ENTRA_LIST_VARIABLES,
  useEmployeesWithoutEntra,
} from "@/features/entra/useEmployeesWithoutEntra";
import { mapSubmitError } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { EntraConfirmModals } from "./EntraConfirmModals";
import type { SortState } from "./EntraSortHeader";
import { EntraProvisioningTable } from "./EntraProvisioningTable";
import type { ConfirmAction, EntraListEmployee } from "./types";

type Message = { tone: "ok" | "error"; text: string };

function provisionLabel(busy: boolean, hasOutcome: boolean): string {
  if (busy) return "Memproses…";
  if (hasOutcome) return "Coba lagi";
  return "Provisioning";
}

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
    [search, sortBy, sortDirection],
  );
  const refetch = [{ query: EmployeesWithoutEntraDocument, variables: listVariables }];
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
  const [message, setMessage] = React.useState<Message | null>(null);

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
        "Gagal memprovisi akun Entra.",
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
        "Gagal mengubah status akun Entra.",
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
        "Gagal mengirim ulang email aktivasi.",
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
        "Gagal memprovisi ulang akun Entra.",
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
        label: provisionLabel(busyId === employee.id, outcome !== null),
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
          },
    );
    return actions;
  }

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

      <EntraProvisioningTable
        employees={employees}
        error={error}
        onToggleSort={toggleSort}
        pageRows={pageRows}
        pagination={pagination}
        rowActions={rowActions}
        searching={search.trim().length > 0}
        sort={sort}
        status={status}
      />

      <EntraConfirmModals
        busy={busyId === confirm?.employee.id}
        confirm={confirm}
        onClose={() => setConfirm(null)}
        onConfirmDisable={() => {
          if (confirm?.kind !== "disable") return;
          void setEnabled(confirm.employee.id, confirm.employee.fullName, false);
        }}
        onConfirmReprovision={() => {
          if (confirm?.kind !== "reprovision") return;
          void reprovision(confirm.employee.id, confirm.employee.fullName);
        }}
      />
    </section>
  );
}
