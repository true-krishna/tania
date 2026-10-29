"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import { useModuleAccess } from "@/lib/auth/access";
import { MasterDataBulkBar, type MasterDataBulkTarget } from "./MasterDataBulkBar";
import { MasterDataFormModal } from "./MasterDataFormModal";
import { MasterDataTable } from "./MasterDataTable";
import type { MasterDataImportEntity } from "./masterDataImportTemplate";
import { useMasterDataColumns } from "./useMasterDataColumns";

export type MasterDataItem = { id: string; name: string; isActive: boolean };

type MasterDataSectionProps<T extends MasterDataItem> = {
  caption: string;
  emptyMessage: string;
  addLabel: string;
  nameLabel: string;
  items: T[] | undefined;
  status: "loading" | "ready" | "error";
  error: string | null;
  select?: { label: string; placeholder: string; options: { id: string; name: string }[] };
  selectRequired?: boolean;
  selectIdOf?: (item: T) => string | undefined;
  codeLabel?: string;
  codePlaceholder?: string;
  codeOf?: (item: T) => string | undefined;

  extraColumn?: { label: string; render: (item: T) => React.ReactNode };
  searchable?: boolean;
  bulkEntity?: MasterDataImportEntity;
  onCreate: (values: { name: string; selectValue?: string; code?: string }) => Promise<void>;
  onUpdate: (
    id: string,
    values: { name: string; selectValue?: string; code?: string },
  ) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  importSlot?: (controls: {
    close: () => void;
    onImported: () => void;
    open: boolean;
  }) => React.ReactNode;
};

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
  bulkEntity,
  onCreate,
  onUpdate,
  onToggleActive,
  importSlot,
}: MasterDataSectionProps<T>) {
  const manage = useModuleAccess("masterData").canManage;
  const [creating, setCreating] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [selectValue, setSelectValue] = React.useState("");
  const [nameError, setNameError] = React.useState<string | undefined>();
  const [codeError, setCodeError] = React.useState<string | undefined>();
  const [selectError, setSelectError] = React.useState<string | undefined>();
  const [busy, setBusy] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const formId = React.useId();

  const bulkTarget: MasterDataBulkTarget | undefined = select
    ? { label: select.label, options: select.options, required: selectRequired }
    : undefined;
  const selectionEnabled = manage && bulkEntity !== undefined;
  const selectedIdSet = new Set(selectedIds);
  const selectedRows = React.useMemo(
    () => (items ?? []).filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked && !prev.includes(id) ? [...prev, id] : prev.filter((value) => value !== id),
    );
  }

  function toggleAllRows(checked: boolean) {
    const pageIds = pageRows.map((item) => item.id);
    setSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...pageIds]))
        : prev.filter((id) => !pageIds.includes(id)),
    );
  }

  const needle = query.trim().toLowerCase();
  const visibleItems = React.useMemo(
    () =>
      searchable && needle
        ? (items ?? []).filter((item) => item.name.toLowerCase().includes(needle))
        : items,
    [items, needle, searchable],
  );
  const { pageRows, pagination, resetPage } = useTablePagination(visibleItems);

  const searchLabel = `Cari ${nameLabel.toLowerCase()}`;
  const columns = useMasterDataColumns<T>({
    nameLabel,
    extraColumn,
    manage,
    selectionEnabled,
    selectedIdSet,
    pageRows,
    toggleAllRows,
    toggleRow,
    editingId,
    onEdit: startEdit,
    onToggleActive: (id, isActive) => void onToggleActive(id, isActive),
  });

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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        actions={
          !manage ? undefined : (
            <>
              {importSlot ? (
                <Button onClick={() => setImporting(true)} type="button" variant="secondary">
                  + Unggah Massal
                </Button>
              ) : null}
              <Button onClick={openCreate} type="button">
                {addLabel}
              </Button>
            </>
          )
        }
        subtitle={
          manage
            ? "Reference data for the talent ecosystem, managed by Admin."
            : "Reference data for the talent ecosystem (hanya baca)."
        }
        title="Master Data"
      />

      {searchable && items && items.length > 0 ? (
        <TableFilterBar
          search={{
            label: searchLabel,
            onChange: setQuery,
            placeholder: `${searchLabel}…`,
            value: query,
          }}
        />
      ) : null}

      <MasterDataFormModal
        addLabel={addLabel}
        busy={busy}
        code={code}
        codeError={codeError}
        codeLabel={codeLabel}
        codePlaceholder={codePlaceholder}
        editingId={editingId}
        formId={formId}
        name={name}
        nameError={nameError}
        nameLabel={nameLabel}
        onClose={reset}
        onCodeChange={setCode}
        onNameChange={setName}
        onSelectChange={setSelectValue}
        onSubmit={handleSubmit}
        open={editing}
        select={select}
        selectError={selectError}
        selectValue={selectValue}
      />

      {importSlot
        ? importSlot({
            close: () => setImporting(false),
            onImported: resetPage,
            open: importing,
          })
        : null}

      {manage && bulkEntity && selectedRows.length > 0 ? (
        <MasterDataBulkBar
          entity={bulkEntity}
          onClear={() => setSelectedIds([])}
          rows={selectedRows.map((item) => ({ id: item.id, label: item.name }))}
          target={bulkTarget}
        />
      ) : null}

      <MasterDataTable
        caption={caption}
        columns={columns}
        emptyMessage={emptyMessage}
        items={items}
        pageRows={pageRows}
        pagination={pagination}
        visibleItems={visibleItems}
      />
    </div>
  );
}
