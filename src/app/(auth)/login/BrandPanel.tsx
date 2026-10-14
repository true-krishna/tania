/**
 * Login brand panel — TAN-191 redesign, second pass on owner feedback: the
 * full-red field read as visual overload, so the panel returns to a light
 * surface where brand red is an accent, not a flood. Red stays the signature
 * in controlled doses — the official navy wordmark with its red plus mark, a
 * red tint/ink chip (the ratified pairing, 5.6:1), and flat geometry (red
 * tint circle, tint-line ring, one solid red diamond). The form side keeps
 * the red primary button (TAN-191 §II deviation unchanged). No gradients, no
 * new hex values, no faces.
 */
import { Brand } from "@/components/Brand";

export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-tp-line bg-tp-surface lg:flex lg:w-1/2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Red-tint tier, top-right. */}
        <div className="absolute -top-48 -right-24 size-[34rem] rounded-full bg-tp-brand-red-tint" />
        {/* Tint-line ring, bottom-left. */}
        <div className="absolute -bottom-20 -left-16 size-72 rounded-full border-2 border-tp-brand-red-tint-line" />
        {/* Solid red diamond accent. */}
        <div className="absolute bottom-24 left-14 size-6 rotate-45 rounded-tp-sm bg-tp-brand-red" />
      </div>

      <div className="relative flex w-full flex-col p-12 xl:p-14">
        <div>
          <Brand variant="large" className="text-[49px]" />
        </div>

        <div className="my-auto flex flex-col gap-8 py-16">
          <span className="tp-chip self-start bg-tp-brand-red-tint text-tp-brand-red-ink">
            Talent Management Platform
          </span>

          <div>
            <p className="max-w-[26rem] text-[40px] font-bold leading-[1.2] text-tp-text">
              Satu ruang kerja untuk manajemen talenta yang lebih transparan
            </p>
            <p className="mt-5 max-w-[27rem] text-base leading-[1.6] text-tp-muted">
              Pantau talent, timesheet, workload, kompetensi, dan evaluasi
              performa dalam satu platform yang terintegrasi.
            </p>
          </div>
        </div>

        <p className="text-[13px] text-tp-muted">© 2026 Tania Foundation</p>
      </div>
    </aside>
  );
}