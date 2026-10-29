"use client";

import { IconSearch, IconX } from "@tabler/icons-react";
import * as React from "react";
import { cn } from "@/lib/cn";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { EmployeeOptionList } from "./EmployeeOptionList";
import { SelectedEmployeeChip } from "./SelectedEmployeeChip";
import { useEmployeeLookup } from "./useEmployeeLookup";

type EmployeePickerProps = {
  error?: string | null;
  id?: string;
  label: React.ReactNode;
  onChange: (employeeId: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
};

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;

export function EmployeePicker({
  error,
  id,
  label,
  onChange,
  placeholder = "Cari nama, email, atau kode…",
  required,
  value,
}: EmployeePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const lookupState = useEmployeeLookup(
    { search: debouncedQuery || undefined },
    PAGE_SIZE
  );
  const items = React.useMemo(
    () => lookupState.items ?? [],
    [lookupState.items]
  );
  const boundedActiveIndex =
    items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const selectedEmployee =
    items.find((employee) => employee.id === value) ?? null;

  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const optionElement = listRef.current.querySelector<HTMLLIElement>(
      `[data-option-index="${boundedActiveIndex}"]`
    );
    if (typeof optionElement?.scrollIntoView === "function") {
      optionElement.scrollIntoView({ block: "nearest" });
    }
  }, [boundedActiveIndex, open]);

  React.useEffect(() => {
    function handleDocumentClick(clickEvent: MouseEvent) {
      if (!wrapperRef.current?.contains(clickEvent.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDocumentClick);
    return () =>
      document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  function handleSelect(employeeId: string) {
    onChange(employeeId);
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setActiveIndex(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      if (items.length) {
        setActiveIndex(Math.min(boundedActiveIndex + 1, items.length - 1));
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length) {
        setActiveIndex(Math.max(boundedActiveIndex - 1, 0));
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      const activeEmployee = items[boundedActiveIndex];
      if (open && activeEmployee) {
        handleSelect(activeEmployee.id);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setActiveIndex(0);
    setOpen(true);
  }

  return (
    <div
      className="flex flex-col gap-1 text-sm font-medium text-zinc-700"
      ref={wrapperRef}
    >
      <label className="text-sm font-medium text-zinc-700" htmlFor={inputId}>
        <span>
          {label}
          {required ? <span className="text-tp-ink-peach"> *</span> : null}
        </span>
      </label>

      <div className="relative">
        <div
          className={cn(
            "tp-input relative flex items-center gap-2 px-3!",
            error &&
              "border-tp-ink-peach focus-within:border-tp-ink-peach focus-within:ring-2 focus-within:ring-tp-tint-peach"
          )}
        >
          <IconSearch
            aria-hidden
            className="h-4 w-4 shrink-0 text-tp-muted"
          />
          <input
            aria-activedescendant={
              open && items[boundedActiveIndex]
                ? `${listboxId}-option-${boundedActiveIndex}`
                : undefined
            }
            aria-controls={open ? listboxId : undefined}
            aria-expanded={open}
            aria-haspopup="listbox"
            autoComplete="off"
            className={cn(
              "w-full flex-1 bg-transparent py-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400",
              "focus-visible:outline-none"
            )}
            id={inputId}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            type="text"
            value={selectedEmployee ? "" : query}
          />
          {value ? (
            <button
              aria-label="Bersihkan pilihan karyawan"
              className="shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              onClick={handleClear}
              type="button"
            >
              <IconX aria-hidden className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {selectedEmployee && !query ? (
          <SelectedEmployeeChip employee={selectedEmployee} />
        ) : null}

        {open ? (
          <EmployeeOptionList
            activeIndex={boundedActiveIndex}
            error={lookupState.error}
            items={items}
            listboxId={listboxId}
            listRef={listRef}
            onActiveIndexChange={setActiveIndex}
            onSelect={handleSelect}
            status={lookupState.status}
          />
        ) : null}
      </div>

      {error ? (
        <span className="text-xs font-normal text-tp-ink-peach" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
