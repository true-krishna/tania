import Link from "next/link";
import { IconClockHour3 } from "@tabler/icons-react";
import { ACTIVITIES } from "@/lib/constants/routes";
import { EmptyIllustration } from "./EmptyIllustration";

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
