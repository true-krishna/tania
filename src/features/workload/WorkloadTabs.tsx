"use client";

export interface WorkloadTab {
  id: string;
  label: string;
}

export function WorkloadTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: WorkloadTab[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      aria-label="Tampilan workload"
      className="flex w-fit gap-1 overflow-x-auto rounded-[14px] border border-tp-line bg-tp-bg p-1"
      role="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            aria-selected={selected}
            className={
              selected
                ? "flex-none rounded-[10px] bg-tp-brand-navy px-4 py-2 text-sm font-semibold text-white"
                : "flex-none rounded-[10px] px-4 py-2 text-sm font-medium text-tp-muted transition-colors hover:text-tp-text"
            }
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
