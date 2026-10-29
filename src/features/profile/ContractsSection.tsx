import { Card } from "@/components/Card";
import { EmptyState } from "@/components/DataState";
import { HanyaBacaChip } from "@/features/workload/HanyaBacaChip";
import { useModuleAccess } from "@/lib/auth/access";
import { ContractRow } from "./ContractRow";
import type { ProfileContract } from "./useProfile";

export function ContractsSection({ contracts }: { contracts: readonly ProfileContract[] }) {
  const linked = useModuleAccess("contracts").canRead;

  if (contracts.length === 0) {
    return <EmptyState message="Belum ada kontrak tercatat." />;
  }

  return (
    <Card className="min-w-0 max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-tp-text">
          {`Riwayat kontrak (${contracts.length})`}
        </h2>
        <HanyaBacaChip />
      </div>
      <div className="flex flex-col gap-3">
        {contracts.map((contract) => (
          <ContractRow contract={contract} key={contract.id} linked={linked} />
        ))}
      </div>
    </Card>
  );
}
