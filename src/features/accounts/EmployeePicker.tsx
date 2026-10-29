"use client";

import { IconX, IconSearch } from "@tabler/icons-react";
import * as React from "react";
import { useEmployees } from "@/features/employees/useEmployees";
import { cn } from "@/lib/cn";
import { orDash } from "@/lib/cell";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type EmployeePickerProps = {
  value: string;
  onChange: (employeeId: string) => void;
  label: React.ReactNode;
  error?: string | null;
  placeholder?: string;
  required?: boolean;
  id?: string;
};

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;

export function EmployeePicker({
  value,
  onChange,
  label,
  error,
  placeholder = "Cari nama, email, atau kode…",
  required,
  id,
}: EmployeePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const employees = useEmployees(
    { search: debouncedQuery || undefined },
    PAGE_SIZE
  );
  const items = React.useMemo(
    () => employees.employees ?? [],
    [employees.employees]
  );
  const boundedActiveIndex =
    items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);

  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const optionEl = listRef.current.querySelector<HTMLLIElement>(
      `[data-option-index="${boundedActiveIndex}"]`
    );
    if (typeof optionEl?.scrollIntoView === "function") {
      optionEl.scrollIntoView({ block: "nearest" });
    }
  }, [boundedActiveIndex, open]);

  const selected = React.useMemo(
    () => items.find((item) => item.id === value) ?? null,
    [items, value]
  );

  function openAndFocus() {
    setOpen(true);
  }

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (items.length) {
        setActiveIndex(Math.min(boundedActiveIndex + 1, items.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length) {
        setActiveIndex(Math.max(boundedActiveIndex - 1, 0));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && items[boundedActiveIndex]) {
        handleSelect(items[boundedActiveIndex].id);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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
            error && "border-tp-ink-peach focus-within:border-tp-ink-peach focus-within:ring-2 focus-within:ring-tp-tint-peach"
          )}
        >
          <IconSearch
            aria-hidden
            className="h-4 w-4 shrink-0 text-tp-muted"
          />
          <input
            aria-activedescendant={
              open && items[boundedActiveIndex] ? `${listboxId}-option-${boundedActiveIndex}` : undefined
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
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onFocus={openAndFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            type="text"
            value={selected ? "" : query}
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

        {selected && !query ? (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700">
            <span className="font-medium">{selected.fullName}</span>
            <span className="text-zinc-500">
              ({orDash(selected.nomorInduk)})
            </span>
          </div>
        ) : null}

        {open ? (
          <ul
            aria-label="Pilih karyawan"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 list-none overflow-auto rounded-tp-lg border border-tp-line bg-tp-surface p-1 shadow-card"
            id={listboxId}
            ref={listRef}
            role="listbox"
          >
            {employees.status === "loading" && items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500">Memuat…</li>
            ) : employees.status === "error" ? (
              <li className="px-3 py-2 text-sm text-red-600">
                {employees.error ?? "Gagal memuat daftar karyawan."}
              </li>
            ) : items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500">
                Tidak ada karyawan yang cocok.
              </li>
            ) : (
              items.map((emp, idx) => (
                <li
                  aria-selected={idx === boundedActiveIndex}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1.5 text-sm",
                    idx === boundedActiveIndex
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50"
                  )}
                  data-option-index={idx}
                  id={`${listboxId}-option-${idx}`}
                  key={emp.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(emp.id);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  role="option"
                >
                  <div className="font-medium">{emp.fullName}</div>
                  <div className="text-xs text-zinc-500">
                    {orDash(emp.nomorInduk)} · {orDash(emp.email)}
                  </div>
                </li>
              ))
            )}
          </ul>
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
