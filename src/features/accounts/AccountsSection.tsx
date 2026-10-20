"use client";

import * as React from "react";
import { Table, type TableColumn } from "@/components/Table";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { roleLabelFor, roleOptions, type RoleOption } from "@/features/accounts/roles";
import { useEmployees } from "@/features/employees/useEmployees";
import type { UsersQuery } from "@/generated/graphql";
import type { AccountStatus, Role } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";

type Account = UsersQuery["users"][number];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type CreateValues = {
  employeeId: string;
  email: string;
  /** Machine name of the access role: a built-in name or a custom role's name. */
  roleName: string;
  temporaryPassword?: string;
};

type AccountsSectionProps = {
  accounts: Account[] | undefined;
  /** Access roles from the `roles` query: built-ins and custom ones alike. */
  roles: readonly Role[] | undefined;
  status: "loading" | "ready" | "error";
  error: string | null;
  onCreate: (values: CreateValues) => Promise<void>;
  onChangeRole: (userId: string, roleName: string) => Promise<void>;
  onSetStatus: (userId: string, status: AccountStatus) => Promise<void>;
  onRevokeSessions: (userId: string) => Promise<void>;
};

function RoleBadge({ roleName, options }: { roleName: string; options: readonly RoleOption[] }) {
  return (
    <Chip variant="info" size="small">
      {roleLabelFor(roleName, options)}
    </Chip>
  );
}

// Admin account management surface (FR-15): create an account for an employee,
// change its access role, activate/deactivate it, and revoke its sessions.
// There is deliberately no delete operation — accounts are only deactivated.
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
  const [employeeSearch, setEmployeeSearch] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [roleName, setRoleName] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = React.useState<string | null>(null);

  const employees = useEmployees({ search: employeeSearch || undefined }, 100);
  const { pageRows, pagination } = useTablePagination(accounts);
  // Custom roles come from the API, not from a static list (W3 / TAN-264).
  const options = React.useMemo(() => roleOptions(roles), [roles]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;

  function resetForm() {
    setCreating(false);
    setEmployeeSearch("");
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
      // Server-side validation (e.g. employee already has an account, email in
      // use) is surfaced on the form rather than swallowed.
      setFormError(err instanceof Error ? err.message : "Gagal membuat akun.");
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
      render: (_value, account) => (
        <RoleBadge roleName={account.roleName} options={options} />
      ),
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
              type="button"
              variant="secondary"
              onClick={() => {
                void onRevokeSessions(account.id).finally(() => setConfirmRevokeId(null));
              }}
            >
              Ya, cabut
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmRevokeId(null)}>
              Batal
            </Button>
          </div>
        ) : (
          <RowActionsMenu
            label={`Aksi ${account.fullName}`}
            actions={[
              {
                label: account.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan",
                onSelect: () =>
                  void onSetStatus(
                    account.id,
                    account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  ),
              },
              { label: "Cabut Sesi", onSelect: () => setConfirmRevokeId(account.id) },
            ]}
          >
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <span>Peran</span>
              <Select
                aria-label={`Ubah peran ${account.fullName}`}
                className="w-auto"
                value={account.roleName}
                onChange={(e) => void onChangeRole(account.id, e.target.value)}
                options={options.map((option) => ({ value: option.value, label: option.label }))}
              />
            </label>
          </RowActionsMenu>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Akun Pengguna"
        subtitle="Kelola akun dan peran akses di sistem Tania."
        actions={
          creating ? undefined : (
            <Button type="button" onClick={() => setCreating(true)}>
              Tambah Akun
            </Button>
          )
        }
      />

      {creating ? (
        <form
          onSubmit={handleSubmit}
          className="flex max-w-xl flex-col gap-4 rounded-lg border border-board-border bg-board p-4 shadow-sm"
        >
          <InputControl label="Cari Karyawan">
            <Input
              type="search"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Cari nama, email, atau kode…"
            />
          </InputControl>
          <InputControl label="Karyawan" error={fieldErrors.employeeId}>
            <Select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={[
                {
                  value: "",
                  label:
                    employees.status === "loading"
                      ? "— Memuat karyawan… —"
                      : "— Pilih karyawan —",
                },
                ...(employees.employees ?? []).map((employee) => ({
                  value: employee.id,
                  label: `${employee.fullName} (${employee.nomorInduk ?? "—"})`,
                })),
              ]}
            />
          </InputControl>
          {employees.status === "error" ? (
            <span className="text-xs text-red-600">
              {employees.error ?? "Gagal memuat daftar karyawan."}
            </span>
          ) : null}
          <InputControl label="Email" error={fieldErrors.email}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cth: nama@telkom.co.id"
            />
          </InputControl>
          <InputControl label="Peran Akses" error={fieldErrors.roleName}>
            <Select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              options={[
                { value: "", label: "— Pilih peran —" },
                ...options.map((option) => ({ value: option.value, label: option.label })),
              ]}
            />
          </InputControl>
          <InputControl label="Kata Sandi Sementara (opsional)">
            <Input
              type="password"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
            />
          </InputControl>
          {formError ? <span className="text-xs text-red-600">{formError}</span> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              Simpan
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm} disabled={busy}>
              Batal
            </Button>
          </div>
        </form>
      ) : null}

      {!accounts || accounts.length === 0 ? (
        <EmptyState message="Belum ada akun pengguna." />
      ) : (
        <Table
          caption="Daftar akun pengguna"
          columns={columns}
          dataSource={pageRows}
          rowKey={(account) => account.id}
          pagination={pagination}
        />
      )}
    </div>
  );
}