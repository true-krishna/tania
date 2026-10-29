"use client";

import * as React from "react";
import type { TableColumn } from "@/components/Table";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { TableFilterBar } from "@/components/TableFilterBar";
import { EmployeePicker } from "@/features/accounts/EmployeePicker";
import { roleOptions } from "@/features/accounts/roles";
import { AccountsTable } from "./AccountsTable";
import { RoleBadge } from "./RoleBadge";
import type { UsersQuery } from "@/generated/graphql";
import type { AccountStatus, Role } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";
import { errorText } from "@/lib/errors";

type Account = UsersQuery["users"][number];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type CreateValues = {
  employeeId: string;
  email: string;
  roleName: string;
  temporaryPassword?: string;
};

type AccountsSectionProps = {
  accounts: Account[] | undefined;
  roles: readonly Role[] | undefined;
  status: "loading" | "ready" | "error";
  error: string | null;
  onCreate: (values: CreateValues) => Promise<void>;
  onChangeRole: (userId: string, roleName: string) => Promise<void>;
  onSetStatus: (userId: string, status: AccountStatus) => Promise<void>;
  onRevokeSessions: (userId: string) => Promise<void>;
};

export function AccountsSection({
  accounts,
  roles,
  status,
  error,
  onCreate,
  onChangeRole,
  onSetStatus,
  onRevokeSessions,
}: AccountsSectionProps) {
  const [creating, setCreating] = React.useState(false);
  const [employeeId, setEmployeeId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [roleName, setRoleName] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = React.useState<string | null>(null);
  const formId = React.useId();

  const [search, setSearch] = React.useState("");
  const filteredAccounts = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return accounts ?? [];
    return (accounts ?? []).filter(
      (account) =>
        account.fullName.toLowerCase().includes(needle) ||
        account.email.toLowerCase().includes(needle),
    );
  }, [accounts, search]);

  const { pageRows, pagination } = useTablePagination(filteredAccounts);
  const options = React.useMemo(() => roleOptions(roles), [roles]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;

  function resetForm() {
    setCreating(false);
    setEmployeeId("");
    setEmail("");
    setRoleName("");
    setTemporaryPassword("");
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string | undefined> = {};
    if (!employeeId) nextErrors.employeeId = "Karyawan wajib dipilih.";
    if (!email.trim()) nextErrors.email = "Email wajib diisi.";
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = "Format email tidak valid.";
    if (!roleName) nextErrors.roleName = "Peran akses wajib dipilih.";
    setFieldErrors(nextErrors);
    setFormError(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    setBusy(true);
    try {
      await onCreate({
        employeeId,
        email: email.trim(),
        roleName,
        temporaryPassword: temporaryPassword.trim() || undefined,
      });
      resetForm();
    } catch (err) {
      setFormError(errorText(err, "Gagal membuat akun."));
    } finally {
      setBusy(false);
    }
  }

  const columns: TableColumn<Account>[] = [
    {
      key: "name",
      title: "Nama",
      className: "font-medium text-zinc-900",
      render: (_value, account) => account.fullName,
    },
    {
      key: "email",
      title: "Email",
      className: "text-zinc-600",
      render: (_value, account) => orDash(account.email),
    },
    {
      key: "role",
      title: "Peran",
      render: (_value, account) => <RoleBadge options={options} roleName={account.roleName} />,
    },
    {
      key: "chapter",
      title: "Chapter",
      render: (_value, account) =>
        account.accessRole !== "CHAPTER" ? "—" : orDash(account.employee?.chapter?.name),
    },
    {
      key: "status",
      title: "Status",
      render: (_value, account) => <StatusBadge active={account.status === "ACTIVE"} />,
    },
    {
      key: "actions",
      title: "Aksi",
      className: "col-action",
      render: (_value, account) =>
        confirmRevokeId === account.id ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">Cabut semua sesi akun ini?</span>
            <Button
              onClick={() => {
                void onRevokeSessions(account.id).finally(() => setConfirmRevokeId(null));
              }}
              type="button"
              variant="secondary"
            >
              Ya, cabut
            </Button>
            <Button onClick={() => setConfirmRevokeId(null)} type="button" variant="ghost">
              Batal
            </Button>
          </div>
        ) : (
          <RowActionsMenu
            actions={[
              {
                label: account.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan",
                onSelect: () =>
                  void onSetStatus(account.id, account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"),
              },
              { label: "Cabut Sesi", onSelect: () => setConfirmRevokeId(account.id) },
            ]}
            label={`Aksi ${account.fullName}`}
          >
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <span>Peran</span>
              <Select
                aria-label={`Ubah peran ${account.fullName}`}
                className="w-fit"
                onChange={(e) => void onChangeRole(account.id, e.target.value)}
                options={options.map((option) => ({ value: option.value, label: option.label }))}
                value={account.roleName}
              />
            </label>
          </RowActionsMenu>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        actions={
          <Button onClick={() => setCreating(true)} type="button">
            Tambah Akun
          </Button>
        }
        subtitle="Kelola akun dan peran akses di sistem Tania."
        title="Akun Pengguna"
      />

      {accounts && accounts.length > 0 ? (
        <TableFilterBar
          search={{
            label: "Cari akun",
            onChange: setSearch,
            placeholder: "Cari nama atau email…",
            value: search,
          }}
        />
      ) : null}

      <Modal onClose={resetForm} open={creating} size="md">
        <ModalTitle>Tambah Akun</ModalTitle>
        <ModalContent>
          <form className="flex flex-col gap-4" id={formId} onSubmit={handleSubmit}>
            <EmployeePicker
              error={fieldErrors.employeeId}
              label="Karyawan"
              onChange={setEmployeeId}
              required
              value={employeeId}
            />
            <InputControl error={fieldErrors.email} label="Email">
              <Input
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cth: nama@telkom.co.id"
                type="email"
                value={email}
              />
            </InputControl>
            <InputControl error={fieldErrors.roleName} label="Peran Akses">
              <Select
                onChange={(e) => setRoleName(e.target.value)}
                options={[
                  { value: "", label: "— Pilih peran —" },
                  ...options.map((option) => ({ value: option.value, label: option.label })),
                ]}
                value={roleName}
              />
            </InputControl>
            <InputControl label="Kata Sandi Sementara (opsional)">
              <Input
                onChange={(e) => setTemporaryPassword(e.target.value)}
                type="password"
                value={temporaryPassword}
              />
            </InputControl>
            {formError ? <span className="text-xs text-red-600">{formError}</span> : null}
          </form>
        </ModalContent>
        <ModalActions>
          <Button disabled={busy} form={formId} type="submit">
            Simpan
          </Button>
          <Button disabled={busy} onClick={resetForm} type="button" variant="secondary">
            Batal
          </Button>
        </ModalActions>
      </Modal>

      <AccountsTable
        accounts={accounts}
        columns={columns}
        filteredAccounts={filteredAccounts}
        pageRows={pageRows}
        pagination={pagination}
      />
    </div>
  );
}
