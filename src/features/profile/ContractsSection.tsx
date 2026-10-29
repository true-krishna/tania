import { Card } from "@/components/Card";
import { EmptyState } from "@/components/DataState";
import { useModuleAccess } from "@/lib/auth/access";
import type { ProfileContract } from "./useProfile";
import { ContractRow } from "./ContractRow";

export function ContractsSection({ contracts }: { contracts: readonly ProfileContract[] }) {
  const linked = useModuleAccess("contracts").canRead;

  if (contracts.length === 0) {
    return <EmptyState message="Belum ada kontrak tercatat." />;
  }

  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">
        Riwayat kontrak ({contracts.length})
      </h2>
      <div className="flex flex-col gap-3">
        {contracts.map((contract) => (
          <ContractRow contract={contract} key={contract.id} linked={linked} />
        ))}
      </div>
    </Card>
  );
}
