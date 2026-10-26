import { Brand } from "@/components/Brand";

export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden rounded-tp-xl bg-tp-warm-white lg:flex lg:w-1/2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-32 -right-[52px] size-[25rem] rounded-full bg-tp-brand-red-tint" />
        <div className="absolute right-14 top-[38%] size-44 rounded-full border-2 border-tp-tosca/40 hidden xl:block" />
        <div className="absolute bottom-56 right-24 size-6 rotate-45 rounded-tp-sm bg-tp-brand-red hidden xl:block" />
        <svg
          className="absolute inset-x-0 bottom-0 h-[200px] w-full"
          preserveAspectRatio="none"
          viewBox="0 0 560 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 92 C 90 56 180 56 270 92 C 370 132 470 132 560 92 L560 200 L0 200 Z"
            fill="var(--tp-sky-strong)"
          />
          <path
            d="M0 118 C 110 90 210 90 310 124 C 410 156 495 156 560 126 L560 200 L0 200 Z"
            fill="var(--tp-brand-red)"
          />
          <path
            d="M0 144 C 120 110 240 110 350 146 C 450 178 520 178 560 150 L560 200 L0 200 Z"
            fill="var(--tp-tosca)"
          />
          <path
            d="M0 172 C 130 144 260 144 380 174 C 480 198 540 198 560 182 L560 200 L0 200 Z"
            fill="var(--tp-brand-navy)"
          />
        </svg>
      </div>

      <div className="relative z-10 flex w-full flex-col p-12 xl:p-14">
        <div className="flex items-start justify-between gap-6">
          <Brand className="text-[40px]" variant="large" />
          <p className="text-[13px] text-tp-muted">© 2026 Tania Foundation</p>
        </div>

        <div className="my-auto flex flex-col gap-8 py-16">
          <span className="tp-chip self-start bg-tp-tosca-soft text-tp-tosca-ink">
            Platform manajemen talent
          </span>

          <div>
            <p className="max-w-[28rem] text-[30px] font-bold leading-[1.25] text-tp-text xl:text-[40px]">
              Kariermu, perjalananmu:
              <br />
              Kelola potensi dengan
              <span
                aria-hidden="true"
                className="mx-2 inline-block size-2.5 rotate-45 rounded-[2px] bg-tp-brand-red align-middle"
              />
              <br />
              lebih terbuka.
            </p>
            <p className="mt-5 max-w-[27rem] text-base leading-[1.6] text-tp-muted">
              Platform HR yang mendukung setiap langkah perjalanan kariermu, dari
              pengembangan diri hingga pencapaian masa depan.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
