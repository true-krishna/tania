/**
 * Login brand panel — mockup structure (TAN-160) translated to the ratified
 * canon (constitution-design v4.0.0):
 * - the mockup's navy brand panel maps to the single permitted dark surface
 *   `--tp-nav` (primary-900) — one dark card per screen (§II);
 * - its red accent maps to `--tp-primary` (primary-500), the only
 *   interactive/decorative accent voltage (§II, §IX);
 * - decoration is flat geometry in one hue at stepped opacity — the mockup's
 *   two dark corner shapes become primary-500 at 25% and 15% (Additional
 *   Constraints: no gradients, no faces);
 * - secondary copy on the dark surface is white at reduced opacity, because
 *   `--tp-lilac` and raw mint are not legal text colors (§IX).
 */
export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-tp-nav lg:flex lg:w-1/2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Corner triangle, top-right (mockup: darker plum block). */}
        <div className="absolute -top-px right-0 h-[19%] w-[21%] bg-tp-primary/25 [clip-path:polygon(0_0,100%_0,100%_100%)]" />
        {/* Rotated square, bottom-left (mockup: darker plum block). */}
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rotate-45 rounded-tp-xl bg-tp-primary/15" />
      </div>

      <div className="relative flex w-full flex-col p-12 xl:p-14">
        <BrandMark />

        <div className="my-auto flex flex-col gap-6">
          {/* Mockup: diamond tile with the brand emblem, mid-panel. */}
          <span
            aria-hidden="true"
            className="grid h-16 w-16 place-items-center rounded-tp-sm bg-tp-primary/25 text-xl font-bold text-white/80"
          >
            T
          </span>

          <div>
            <p className="text-[13px] font-semibold text-white/80">
              Portal Management Cockpit
            </p>
            <p className="mt-3 max-w-[26rem] text-[40px] font-bold leading-[1.2] text-tp-on-nav">
              Satu ruang kerja untuk operasional DPS yang lebih terarah.
            </p>
            <p className="mt-5 max-w-[27rem] text-base leading-[1.6] text-white/75">
              Pantau talent, timesheet, workload, feasibility, dan budget dalam
              satu cockpit operasional yang terintegrasi.
            </p>
          </div>
        </div>

        <p className="text-sm text-white/70">© Invite-only workspace</p>
      </div>
    </aside>
  );
}

/** Mockup: disc mark + TANIA wordmark with a "DPS Cockpit" caption. */
function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 place-items-center rounded-[999px] bg-tp-primary text-xl font-bold text-white"
      >
        T
      </span>
      <span className="flex flex-col">
        <span className="text-lg font-bold leading-none text-tp-on-nav">
          TANIA
        </span>
        <span className="mt-1 text-[11px] font-semibold leading-none text-white/70">
          DPS Cockpit
        </span>
      </span>
    </div>
  );
}
