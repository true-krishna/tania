"use client";

import * as React from "react";
import { BoardTable } from "@/components/BoardTable";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Pagination, useTablePagination } from "@/components/Pagination";
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
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Cari Karyawan
            <Input
              type="search"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Cari nama, email, atau kode…"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Karyawan
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">
                {employees.status === "loading" ? "— Memuat karyawan… —" : "— Pilih karyawan —"}
              </option>
              {(employees.employees ?? []).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} ({employee.nomorInduk ?? "—"})
                </option>
              ))}
            </Select>
            {fieldErrors.employeeId ? (
              <span className="text-xs text-red-600">{fieldErrors.employeeId}</span>
            ) : null}
          </label>
          {employees.status === "error" ? (
            <span className="text-xs text-red-600">
              {employees.error ?? "Gagal memuat daftar karyawan."}
            </span>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Email
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cth: nama@telkom.co.id"
            />
            {fieldErrors.email ? (
              <span className="text-xs text-red-600">{fieldErrors.email}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Peran Akses
            <Select
              value={accessRole}
              onChange={(e) => setAccessRole(e.target.value as AccessRole | "")}
            >
              <option value="">— Pilih peran —</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {roleLabel[role]}
                </option>
              ))}
            </Select>
            {fieldErrors.accessRole ? (
              <span className="text-xs text-red-600">{fieldErrors.accessRole}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Kata Sandi Sementara (opsional)
            <Input
              type="password"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
            />
          </label>
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
        <BoardTable
          caption="Daftar akun pengguna"
          columns={[
            { key: "name", label: "Nama" },
            { key: "email", label: "Email" },
            { key: "role", label: "Peran" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Aksi", className: "col-action" },
          ]}
          footer={<Pagination {...pagination} />}
        >
          {pageRows.map((account) => (
            <tr
              key={account.id}
              className="border-b border-board-border transition-colors hover:bg-zinc-50"
            >
              <td className="px-4 py-2.5 font-medium text-zinc-900">{account.fullName}</td>
              <td className="px-4 py-2.5 text-zinc-600">{orDash(account.email)}</td>
              <td className="px-4 py-2.5">
                <RoleBadge role={account.accessRole} />
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge active={account.status === "ACTIVE"} />
              </td>
              <td className="col-action">
                {confirmRevokeId === account.id ? (
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
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel[role]}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </RowActionsMenu>
                )}
            </td>
          </tr>
        ))}
          </BoardTable>
      )}
    </div>
  );
}