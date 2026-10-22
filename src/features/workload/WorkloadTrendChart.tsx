import type { TrendPoint } from "./types";

const WIDTH = 300;
const HEIGHT = 130;
const LEFT = 20;
const RIGHT = 288;
const TOP = 25; 
const BOTTOM = 110; 
const REFERENCE = 100;

function yFor(value: number): number {
  return BOTTOM - (value / REFERENCE) * (BOTTOM - TOP);
}

function xFor(index: number, count: number): number {
  if (count <= 1) return (LEFT + RIGHT) / 2;
  return LEFT + (index * (RIGHT - LEFT)) / (count - 1);
}

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
      aria-label={label}
      className="block h-auto w-full"
      role="img"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      <line
        stroke="var(--tp-neutral)"
        strokeDasharray="4 4"
        strokeOpacity={0.7}
        x1={14}
        x2={RIGHT + 4}
        y1={TOP}
        y2={TOP}
      />
      <text fill="var(--tp-muted)" fontSize={10} x={16} y={19}>
        100%
      </text>
      <polygon fill="var(--tp-brand-navy)" fillOpacity={0.08} points={area} />
      <polyline
        fill="none"
        points={line}
        stroke="var(--tp-brand-navy)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
      />
      <g fill="var(--tp-surface)" stroke="var(--tp-brand-navy)" strokeWidth={2}>
        {points.map((p) => (
          <circle cx={p.x} cy={p.y} key={`${p.label}-${p.loadPercentage}`} r={3} />
        ))}
      </g>
      <g fill="var(--tp-muted)" fontSize={10} textAnchor="middle">
        {points.map((p) => (
          <text key={p.label} x={p.x} y={126}>
            {p.label}
          </text>
        ))}
      </g>
    </svg>
  );
}
