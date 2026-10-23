"use client";

import { IconX, IconSearch } from "@tabler/icons-react";
import * as React from "react";
import { useEmployees } from "@/features/employees/useEmployees";
import { cn } from "@/lib/cn";
import { orDash } from "@/lib/cell";

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
  const inputId = id ?? React.useId();
  const listboxId = `${inputId}-listbox`;

  // Debounced search term sent to the server.
  const [debounced, setDebounced] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const employees = useEmployees({ search: debounced || undefined }, PAGE_SIZE);
  const items = employees.employees ?? [];

  // Reset active index when the result list changes.
  React.useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  // Keep the active option visible in the scrollable list.
  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const optionEl = listRef.current.querySelector<HTMLLIElement>(
      `[data-option-index="${activeIndex}"]`
    );
    if (typeof optionEl?.scrollIntoView === "function") {
      optionEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

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
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length) {
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && items[activeIndex]) {
        handleSelect(items[activeIndex].id);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  // Close when clicking outside the picker.
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
      ref={wrapperRef}
      className="flex flex-col gap-1 text-sm font-medium text-zinc-700"
    >
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
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
            id={inputId}
            type="text"
            autoComplete="off"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={
              open && items[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined
            }
            role="combobox"
            className={cn(
              "w-full flex-1 bg-transparent py-1.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400",
              "focus-visible:outline-none"
            )}
            placeholder={placeholder}
            value={selected ? "" : query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={openAndFocus}
            onKeyDown={handleKeyDown}
          />
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Bersihkan pilihan karyawan"
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
            id={listboxId}
            ref={listRef}
            role="listbox"
            aria-label="Pilih karyawan"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 list-none overflow-auto rounded-tp-lg border border-tp-line bg-tp-surface p-1 shadow-card"
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
                  key={emp.id}
                  id={`${listboxId}-option-${idx}`}
                  data-option-index={idx}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1.5 text-sm",
                    idx === activeIndex
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50"
                  )}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(emp.id);
                  }}
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
