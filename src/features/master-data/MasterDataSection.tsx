"use client";

import * as React from "react";
import { IconSearch } from "@tabler/icons-react";
import { Table, type TableColumn } from "@/components/Table";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";

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
  // Whether that select must be chosen before submit (FR-006 for Project -> Unit).
  // Defaults to false so an optional reference (JobRole -> Chapter, FR-022) stays optional.
  selectRequired?: boolean;
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

// Shared master-data surface. Chapter and Operation read the reference data
// (Talent has no access, 2026-10-16 clarify 6) and Admin manages it (FR-15,
// FR-20, FR-24) — so the edit surface only
// renders for the manage roles and the rest get the same list read-only.
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
  selectRequired = false,
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
  const role = useSessionRole();
  const manage = canManage(role, "masterData");
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
    const nextSelectError =
      select && selectRequired && !selectValue ? `${select.label} wajib dipilih.` : undefined;
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

  const columns: TableColumn<T>[] = [
    {
      key: "name",
      title: nameLabel,
      className: "text-zinc-900",
      render: (_value, item) => item.name,
    },
    ...(extraColumn
      ? [
          {
            key: "extra",
            title: extraColumn.label,
            className: "text-zinc-600",
            render: (_value: unknown, item: T) => extraColumn.render(item),
          } satisfies TableColumn<T>,
        ]
      : []),
    {
      key: "status",
      title: "Status",
      render: (_value, item) => <StatusBadge active={item.isActive} />,
    },
    ...(manage
      ? [
          {
            key: "actions",
            title: "Aksi",
            className: "col-action",
            render: (_value: unknown, item: T) =>
              editingId === item.id ? (
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
              ),
          } satisfies TableColumn<T>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Master Data"
        subtitle={
          manage
            ? "Reference data for the talent ecosystem, managed by Admin."
            : "Reference data for the talent ecosystem (hanya baca)."
        }
        actions={
          !manage || editing ? undefined : (
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

      {manage && editing ? (
        <form
          onSubmit={handleSubmit}
          className="flex max-w-xl flex-col gap-4 rounded-lg border border-board-border bg-board p-4 shadow-sm"
        >
          <InputControl label={nameLabel} error={nameError}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Digital Business" />
          </InputControl>
          {codeLabel ? (
            <InputControl label={codeLabel} error={codeError}>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={codePlaceholder ?? "cth: DBT"}
              />
            </InputControl>
          ) : null}
          {select ? (
            <InputControl label={select.label} error={selectError}>
              <Select
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                options={[
                  { value: "", label: `— ${select.placeholder} —` },
                  ...select.options.map((o) => ({ value: o.id, label: o.name })),
                ]}
              />
            </InputControl>
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
        <Table
          caption={caption}
          columns={columns}
          dataSource={pageRows}
          rowKey={(item) => item.id}
          pagination={pagination}
        />
      )}
    </div>
  );
}