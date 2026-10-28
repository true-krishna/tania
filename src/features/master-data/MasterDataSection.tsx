"use client";

import * as React from "react";
import { Table, type TableColumn } from "@/components/Table";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { TableFilterBar } from "@/components/TableFilterBar";
import { useModuleAccess } from "@/lib/auth/access";

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
  onCreate: (values: { name: string; selectValue?: string; code?: string }) => Promise<void>;
  onUpdate: (id: string, values: { name: string; selectValue?: string; code?: string }) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  importSlot?: (controls: { close: () => void; onImported: () => void; open: boolean }) => React.ReactNode;
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
  const formId = React.useId();

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
                  actions={[
                    { label: "Ubah", onSelect: () => startEdit(item) },
                    {
                      label: item.isActive ? "Nonaktifkan" : "Aktifkan",
                      onSelect: () => void onToggleActive(item.id, !item.isActive),
                    },
                  ]}
                  label={`Aksi ${item.name}`}
                />
              ),
          } satisfies TableColumn<T>,
        ]
      : []),
  ];

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

      <Modal onClose={reset} open={editing} size="md">
        <ModalTitle>{editingId !== null ? `Ubah ${nameLabel}` : addLabel}</ModalTitle>
        <ModalContent>
          <form className="flex flex-col gap-4" id={formId} onSubmit={handleSubmit}>
            <InputControl error={nameError} label={nameLabel}>
              <Input onChange={(e) => setName(e.target.value)} placeholder="cth: Digital Business" value={name} />
            </InputControl>
            {codeLabel ? (
              <InputControl error={codeError} label={codeLabel}>
                <Input
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={codePlaceholder ?? "cth: DBT"}
                  value={code}
                />
              </InputControl>
            ) : null}
            {select ? (
              <InputControl error={selectError} label={select.label}>
                <Select
                  onChange={(e) => setSelectValue(e.target.value)}
                  options={[
                    { value: "", label: `— ${select.placeholder} —` },
                    ...select.options.map((o) => ({ value: o.id, label: o.name })),
                  ]}
                  value={selectValue}
                />
              </InputControl>
            ) : null}
          </form>
        </ModalContent>
        <ModalActions>
          <Button disabled={busy} form={formId} type="submit">
            Simpan
          </Button>
          <Button disabled={busy} onClick={reset} type="button" variant="secondary">
            Batal
          </Button>
        </ModalActions>
      </Modal>

      {importSlot
        ? importSlot({
            close: () => setImporting(false),
            onImported: resetPage,
            open: importing,
          })
        : null}

      {!items || items.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : visibleItems && visibleItems.length === 0 ? (
        <p className="text-sm text-tp-muted">Tidak ada hasil yang cocok dengan pencarian.</p>
      ) : (
        <Table
          caption={caption}
          columns={columns}
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(item) => item.id}
        />
      )}
    </div>
  );
}