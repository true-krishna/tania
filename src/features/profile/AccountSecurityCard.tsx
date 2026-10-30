import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { ProfileErrorState } from "./ProfileErrorState";
import { ENTRA_PROVISION_STATUS_LABEL } from "@/features/entra/labels";
import type { RefetchableQueryState } from "@/lib/apollo/toQueryState";
import { AccountSecurityRow } from "./AccountSecurityRow";

import type { SelfAccountSecurity } from "./useSelfProfile";

function sessionHint(security: SelfAccountSecurity | undefined): string {
  if (!security) return "Sesi aktif belum tersedia.";
  const { sessions } = security;
  if (sessions.length === 0) return "Tidak ada sesi aktif.";
  const latest = sessions[0];
  const method = latest.authMethod === "entra_sso" ? "Microsoft Entra" : "kata sandi";
  return `${sessions.length} perangkat aktif · sesi terbaru lewat ${method}.`;
}

export function AccountSecurityCard({
  email,
  security,
}: {
  email: string | undefined;
  security: RefetchableQueryState<SelfAccountSecurity>;
}) {
  const provision = security.data?.entraProvision;
  const linked = provision?.status === "CREATED" || provision?.status === "INVITED";

  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h2 className="tp-h3">Akun & keamanan</h2>
        <Chip size="small" variant="neutral">
          Hanya profil sendiri
        </Chip>
      </div>
      {security.status === "loading" ? (
        <div aria-busy="true" className="mt-3 animate-pulse">
          <span className="sr-only">Memuat status keamanan akun…</span>
          <div aria-hidden className="flex flex-col gap-3">
            <div className="h-3 w-2/3 rounded-tp-sm bg-tp-bg" />
            <div className="h-3 w-full rounded-tp-sm bg-tp-bg" />
            <div className="h-3 w-1/2 rounded-tp-sm bg-tp-bg" />
          </div>
        </div>
      ) : null}
      {security.status === "error" ? (
        <div className="mt-3">
          <ProfileErrorState
            message={security.error ?? "Gagal memuat status keamanan akun."}
            onRetry={security.refetch}
          />
        </div>
      ) : null}
      {security.status === "ready" ? (
        <div className="mt-3 flex flex-col">
          <AccountSecurityRow label="Email akun" reason="Sesi tidak tersedia." value={email} />
          <AccountSecurityRow
            label="Kata sandi"
            reason="Belum dilacak oleh TANIA; ubah lewat penyedia identitas."
          />
          <AccountSecurityRow
            label="Autentikasi dua faktor"
            reason="Akun belum terhubung ke Microsoft Entra."
            value={linked ? "Dikelola tenant Microsoft Entra" : undefined}
          />
          <AccountSecurityRow
            label="Akun Microsoft Entra"
            reason="Belum pernah diprovisi."
            value={
              provision
                ? (provision.upn ?? ENTRA_PROVISION_STATUS_LABEL[provision.status])
                : undefined
            }
          />
          <AccountSecurityRow
            label="Perangkat & sesi"
            reason="Belum ada sesi aktif."
            value={sessionHint(security.data)}
          />
        </div>
      ) : null}
    </Card>
  );
}
