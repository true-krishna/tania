import { Brand } from "@/components/Brand";

export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-tp-line bg-tp-surface lg:flex lg:w-1/2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 -right-24 size-[34rem] rounded-full bg-tp-brand-red-tint" />
        <div className="absolute -bottom-20 -left-16 size-72 rounded-full border-2 border-tp-brand-red-tint-line" />
        <div className="absolute bottom-24 left-14 size-6 rotate-45 rounded-tp-sm bg-tp-brand-red" />
      </div>

      <div className="relative flex w-full flex-col p-12 xl:p-14">
        <div>
          <Brand className="text-[49px]" variant="large" />
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