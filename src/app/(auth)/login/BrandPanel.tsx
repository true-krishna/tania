/**
 * Login brand panel — mockup structure (TAN-160) translated to the ratified
 * canon (constitution-design v4.3.0):
 * - the mockup's navy brand panel maps to the single permitted dark surface
 *   `--tp-nav` (navy `#172B4D`) — one dark card per screen (§II);
 * - its red accent maps to `--tp-brand-red`, the separate brand accent
 *   voltage (§II, §IX);
 * - decoration is flat geometry in one hue at stepped opacity — the mockup's
 *   two dark corner shapes become brand red at 25% and 15% (Additional
 *   Constraints: no gradients, no faces);
 * - secondary copy on the dark surface is white at reduced opacity (white on
 *   navy = 14.1:1; white at 80% ≈ 9.6:1), which stays well above §VI;
 * - the logo slot uses the shared `Brand` wordmark in its `light` variant on the
 *   navy surface, where the guideline requires the white logo.
 *
 * Copy is the owner's revision from the TAN-160 review (platform, not DPS
 * cockpit; no invite-only/contact-admin wording).
 */
import { Brand } from "@/components/Brand";

export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-tp-nav lg:flex lg:w-1/2">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Corner triangle, top-right (mockup: darker plum block). */}
        <div className="absolute -top-px right-0 h-[19%] w-[21%] bg-tp-brand-red/25 [clip-path:polygon(0_0,100%_0,100%_100%)]" />
        {/* Rotated square, bottom-left (mockup: darker plum block). */}
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rotate-45 rounded-tp-xl bg-tp-brand-red/15" />
      </div>

      <div className="relative flex w-full flex-col p-12 xl:p-14">
        <div>
          <Brand variant="large" light className="text-[49px]" />
        </div>

        <div className="my-auto flex flex-col gap-6">
          {/* Mockup: diamond tile, mid-panel. Flat geometry only — no recreated
           * brand emblem (artwork not approved, §I). */}
          <span
            aria-hidden="true"
            className="block h-16 w-16 rotate-45 rounded-tp-sm bg-tp-brand-red/25"
          />

          <div>
            <p className="text-[13px] font-semibold text-white/80">
              Talent Management Platform
            </p>
            <p className="mt-3 max-w-[26rem] text-[40px] font-bold leading-[1.2] text-tp-on-nav">
              Satu ruang kerja untuk manajemen talenta yang lebih transparan
            </p>
            <p className="mt-5 max-w-[27rem] text-base leading-[1.6] text-white/75">
              Pantau talent, timesheet, workload, kompetensi, dan evaluasi
              performa dalam satu platform yang terintegrasi.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
