import Link from "next/link";
import { IconClockHour3 } from "@tabler/icons-react";
import { ACTIVITIES } from "@/lib/constants/routes";

export type EmptyStateVariant = "no-data" | "tms-null-self" | "tms-null-other";

const COPY: Record<EmptyStateVariant, { lead: string; body: string }> = {
  "no-data": {
    lead: "Belum ada data workload untuk periode ini.",
    body: "Tidak ada aktivitas tercatat di WAD untuk periode ini. Angka nol sengaja tidak ditampilkan agar tidak menyesatkan — beban kerja akan tampil setelah aktivitas tercatat.",
  },
  "tms-null-self": {
    lead: "Anda belum terhubung ke TMS.",
    body: "Hubungi Operation/Admin untuk melengkapi data karyawan Anda.",
  },
  "tms-null-other": {
    lead: "Talent ini belum terhubung ke TMS.",
    body: "Data workload akan tampil setelah TMS ID diisi pada data master karyawan. Hubungi Operation/Admin untuk melengkapinya.",
  },
};

function EmptyIllustration() {
  return (
    <svg aria-hidden className="shrink-0" height="56" viewBox="0 0 72 56" width="72">
      <g fill="none" strokeLinecap="round" strokeWidth="5">
        <path d="M10 26a36 36 0 0 1 52 0" stroke="var(--tp-line)" />
        <path d="M20 36a22 22 0 0 1 32 0" stroke="var(--tp-line)" />
        <path d="M29 46a8 8 0 0 1 14 0" stroke="var(--tp-line)" />
      </g>
      <circle cx="36" cy="50" fill="var(--tp-brand-navy)" r="4" />
    </svg>
  );
}

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
              className="mt-3.5 inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-tp-brand-navy bg-tp-brand-navy px-[18px] text-sm font-semibold text-white transition-colors hover:bg-tp-brand-navy-deep"
              href={ACTIVITIES}
            >
              <IconClockHour3 aria-hidden className="h-5 w-5" />
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
