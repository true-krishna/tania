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

function RoleBadge({ roleName, options }: { roleName: string; options: readonly RoleOption[] }) {
  return (
    <Chip size="small" variant="info">
      {roleLabelFor(roleName, options)}
    </Chip>
  );
}

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
        <RoleBadge options={options} roleName={account.roleName} />
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
                  void onSetStatus(
                    account.id,
                    account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  ),
              },
              { label: "Cabut Sesi", onSelect: () => setConfirmRevokeId(account.id) },
            ]}
            label={`Aksi ${account.fullName}`}
          >
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <span>Peran</span>
              <Select
                aria-label={`Ubah peran ${account.fullName}`}
                className="w-auto"
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
          creating ? undefined : (
            <Button onClick={() => setCreating(true)} type="button">
              Tambah Akun
            </Button>
          )
        }
        subtitle="Kelola akun dan peran akses di sistem Tania."
        title="Akun Pengguna"
      />

      {creating ? (
        <form
          className="flex max-w-xl flex-col gap-4 rounded-lg border border-board-border bg-board p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <InputControl label="Cari Karyawan">
            <Input
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Cari nama, email, atau kode…"
              type="search"
              value={employeeSearch}
            />
          </InputControl>
          <InputControl error={fieldErrors.employeeId} label="Karyawan">
            <Select
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
              value={employeeId}
            />
          </InputControl>
          {employees.status === "error" ? (
            <span className="text-xs text-red-600">
              {employees.error ?? "Gagal memuat daftar karyawan."}
            </span>
          ) : null}
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
          <div className="flex gap-2">
            <Button disabled={busy} type="submit">
              Simpan
            </Button>
            <Button disabled={busy} onClick={resetForm} type="button" variant="secondary">
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
          pagination={pagination}
          rowKey={(account) => account.id}
        />
      )}
    </div>
  );
}