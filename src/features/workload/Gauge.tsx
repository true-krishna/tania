export function Gauge({ loadPercentage }: { loadPercentage: number }) {
  const capped = Math.min(Math.max(loadPercentage, 0), 100);
  const arc = 138;
  const filled = (capped / 100) * arc;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg aria-hidden height="70" viewBox="0 0 120 70" width="120">
        <path
          d="M16 62 A44 44 0 0 1 104 62"
          fill="none"
          stroke="var(--tp-on-nav)"
          strokeLinecap="round"
          strokeOpacity={0.25}
          strokeWidth={10}
        />
        <path
          d="M16 62 A44 44 0 0 1 104 62"
          fill="none"
          stroke="var(--tp-on-nav)"
          strokeDasharray={`${filled} ${arc}`}
          strokeLinecap="round"
          strokeWidth={10}
        />
      </svg>
      <span className="text-[12.5px] text-tp-on-nav" style={{ opacity: 0.72 }}>
        Kapasitas terisi {loadPercentage}%
      </span>
    </div>
  );
}
