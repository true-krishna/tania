import type { TrendPoint } from "./types";

const WIDTH = 300;
const HEIGHT = 130;
const LEFT = 20;
const RIGHT = 288;
const TOP = 25; // 100% reference line
const BOTTOM = 110; // 0%
const REFERENCE = 100;

function yFor(value: number): number {
  // 100% sits on the TOP reference line; overflow draws above it (design §5.4).
  return BOTTOM - (value / REFERENCE) * (BOTTOM - TOP);
}

function xFor(index: number, count: number): number {
  if (count <= 1) return (LEFT + RIGHT) / 2;
  return LEFT + (index * (RIGHT - LEFT)) / (count - 1);
}

/** Recent-periods line chart (design spec §5.4). Single hue, server values only. */
export function WorkloadTrendChart({
  trend,
  stale = false,
}: {
  trend: TrendPoint[];
  stale?: boolean;
}) {
  if (trend.length === 0) {
    return <p className="text-sm text-tp-muted">Data tren belum tersedia untuk periode ini.</p>;
  }

  const points = trend.map((p, i) => ({ ...p, x: xFor(i, trend.length), y: yFor(p.loadPercentage) }));
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${points[0].x},${BOTTOM} ${line} ${points[points.length - 1].x},${BOTTOM}`;
  const values = trend.map((p) => `${p.label} ${p.loadPercentage}`).join(", ");
  const label = `Tren beban kerja: ${values} persen${stale ? " — data lama" : ""}`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
      className="block h-auto w-full"
    >
      <line
        x1={14}
        y1={TOP}
        x2={RIGHT + 4}
        y2={TOP}
        stroke="var(--tp-neutral)"
        strokeDasharray="4 4"
        strokeOpacity={0.7}
      />
      <text x={16} y={19} fontSize={10} fill="var(--tp-muted)">
        100%
      </text>
      <polygon points={area} fill="var(--tp-brand-navy)" fillOpacity={0.08} />
      <polyline
        points={line}
        fill="none"
        stroke="var(--tp-brand-navy)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g fill="var(--tp-surface)" stroke="var(--tp-brand-navy)" strokeWidth={2}>
        {points.map((p) => (
          <circle key={`${p.label}-${p.loadPercentage}`} cx={p.x} cy={p.y} r={3} />
        ))}
      </g>
      <g fontSize={10} fill="var(--tp-muted)" textAnchor="middle">
        {points.map((p) => (
          <text key={p.label} x={p.x} y={126}>
            {p.label}
          </text>
        ))}
      </g>
    </svg>
  );
}
