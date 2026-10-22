export interface BarItem {
  label: string;
  value: number;
}

interface BarListProps {
  items: BarItem[];
  total?: number;
}

export function BarList({ items, total }: BarListProps) {
  const denominator = total ?? items.reduce((sum, item) => sum + item.value, 0);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => {
        const pct = denominator > 0 ? Math.round((item.value / denominator) * 100) : 0;
        return (
          <li key={`${item.label}-${index}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-zinc-600">{item.label}</span>
              <span className="shrink-0 font-semibold text-zinc-900">{item.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-tp-brand-navy" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}