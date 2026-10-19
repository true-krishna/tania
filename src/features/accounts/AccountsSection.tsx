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
import { roleLabel } from "@/features/accounts/roles";
import { useEmployees } from "@/features/employees/useEmployees";
import type { UsersQuery } from "@/generated/graphql";
import type { AccessRole, AccountStatus } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";

type Account = UsersQuery["users"][number];

const ROLE_OPTIONS = Object.keys(roleLabel) as AccessRole[];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type CreateValues = {
  employeeId: string;
  email: string;
  accessRole: AccessRole;
  temporaryPassword?: string;
};

type AccountsSectionProps = {
  accounts: Account[] | undefined;
  status: "loading" | "ready" | "error";
  error: string | null;
  onCreate: (values: CreateValues) => Promise<void>;
  onChangeRole: (userId: string, accessRole: AccessRole) => Promise<void>;
  onSetStatus: (userId: string, status: AccountStatus) => Promise<void>;
  onRevokeSessions: (userId: string) => Promise<void>;
};

function RoleBadge({ role }: { role: string }) {
  return (
    <Chip variant="info" size="small">
      {roleLabel[role as AccessRole] ?? role}
    </Chip>
  );
}

// Admin account management surface (FR-15): create an account for an employee,
// change its access role, activate/deactivate it, and revoke its sessions.
// There is deliberately no delete operation — accounts are only deactivated.
export function AccountsSection({
  accounts,
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
  const [accessRole, setAccessRole] = React.useState<AccessRole | "">("");
  const [temporaryPassword, setTemporaryPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = React.useState<string | null>(null);

  const employees = useEmployees({ search: employeeSearch || undefined }, 100);
  const { pageRows, pagination } = useTablePagination(accounts);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;

  function resetForm() {
    setCreating(false);
    setEmployeeSearch("");
    setEmployeeId("");
    setEmail("");
    setAccessRole("");
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
    if (!accessRole) nextErrors.accessRole = "Peran akses wajib dipilih.";
    setFieldErrors(nextErrors);
    setFormError(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    setBusy(true);
    try {
      await onCreate({
        employeeId,
        email: email.trim(),
        accessRole: accessRole as AccessRole,
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
      render: (_value, account) => <RoleBadge role={account.accessRole} />,
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
                value={account.accessRole}
                onChange={(e) => void onChangeRole(account.id, e.target.value as AccessRole)}
                options={ROLE_OPTIONS.map((role) => ({ value: role, label: roleLabel[role] }))}
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
          <InputControl label="Peran Akses" error={fieldErrors.accessRole}>
            <Select
              value={accessRole}
              onChange={(e) => setAccessRole(e.target.value as AccessRole | "")}
              options={[
                { value: "", label: "— Pilih peran —" },
                ...ROLE_OPTIONS.map((role) => ({ value: role, label: roleLabel[role] })),
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