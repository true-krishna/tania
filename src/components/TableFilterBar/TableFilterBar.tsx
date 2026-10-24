"use client";

import { IconSearch, IconX } from "@tabler/icons-react";
import * as React from "react";
import { FilterButton } from "@/components/FilterButton";
import { Input } from "@/components/Input";
import { Select, type SelectOption } from "@/components/Select";
import { cn } from "@/lib/cn";

export type TableFilterValues = Record<string, string>;

export interface TableFilterFieldContext {
  value: string;
  onChange: (value: string) => void;
  labelledBy?: string;
}

export type TableFilterField =
  | {
      type: "select";
      key: string;
      label: string;
      options: readonly SelectOption[];
      className?: string;
    }
  | { type: "date"; key: string; label: string; className?: string }
  | {
      type: "custom";
      key: string;
      label: string;
      render: (context: TableFilterFieldContext) => React.ReactNode;
    };

export interface TableFilterSearch {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

interface TableFilterBarProps {
  search?: TableFilterSearch;
  fields?: readonly TableFilterField[];
  values?: TableFilterValues;
  onChange?: (key: string, value: string) => void;
  className?: string;
}

function countActiveFields(
  fields: readonly TableFilterField[],
  values: TableFilterValues,
): number {
  return fields.filter((field) => (values[field.key] ?? "").length > 0).length;
}

function FilterFieldControl({
  field,
  labelId,
  value,
  onChange,
}: {
  field: TableFilterField;
  labelId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "select") {
    return (
      <Select
        aria-labelledby={labelId}
        className={cn("w-48", field.className)}
        onChange={(event) => onChange(event.target.value)}
        options={field.options}
        value={value}
      />
    );
  }
  if (field.type === "date") {
    return (
      <Input
        aria-labelledby={labelId}
        className="w-40"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    );
  }
  return field.render({ labelledBy: labelId, onChange, value });
}

export function TableFilterBar({
  search,
  fields = [],
  values = {},
  onChange,
  className,
}: TableFilterBarProps) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const panelId = React.useId();
  const hasFields = fields.length > 0;
  const activeCount = countActiveFields(fields, values);

  if (!search && !hasFields) return null;

  function change(key: string, value: string) {
    onChange?.(key, value);
  }

  function resetAll() {
    for (const field of fields) {
      if ((values[field.key] ?? "") !== "") change(field.key, "");
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {search ? (
          <div className="relative w-full max-w-sm">
            <IconSearch
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-tp-muted"
            />
            <input
              aria-label={search.label}
              className="tp-input pl-11! pr-10!"
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              type="search"
              value={search.value}
            />
            {search.value ? (
              <button
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-tp-muted transition-colors hover:bg-tp-bg hover:text-tp-text"
                onClick={() => search.onChange("")}
                type="button"
              >
                <IconX aria-hidden size={16} stroke={2} />
              </button>
            ) : null}
          </div>
        ) : null}
        {hasFields ? (
          <div className="ml-auto">
            <FilterButton
              activeCount={activeCount}
              expanded={panelOpen}
              onClick={() => setPanelOpen((open) => !open)}
              panelId={panelId}
            />
          </div>
        ) : null}
      </div>

      {hasFields && panelOpen ? (
        <div className="tp-card flex flex-col gap-4" id={panelId}>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            {fields.map((field) => {
              const labelId = `${panelId}-${field.key}-label`;
              return (
                <div className="flex min-w-0 flex-col gap-1.5" key={field.key}>
                  <span
                    className="text-xs font-semibold text-tp-muted"
                    id={labelId}
                  >
                    {field.label}
                  </span>
                  <FilterFieldControl
                    field={field}
                    labelId={labelId}
                    onChange={(value) => change(field.key, value)}
                    value={values[field.key] ?? ""}
                  />
                </div>
              );
            })}
          </div>
          {activeCount > 0 ? (
            <div className="flex justify-end border-t border-tp-line pt-3">
              <button
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-tp-muted transition-colors hover:bg-tp-bg hover:text-tp-text"
                onClick={resetAll}
                type="button"
              >
                Reset
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
