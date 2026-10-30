import { Card } from "@/components/Card";
import { HanyaBacaChip } from "@/features/workload/HanyaBacaChip";
import { useModuleAccess } from "@/lib/auth/access";
import type { QueryStatus } from "@/lib/apollo/toQueryState";
import { ContractBody } from "./ContractBody";
import type { ProfileContract } from "./useProfile";

export function ContractsSection({
  contracts,
  status = "ready",
  error = null,
  onRetry,
}: {
  contracts: readonly ProfileContract[];
  status?: QueryStatus;
  error?: string | null;
  onRetry?: () => void;
}) {
  const canRead = useModuleAccess("contracts").canRead;

  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h2 className="tp-h3">Kontrak aktif</h2>
        <HanyaBacaChip />
      </div>
      <ContractBody
        canRead={canRead}
        contracts={contracts}
        error={error}
        onRetry={onRetry ?? (() => {})}
        status={status}
      />
      <p className="mt-4 border-t border-tp-line pt-3 text-[13px] leading-5 text-tp-muted">
        Unit, posisi, dan email kantor aktif diturunkan dari kontrak aktif. Setiap perubahan
        tercatat pada jejak audit.
      </p>
    </Card>
  );
}
