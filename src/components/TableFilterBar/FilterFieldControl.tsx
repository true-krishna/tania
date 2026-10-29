"use client";

import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { cn } from "@/lib/cn";
import type { TableFilterField } from "./TableFilterBar";

export function FilterFieldControl({
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
