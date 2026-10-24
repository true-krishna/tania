"use client";

import { IconSearch } from "@tabler/icons-react";
import * as React from "react";
import { FilterButton } from "@/components/FilterButton";
import { Input } from "@/components/Input";
import { Select, type SelectOption } from "@/components/Select";
import { Button } from "@/components/Button";
import { cn } from "@/lib/cn";

export type TableFilterValues = Record<string, string>;

export interface TableFilterFieldContext {
  value: string;
  onChange: (value: string) => void;
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
  value,
  onChange,
}: {
  field: TableFilterField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "select") {
    return (
      <Select
        className={cn("w-auto", field.className)}
        onChange={(event) => onChange(event.target.value)}
        options={field.options}
        value={value}
      />
    );
  }
  if (field.type === "date") {
    return (
      <Input
        className={cn("w-auto", field.className)}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    );
  }
  return field.render({ value, onChange });
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
              className="tp-input pl-11!"
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              type="search"
              value={search.value}
            />
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
        <div className="tp-card flex flex-wrap items-end gap-4" id={panelId}>
          {fields.map((field) => (
            <label className="flex items-center gap-2 text-sm text-zinc-700" key={field.key}>
              <span>{field.label}</span>
              <FilterFieldControl
                field={field}
                onChange={(value) => change(field.key, value)}
                value={values[field.key] ?? ""}
              />
            </label>
          ))}
          {activeCount > 0 ? (
            <Button className="ml-auto" onClick={resetAll} type="button" variant="secondary">
              Reset
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
