"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip } from "@/components/Chip";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { IDP_STATUS_LABEL, IDP_STATUS_VARIANT } from "@/features/idp/labels";
import { useIdp } from "@/features/idp/useIdp";
import { useModuleAccess } from "@/lib/auth/access";
import { useSessionRole } from "@/lib/auth/guard";
import { IDP } from "@/lib/constants/routes";
import { DevelopmentActionsCard } from "./DevelopmentActionsCard";
import { IdpCloseCard } from "./IdpCloseCard";
import { IdpComponentsCard } from "./IdpComponentsCard";
import { ReviewHistoryCard } from "./ReviewHistoryCard";
import { RevisionHistoryCard } from "./RevisionHistoryCard";

export function IdpDetailView({ id }: { id: string }) {
  const role = useSessionRole();
  const managing = useModuleAccess("idp").canManage;
  const canUpdateStatus = managing || role === "TALENT";
  const { status, data, error } = useIdp(id);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data) return notFound();

  return (
    <section className="flex flex-col gap-4">
      <Link className="w-fit text-sm text-zinc-500 hover:text-zinc-900" href={IDP}>
        ← Kembali ke daftar
      </Link>
      <PageHeader
        actions={
          <Chip size="small" variant={IDP_STATUS_VARIANT[data.status]}>
            {IDP_STATUS_LABEL[data.status]}
          </Chip>
        }
        subtitle={`${data.id} · ${data.talent.jobRole?.name ?? "—"}`}
        title={`IDP — ${data.talent.fullName}`}
      />

      <IdpComponentsCard idp={data} />
      <DevelopmentActionsCard canUpdateStatus={canUpdateStatus} idp={data} managing={managing} />
      <ReviewHistoryCard idp={data} managing={managing} />
      <RevisionHistoryCard idp={data} />
      <IdpCloseCard idp={data} managing={managing} />
    </section>
  );
}
