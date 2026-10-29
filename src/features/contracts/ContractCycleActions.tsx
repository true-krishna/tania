"use client";

import { Card } from "@/components/Card";
import type { Contract } from "./contractCycle";
import { MutationAction } from "./MutationAction";
import { ResignAction } from "./ResignAction";
import { RetireAction } from "./RetireAction";

export function ContractCycleActions({ contract }: { contract: Contract }) {
  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">
        Aksi siklus karyawan
      </h2>
      <div className="flex flex-col gap-6">
        <ResignAction contract={contract} />
        <MutationAction contract={contract} />
        <RetireAction contract={contract} />
      </div>
    </Card>
  );
}
