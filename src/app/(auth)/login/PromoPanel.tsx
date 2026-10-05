import { HandshakeIcon, VictoryHandIcon } from "./icons";
import { PromoArt } from "./PromoArt";

/**
 * Decorative brand panel matching the reference: purple gradient, bold
 * topographic wave bands, a frosted card with the headline and illustration,
 * plus two floating badges.
 */
const WAVE_PATHS = [
  "M336.3 305.0 L355.5 320.3 L358.8 337.1 L346.6 348.9 L327.2 353.6 L310.5 355.3 L301.2 360.1 L296.8 370.4 L291.3 381.3 L281.6 384.9 L269.3 377.2 L258.7 361.9 L252.0 347.8 L247.6 342.6 L241.8 347.4 L232.5 357.7 L219.8 367.4 L204.9 373.7 L188.5 376.1 L171.1 374.5 L155.5 367.4 L147.3 353.6 L152.3 334.9 L171.0 316.9 L196.3 305.0 L216.7 299.8 L223.6 296.5 L217.3 288.9 L205.9 275.2 L199.4 259.8 L202.2 249.3 L211.6 246.0 L221.3 245.5 L228.0 240.1 L233.0 225.8 L240.4 206.4 L252.0 191.0 L265.9 187.2 L278.1 196.0 L286.1 212.8 L289.8 231.7 L290.2 249.3 L287.5 265.2 L282.2 279.1 L276.7 289.0 L276.6 293.6 L287.5 294.3 L309.8 296.5 L336.3 305.0 Z",
  "M419.9 305.0 L435.6 332.1 L432.2 359.1 L411.2 378.9 L382.2 389.2 L356.4 394.7 L339.3 402.7 L328.3 416.4 L317.5 432.0 L302.7 442.0 L284.8 442.2 L267.3 435.3 L252.0 429.0 L237.4 429.3 L220.6 436.4 L200.3 444.8 L178.0 448.6 L155.7 445.5 L134.8 436.3 L115.6 422.2 L100.4 403.0 L93.8 378.4 L100.3 350.5 L119.6 324.5 L143.9 305.0 L161.9 291.7 L165.6 279.1 L156.2 260.6 L143.2 234.6 L137.5 206.6 L144.1 184.2 L160.3 171.2 L179.5 164.3 L197.1 156.4 L213.4 143.6 L231.3 128.8 L252.0 119.8 L273.4 122.9 L292.0 137.8 L305.9 159.2 L316.0 180.9 L323.8 200.3 L330.0 217.7 L334.6 234.0 L339.4 248.5 L348.8 260.1 L366.9 270.5 L393.2 284.2 L419.9 305.0 Z",
  "M499.0 305.0 L508.6 342.8 L497.3 378.6 L467.7 405.1 L430.7 420.6 L398.2 430.7 L375.8 443.7 L360.7 463.7 L346.0 487.3 L326.5 506.6 L302.6 516.4 L277.1 518.4 L252.0 518.5 L226.5 521.8 L198.8 527.6 L168.6 530.4 L138.4 525.3 L110.9 510.9 L87.2 489.6 L67.1 463.9 L51.9 434.4 L45.1 401.0 L50.4 365.5 L66.8 332.3 L87.0 305.0 L100.1 282.6 L99.3 259.2 L87.1 228.5 L73.9 189.9 L71.4 149.8 L84.5 117.4 L109.9 97.6 L140.0 87.6 L168.9 80.3 L196.0 70.7 L223.3 60.9 L252.0 57.1 L280.3 64.3 L305.4 81.8 L326.3 104.1 L344.4 125.7 L361.7 144.8 L378.5 163.3 L394.0 183.0 L408.7 203.7 L425.7 224.4 L448.3 246.1 L475.3 272.1 L499.0 305.0 Z",
  "M570.2 305.0 L572.8 352.3 L554.2 395.7 L518.0 428.4 L475.8 449.7 L439.5 466.1 L414.3 486.8 L396.6 516.1 L378.4 550.1 L353.8 580.2 L322.5 599.8 L287.7 608.9 L252.0 612.6 L215.6 615.1 L177.7 615.8 L139.1 610.1 L102.9 594.3 L71.5 568.5 L45.5 536.3 L23.9 501.0 L6.8 463.5 L-3.0 423.3 L-2.2 381.3 L8.4 340.9 L22.2 305.0 L29.5 272.2 L24.9 236.8 L11.7 193.5 L1.2 142.8 L4.8 92.5 L26.9 52.8 L63.0 29.2 L104.4 18.6 L144.1 13.2 L180.7 7.0 L216.2 0.4 L252.0 -1.2 L287.1 6.6 L319.5 22.9 L348.9 43.1 L376.9 62.8 L405.1 81.6 L433.0 102.3 L458.7 127.4 L481.4 156.7 L503.3 188.4 L527.1 222.4 L551.7 260.8 L570.2 305.0 Z",
  "M632.5 305.0 L629.3 360.6 L605.6 411.1 L565.8 450.6 L521.4 479.2 L484.0 504.4 L457.6 535.3 L437.6 576.0 L415.2 621.6 L384.0 662.0 L344.0 689.4 L298.7 702.5 L252.0 705.9 L205.1 703.9 L158.3 696.7 L112.9 681.2 L71.7 654.8 L36.8 619.1 L7.9 578.4 L-17.1 536.3 L-38.8 493.1 L-54.7 447.3 L-61.3 399.0 L-58.4 350.8 L-51.5 305.0 L-48.9 260.6 L-55.1 212.8 L-66.1 157.4 L-70.9 96.2 L-58.7 38.0 L-26.0 -6.4 L21.3 -31.8 L73.2 -41.9 L122.3 -45.7 L166.9 -50.6 L209.4 -57.0 L252.0 -60.2 L294.4 -55.7 L335.3 -43.3 L374.6 -26.6 L413.7 -8.6 L453.2 11.3 L491.5 36.7 L525.5 69.9 L553.5 110.0 L577.2 154.1 L599.4 200.8 L619.7 250.8 L632.5 305.0 Z",
  "M687.7 305.0 L681.1 368.3 L655.6 426.1 L615.5 473.6 L571.6 511.7 L534.4 547.7 L507.1 590.7 L483.9 643.5 L455.6 700.0 L416.1 748.6 L365.7 780.5 L309.5 793.8 L252.0 793.3 L195.7 784.3 L141.2 768.2 L89.9 743.3 L44.1 708.3 L5.0 665.6 L-28.8 619.5 L-59.8 573.0 L-89.0 525.5 L-113.5 474.6 L-128.9 419.3 L-133.7 361.9 L-132.3 305.0 L-131.8 248.4 L-136.4 188.4 L-142.1 122.2 L-138.5 52.5 L-116.1 -11.4 L-72.8 -58.7 L-15.3 -85.1 L45.6 -95.4 L102.3 -99.8 L153.5 -106.6 L202.4 -116.7 L252.0 -125.1 L302.7 -126.3 L353.4 -118.9 L403.7 -105.2 L454.1 -87.0 L504.1 -63.0 L551.1 -29.9 L590.7 13.9 L621.1 66.3 L644.1 123.1 L663.2 181.6 L679.3 242.0 L687.7 305.0 Z",
  "M739.5 305.0 L733.0 375.9 L709.0 442.1 L671.0 499.4 L628.9 548.7 L591.9 597.1 L562.3 652.5 L533.9 716.5 L497.7 781.6 L448.1 835.2 L386.7 867.9 L319.4 878.1 L252.0 871.6 L187.4 854.8 L126.2 830.8 L69.3 798.9 L18.2 758.6 L-26.9 712.1 L-67.8 663.2 L-107.5 613.9 L-146.2 562.5 L-180.4 505.6 L-204.3 441.9 L-215.2 373.9 L-216.5 305.0 L-214.8 236.2 L-214.4 165.0 L-212.2 89.6 L-199.1 13.3 L-166.5 -54.7 L-113.7 -104.6 L-48.0 -132.9 L19.7 -145.7 L82.2 -154.0 L139.2 -166.4 L194.6 -183.4 L252.0 -199.1 L312.2 -206.7 L373.6 -203.4 L435.2 -190.3 L496.2 -168.7 L555.1 -137.4 L608.2 -93.9 L651.0 -37.9 L681.7 27.2 L702.8 95.9 L719.1 164.8 L732.6 234.1 L739.5 305.0 Z",
];

export function PromoPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand-800 via-brand-700 to-brand-500 lg:flex lg:w-1/2">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 457 569"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" className="text-brand-900/30" strokeWidth="14">
          {WAVE_PATHS.slice(0, 5).map((d) => (
            <path key={d.slice(0, 12)} d={d} />
          ))}
        </g>
        <g fill="none" stroke="currentColor" className="text-white/8" strokeWidth="2">
          {WAVE_PATHS.slice(2).map((d) => (
            <path key={d.slice(0, 12)} d={d} />
          ))}
        </g>
      </svg>

      <div className="relative flex w-full items-center p-12">
        <div className="relative flex aspect-[4/5] max-h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/12 shadow-2xl shadow-brand-900/20 backdrop-blur-sm">
          <p className="absolute left-10 top-10 z-10 max-w-[19rem] text-3xl font-bold leading-tight text-amber-50">
            Very good works are{" "}
            <span className="whitespace-nowrap">
              waiting for you{" "}
              <VictoryHandIcon className="inline-block h-6 w-6 align-[-0.15em]" />
            </span>
            <span className="mt-2 block">Login Now</span>
          </p>

          <PromoArt className="absolute bottom-4 right-6 h-[64%] w-auto" />

          <span
            aria-hidden="true"
            className="absolute right-7 top-[20%] flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <span className="border-b-2 border-red-600 pb-0.5 text-lg font-bold text-red-600">100</span>
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-[14%] left-[7%] flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <HandshakeIcon />
          </span>
        </div>
      </div>
    </aside>
  );
}