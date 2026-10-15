"use client";

import * as React from "react";
import { IconSearch } from "@tabler/icons-react";
import { BoardTable } from "@/components/BoardTable";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Pagination, useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
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
  // Optional "Kode" field for entities whose served contract requires it (Unit.code).
  codeLabel?: string;
  codePlaceholder?: string;
  codeOf?: (item: T) => string | undefined;

  extraColumn?: { label: string; render: (item: T) => React.ReactNode };
  // Opt-in search over the already-served rows (FR-001). Chapter deliberately
  // does not pass this — see spec Out of Scope.
  searchable?: boolean;
  onCreate: (values: { name: string; selectValue?: string; code?: string }) => Promise<void>;
  onUpdate: (id: string, values: { name: string; selectValue?: string; code?: string }) => Promise<void>;
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
  codeLabel,
  codePlaceholder,
  codeOf,
  extraColumn,
  searchable = false,
  onCreate,
  onUpdate,
  onToggleActive,
}: MasterDataSectionProps<T>) {
  const [creating, setCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [selectValue, setSelectValue] = React.useState("");
  const [nameError, setNameError] = React.useState<string | undefined>();
  const [codeError, setCodeError] = React.useState<string | undefined>();
  const [selectError, setSelectError] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);
  // Search keyword lives in local component state — never in the URL (D6).
  const [query, setQuery] = React.useState("");

  const needle = query.trim().toLowerCase();
  // Filter BEFORE pagination so the existing `safePage` clamp covers FR-005
  // (D2): a shrinking result set never strands the Admin on an empty page.
  const visibleItems = React.useMemo(
    () =>
      searchable && needle
        ? (items ?? []).filter((item) => item.name.toLowerCase().includes(needle))
        : items,
    [items, needle, searchable],
  );
  const { pageRows, pagination } = useTablePagination(visibleItems);

  // Search wording derives from the page's own label (D5).
  const searchLabel = `Cari ${nameLabel.toLowerCase()}`;

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;

  function reset() {
    setCreating(false);
    setEditingId(null);
    setName("");
    setCode("");
    setSelectValue("");
    setNameError(undefined);
    setCodeError(undefined);
    setSelectError(undefined);
  }

  function openCreate() {
    setCreating(true);
    setEditingId(null);
    setName("");
    setCode("");
    setSelectValue("");
    setNameError(undefined);
    setCodeError(undefined);
    setSelectError(undefined);
  }

  function startEdit(item: T) {
    setEditingId(item.id);
    setCreating(false);
    setName(item.name);
    setCode(codeOf?.(item) ?? "");
    setSelectValue(selectIdOf?.(item) ?? "");
    setNameError(undefined);
    setCodeError(undefined);
    setSelectError(undefined);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextNameError = name.trim() ? undefined : `${nameLabel} wajib diisi.`;
    const nextCodeError = codeLabel && !code.trim() ? `${codeLabel} wajib diisi.` : undefined;
    const nextSelectError = select && !selectValue ? `${select.label} wajib dipilih.` : undefined;
    setNameError(nextNameError);
    setCodeError(nextCodeError);
    setSelectError(nextSelectError);
    if (nextNameError || nextCodeError || nextSelectError) return;

    setBusy(true);
    try {
      if (editingId !== null) {
        await onUpdate(editingId, { name: name.trim(), selectValue, code: code.trim() });
      } else {
        await onCreate({ name: name.trim(), selectValue, code: code.trim() });
      }
      reset();
    } finally {
      setBusy(false);
    }
  }

  const editing = creating || editingId !== null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Master Data"
        subtitle="Reference data for the talent ecosystem, managed by Admin."
        actions={
          editing ? undefined : (
            <Button type="button" onClick={openCreate}>
              {addLabel}
            </Button>
          )
        }
        search={
          searchable && items && items.length > 0 ? (
            <div className="relative w-full max-w-sm">
              <IconSearch
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-tp-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`${searchLabel}…`}
                aria-label={searchLabel}
                className="h-11 w-full rounded-full border border-tp-line bg-tp-surface pl-11 pr-4 text-sm text-tp-text placeholder:text-tp-muted"
              />
            </div>
          ) : undefined
        }
      />

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
          {codeLabel ? (
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
              {codeLabel}
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={codePlaceholder ?? "cth: DBT"}
              />
              {codeError ? <span className="text-xs text-red-600">{codeError}</span> : null}
            </label>
          ) : null}
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
      ) : null}

      {!items || items.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : visibleItems && visibleItems.length === 0 ? (
        // No match is its own message, distinct from the "no data yet"
        // empty state (FR-006).
        <p className="text-sm text-tp-muted">Tidak ada hasil yang cocok dengan pencarian.</p>
      ) : (
        <BoardTable
          caption={caption}
          columns={[
            { key: "name", label: nameLabel },
            ...(extraColumn ? [{ key: extraColumn.label, label: extraColumn.label }] : []),
            { key: "status", label: "Status" },
            { key: "actions", label: "Aksi", className: "col-action" },
          ]}
          footer={<Pagination {...pagination} />}
        >
          {pageRows.map((item) => (
            <tr key={item.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
              <td className="px-4 py-2.5 text-zinc-900">{item.name}</td>
              {extraColumn ? <td className="px-4 py-2.5 text-zinc-600">{extraColumn.render(item)}</td> : null}
              <td className="px-4 py-2.5">
                <StatusBadge active={item.isActive} />
              </td>
              <td className="col-action">
                {editingId === item.id ? (
                  <span className="text-xs text-zinc-400">Mengedit…</span>
                ) : (
                  <RowActionsMenu
                    label={`Aksi ${item.name}`}
                    actions={[
                      { label: "Ubah", onSelect: () => startEdit(item) },
                      {
                        label: item.isActive ? "Nonaktifkan" : "Aktifkan",
                        onSelect: () => void onToggleActive(item.id, !item.isActive),
                      },
                    ]}
                  />
                )}
              </td>
            </tr>
          ))}
        </BoardTable>
      )}
    </div>
  );
}