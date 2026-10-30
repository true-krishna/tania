import { EmptyState } from "@/components/DataState";
import type { QueryStatus } from "@/lib/apollo/toQueryState";
import { ContractSummary } from "./ContractSummary";
import { ProfileErrorState } from "./ProfileErrorState";
import type { ProfileContract } from "./useProfile";

export function ContractBody({
  canRead,
  contracts,
  error,
  onRetry,
  status,
}: {
  canRead: boolean;
  contracts: readonly ProfileContract[];
  error: string | null;
  onRetry: () => void;
  status: QueryStatus;
}) {
  if (!canRead) {
    return (
      <p className="tp-empty mt-3">
        <strong>Rincian kontrak belum dapat dibaca dari akun Anda</strong>
        Nomor, jenis, dan periode kontrak dikelola Chapter/Operation. Hubungi mereka untuk perubahan
        atau salinan kontrak.
      </p>
    );
  }
  if (status === "loading") {
    return (
      <div aria-busy="true" className="mt-3 animate-pulse">
        <span className="sr-only">Memuat kontrak…</span>
        <div aria-hidden className="flex flex-col gap-3">
          <div className="h-4 w-2/3 rounded-tp-sm bg-tp-bg" />
          <div className="h-3 w-1/2 rounded-tp-sm bg-tp-bg" />
        </div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mt-3">
        <ProfileErrorState message={error ?? "Gagal memuat kontrak."} onRetry={onRetry} />
      </div>
    );
  }

  const active = contracts.find((contract) => contract.status === "ACTIVE");
  if (!active) {
    return (
      <div className="mt-3">
        <EmptyState message="Belum ada kontrak aktif untuk akun ini." />
      </div>
    );
  }
  const history = contracts.filter((contract) => contract.id !== active.id);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <ContractSummary contract={active} />
      {history.length > 0 ? (
        <details className="min-w-0 border-t border-tp-line pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-tp-brand-red-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tp-brand-red">
            {`Riwayat kontrak (${history.length})`}
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {history.map((contract) => (
              <ContractSummary contract={contract} key={contract.id} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
