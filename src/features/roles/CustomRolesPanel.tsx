"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { Table, type TableColumn } from "@/components/Table";
import { roleLabel } from "@/features/accounts/roles";
import type { AccessRole } from "@/generated/graphql/types";
import type { Role } from "./useRoles";

const TEMPLATES: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];

export interface CustomRolesPanelProps {
  roles: readonly Role[];
  busy: boolean;
  onCreate: (name: string, label: string, templateRole: AccessRole) => Promise<void>;
  onRename: (id: string, label: string) => Promise<void>;
  onSetStatus: (id: string, status: "ACTIVE" | "INACTIVE") => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CustomRolesPanel({
  roles,
  busy,
  onCreate,
  onRename,
  onSetStatus,
  onDelete,
}: CustomRolesPanelProps) {
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [template, setTemplate] = React.useState<AccessRole>("CHAPTER");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editLabel, setEditLabel] = React.useState("");
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await onCreate(name.trim(), label.trim(), template);
      setName("");
      setLabel("");
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat role.");
    }
  }

  const columns: TableColumn<Role>[] = [
    {
      key: "label",
      title: "Role",
      render: (_value, role) =>
        editingId === role.id ? (
          <span className="flex items-center gap-2">
            <Input
              aria-label={`Label role ${role.name}`}
              onChange={(e) => setEditLabel(e.target.value)}
              value={editLabel}
            />
            <Button
              disabled={busy}
              onClick={() => {
                void onRename(role.id, editLabel.trim()).then(
                  () => setEditingId(null),
                  () => undefined,
                );
              }}
              type="button"
            >
              Simpan
            </Button>
            <Button onClick={() => setEditingId(null)} type="button" variant="ghost">
              Batal
            </Button>
          </span>
        ) : (
          <span className="flex flex-col">
            <span className="font-medium">{role.label}</span>
            <span className="text-xs text-tp-muted">{role.name}</span>
          </span>
        ),
    },
    {
      key: "template",
      title: "Template",
      render: (_value, role) => <Chip size="small">{roleLabel[role.templateRole]}</Chip>,
    },
    {
      key: "status",
      title: "Status",
      render: (_value, role) => (
        <Chip size="small" variant={role.status === "ACTIVE" ? "success" : "neutral"}>
          {role.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
        </Chip>
      ),
    },
    {
      key: "actions",
      title: "Aksi",
      className: "col-action",
      render: (_value, role) =>
        role.builtIn ? (
          <span className="text-xs text-tp-muted">Role bawaan — tidak dapat diubah.</span>
        ) : confirmDeleteId === role.id ? (
          <span className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">Hapus role {role.label}?</span>
            <Button
              disabled={busy}
              onClick={() => {
                void onDelete(role.id).then(
                  () => setConfirmDeleteId(null),
                  () => undefined,
                );
              }}
              type="button"
            >
              Ya, hapus
            </Button>
            <Button onClick={() => setConfirmDeleteId(null)} type="button" variant="ghost">
              Batal
            </Button>
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setEditingId(role.id);
                setEditLabel(role.label);
              }}
              type="button"
              variant="ghost"
            >
              Ubah label
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                void onSetStatus(role.id, role.status === "ACTIVE" ? "INACTIVE" : "ACTIVE").catch(
                  () => undefined,
                )
              }
              type="button"
              variant="ghost"
            >
              {role.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
            </Button>
            <Button onClick={() => setConfirmDeleteId(role.id)} type="button" variant="ghost">
              Hapus
            </Button>
          </span>
        ),
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900">Role Kustom</h2>
        {creating ? undefined : (
          <Button onClick={() => setCreating(true)} type="button">
            Tambah Role
          </Button>
        )}
      </div>

      {creating ? (
        <form
          className="flex max-w-2xl flex-col gap-4 rounded-lg border border-board-border bg-board p-4 shadow-sm"
          onSubmit={submit}
        >
          <InputControl label="Nama mesin">
            <Input
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="cth: PM_CHAPTER"
              value={name}
            />
          </InputControl>
          <InputControl label="Label">
            <Input
              onChange={(e) => setLabel(e.target.value)}
              placeholder="cth: PM Chapter"
              value={label}
            />
          </InputControl>
          <InputControl label="Template">
            <Select
              onChange={(e) => setTemplate(e.target.value as AccessRole)}
              options={TEMPLATES.map((value) => ({ value, label: roleLabel[value] }))}
              value={template}
            />
          </InputControl>
          {error ? <span className="text-xs text-red-600">{error}</span> : null}
          <div className="flex gap-2">
            <Button disabled={busy || !name.trim() || !label.trim()} type="submit">
              Simpan
            </Button>
            <Button onClick={() => setCreating(false)} type="button" variant="secondary">
              Batal
            </Button>
          </div>
        </form>
      ) : null}

      <Table
        caption="Daftar role"
        columns={columns}
        dataSource={roles}
        emptyText="Belum ada role."
        rowKey={(role) => role.id}
      />
    </section>
  );
}
