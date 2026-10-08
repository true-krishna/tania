import Link from "next/link";
import { Icon } from "@/components/Icon";

export type EmptyStateVariant = "no-data" | "tms-null-self" | "tms-null-other";

const COPY: Record<EmptyStateVariant, { lead: string; body: string }> = {
  "no-data": {
    lead: "Belum ada data workload untuk periode ini.",
    body:
      "Tidak ada aktivitas tercatat di WAD untuk periode ini. Angka nol sengaja tidak ditampilkan agar tidak menyesatkan — beban kerja akan tampil setelah aktivitas tercatat.",
  },
  "tms-null-self": {
    lead: "Anda belum terhubung ke TMS.",
    body: "Hubungi Operation/Admin untuk melengkapi data karyawan Anda.",
  },
  "tms-null-other": {
    lead: "Talent ini belum terhubung ke TMS.",
    body:
      "Data workload akan tampil setelah TMS ID diisi pada data master karyawan. Hubungi Operation/Admin untuk melengkapinya.",
  },
};

/** Arc motif shipped with the empty state (design §5.5, FR-016). */
function EmptyIllustration() {
  return (
    <svg viewBox="0 0 72 56" width="72" height="56" aria-hidden className="shrink-0">
      <g fill="none" strokeWidth="5" strokeLinecap="round">
        <path d="M10 26a36 36 0 0 1 52 0" stroke="var(--tp-line)" />
        <path d="M20 36a22 22 0 0 1 32 0" stroke="var(--tp-line)" />
        <path d="M29 46a8 8 0 0 1 14 0" stroke="var(--tp-line)" />
      </g>
      <circle cx="36" cy="50" r="4" fill="var(--tp-lilac)" />
    </svg>
  );
}

/** Empty / no-data state (FR-016; design §5.5). Never a fabricated zero. */
export function WorkloadEmptyState({ variant }: { variant: EmptyStateVariant }) {
  const { lead, body } = COPY[variant];

  return (
    <div className="flex flex-wrap items-start gap-4 rounded-[20px] border border-tp-line bg-tp-surface p-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-tp-muted">
          <strong className="block font-semibold text-tp-text">{lead}</strong>
          {body}
        </p>
        {variant === "no-data" ? (
          <>
            <Link
              href="/activities"
              className="mt-3.5 inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-tp-primary bg-tp-primary px-[18px] text-sm font-semibold text-white transition-colors hover:bg-tp-primary-deep"
            >
              <Icon name="timesheet" className="h-5 w-5" />
              Catat aktivitas
            </Link>
            <p className="mt-2 text-[13px] text-tp-muted">Anda juga dapat memilih periode lain.</p>
          </>
        ) : null}
      </div>
      <EmptyIllustration />
    </div>
  );
}
