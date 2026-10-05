"use client";

import * as React from "react";
import { BoardTable } from "@/components/BoardTable";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";

export type MasterDataItem = { id: string; name: string; isActive: boolean };

type MasterDataSectionProps<T extends MasterDataItem> = {
  caption: string;
  emptyMessage: string;
  addLabel: string;
  nameLabel: string;
  items: T[] | undefined;
  status: "loading" | "ready" | "error";
  error: string | null;
  // Optional select on the create/edit form, e.g. Project -> Unit or JobRole -> Chapter.
  select?: { label: string; placeholder: string; options: { id: string; name: string }[] };
  // Current select value of an item (for pre-filling the edit form), e.g. project.unit.id.
  selectIdOf?: (item: T) => string | undefined;

  extraColumn?: { label: string; render: (item: T) => React.ReactNode };
  onCreate: (values: { name: string; selectValue?: string }) => Promise<void>;
  onUpdate: (id: string, values: { name: string; selectValue?: string }) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
};

// Shared Admin edit surface for master-data entities (FR-15, FR-20, FR-24).
// One list + create form + inline edit + activate/deactivate per entity.
// There is deliberately NO delete operation (FR-21): master data is only
// deactivated, and the server rejects deactivation while the row is still
// referenced. Invalid submissions surface the server message (T054).
export function MasterDataSection<T extends MasterDataItem>({
  caption,
  emptyMessage,
  addLabel,
  nameLabel,
  items,
  status,
  error,
  select,
  selectIdOf,
  extraColumn,
  onCreate,
  onUpdate,
  onToggleActive,
}: MasterDataSectionProps<T>) {
  const [creating, setCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [selectValue, setSelectValue] = React.useState("");
  const [nameError, setNameError] = React.useState<string | undefined>();
  const [selectError, setSelectError] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;

  function reset() {
    setCreating(false);
    setEditingId(null);
    setName("");
    setSelectValue("");
    setNameError(undefined);
    setSelectError(undefined);
  }

  function openCreate() {
    setCreating(true);
    setEditingId(null);
    setName("");
    setSelectValue("");
    setNameError(undefined);
    setSelectError(undefined);
  }

  function startEdit(item: T) {
    setEditingId(item.id);
    setCreating(false);
    setName(item.name);
    setSelectValue(selectIdOf?.(item) ?? "");
    setNameError(undefined);
    setSelectError(undefined);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextNameError = name.trim() ? undefined : `${nameLabel} wajib diisi.`;
    const nextSelectError = select && !selectValue ? `${select.label} wajib dipilih.` : undefined;
    setNameError(nextNameError);
    setSelectError(nextSelectError);
    if (nextNameError || nextSelectError) return;

    setBusy(true);
    try {
      if (editingId !== null) {
        await onUpdate(editingId, { name: name.trim(), selectValue });
      } else {
        await onCreate({ name: name.trim(), selectValue });
      }
      reset();
    } finally {
      setBusy(false);
    }
  }

  const editing = creating || editingId !== null;

  return (
    <div className="flex flex-col gap-4">
      {editing ? (
        <form
          onSubmit={handleSubmit}
          className="flex max-w-xl flex-col gap-4 rounded-lg border border-board-border bg-board p-4 shadow-sm"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            {nameLabel}
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Digital Business" />
            {nameError ? <span className="text-xs text-red-600">{nameError}</span> : null}
          </label>
          {select ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
              {select.label}
              <Select value={selectValue} onChange={(e) => setSelectValue(e.target.value)}>
                <option value="">— {select.placeholder} —</option>
                {select.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
              {selectError ? <span className="text-xs text-red-600">{selectError}</span> : null}
            </label>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              Simpan
            </Button>
            <Button type="button" variant="secondary" onClick={reset} disabled={busy}>
              Batal
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <Button type="button" onClick={openCreate}>
            {addLabel}
          </Button>
        </div>
      )}

      {!items || items.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <BoardTable
          caption={caption}
          columns={[
            { key: "name", label: nameLabel },
            ...(extraColumn ? [{ key: extraColumn.label, label: extraColumn.label }] : []),
            { key: "status", label: "Status" },
            { key: "actions", label: "Aksi" },
          ]}
        >
          {items.map((item) => (
            <tr key={item.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
              <td className="px-4 py-2.5 text-zinc-900">{item.name}</td>
              {extraColumn ? <td className="px-4 py-2.5 text-zinc-600">{extraColumn.render(item)}</td> : null}
              <td className="px-4 py-2.5">
                <StatusBadge active={item.isActive} />
              </td>
              <td className="px-4 py-2.5">
                {editingId === item.id ? (
                  <span className="text-xs text-zinc-400">Mengedit…</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={() => startEdit(item)}>
                      Ubah
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void onToggleActive(item.id, !item.isActive)}
                    >
                      {item.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </BoardTable>
      )}
    </div>
  );
}