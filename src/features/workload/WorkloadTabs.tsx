"use client";

export interface WorkloadTab {
  id: string;
  label: string;
}

/**
 * Role-scoped tab bar (`.tp-tabs`, design §3 item 2). Tabs are UX only:
 * authorization stays server-side (FR-024) and no gated view is reachable by
 * URL.
 */
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
      role="tablist"
      aria-label="Tampilan workload"
      className="flex w-fit gap-1 overflow-x-auto rounded-[14px] border border-tp-line bg-tp-bg p-1"
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={
              selected
                ? "flex-none rounded-[10px] bg-tp-primary px-4 py-2 text-sm font-semibold text-white"
                : "flex-none rounded-[10px] px-4 py-2 text-sm font-medium text-tp-muted transition-colors hover:text-tp-text"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
