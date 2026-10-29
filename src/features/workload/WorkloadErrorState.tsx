export function WorkloadErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] border border-tp-line bg-tp-surface p-5"
      role="alert"
    >
      <div>
        <p className="text-sm font-semibold text-tp-text">Data workload tidak dapat dimuat.</p>
        <p className="mt-1.5 max-w-[56ch] text-sm text-tp-muted">
          Sumber data WAD tidak merespons dan tidak ada angka terakhir yang tersimpan untuk periode
          ini.
        </p>
      </div>
      <button
        className="rounded-full border-[1.5px] border-tp-text px-4 py-2 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg"
        onClick={onRetry}
        type="button"
      >
        Coba lagi
      </button>
    </div>
  );
}
