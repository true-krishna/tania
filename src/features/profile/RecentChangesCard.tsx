import { Card } from "@/components/Card";
import { EmptyState } from "@/components/DataState";
import { ACTION_LABEL, entityLabel } from "@/features/audit/actionLabels";
import { ProfileErrorState } from "./ProfileErrorState";
import { useMyAuditTrail } from "./useSelfProfile";

function relativeTime(value: string, now = Date.now()): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;
  const minutes = Math.round((now - time) / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days} hari lalu`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.round(months / 12)} tahun lalu`;
}

export function RecentChangesCard() {
  const audit = useMyAuditTrail(5);

  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <h2 className="tp-h3">Perubahan terakhir</h2>
        <span className="tp-label">Jejak audit milik saya</span>
      </div>
      {audit.status === "loading" ? (
        <div aria-busy="true" className="mt-3 animate-pulse">
          <span className="sr-only">Memuat jejak audit…</span>
          <div aria-hidden className="flex flex-col gap-3">
            <div className="h-3 w-3/4 rounded-tp-sm bg-tp-bg" />
            <div className="h-3 w-2/3 rounded-tp-sm bg-tp-bg" />
            <div className="h-3 w-1/2 rounded-tp-sm bg-tp-bg" />
          </div>
        </div>
      ) : null}
      {audit.status === "error" ? (
        <div className="mt-3">
          <ProfileErrorState
            message={audit.error ?? "Gagal memuat jejak audit."}
            onRetry={audit.refetch}
          />
        </div>
      ) : null}
      {audit.status === "ready" && (audit.data ?? []).length === 0 ? (
        <div className="mt-3">
          <EmptyState message="Belum ada perubahan tercatat untuk record Anda." />
        </div>
      ) : null}
      {audit.status === "ready" && (audit.data ?? []).length > 0 ? (
        <ul className="mt-3 flex flex-col">
          {(audit.data ?? []).map((entry) => (
            <li
              className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-tp-line py-2.5 first:border-t-0 first:pt-0 last:pb-0"
              key={entry.id}
            >
              <p className="min-w-0 flex-1 text-[13px] leading-5 text-tp-text">
                <span className="font-semibold">{entityLabel(entry.entityType)}</span>
                {` ${ACTION_LABEL[entry.action].toLowerCase()}`}
                {entry.actor?.fullName ? ` oleh ${entry.actor.fullName}` : ""}
              </p>
              <span className="text-[13px] text-tp-muted">{relativeTime(entry.occurredAt)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
