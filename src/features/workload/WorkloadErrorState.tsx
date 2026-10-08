/**
 * Hard-error card (design §6, [non-canonical]): network/GraphQL failure with no
 * last-known data. Never renders a zero — there is no figure to show.
 */
export function WorkloadErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] border border-tp-line bg-tp-surface p-5"
    >
      <div>
        <p className="text-sm font-semibold text-tp-text">Data workload tidak dapat dimuat.</p>
        <p className="mt-1.5 max-w-[56ch] text-sm text-tp-muted">
          Sumber data WAD tidak merespons dan tidak ada angka terakhir yang tersimpan untuk periode ini.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border-[1.5px] border-tp-text px-4 py-2 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg"
      >
        Coba lagi
      </button>
    </div>
  );
}
