export interface HeroKpi {
  value: string;
  caption: string;
}

export function WorkloadKpiHero({ label, kpis }: { label: string; kpis: HeroKpi[] }) {
  return (
    <section
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-8 rounded-[20px] bg-tp-nav p-6 text-tp-on-nav"
    >
      <div>
        <p className="text-[13px] text-tp-on-nav" style={{ opacity: 0.72 }}>
          {label}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-x-9 gap-y-4">
          {kpis.map((kpi) => (
            <div key={kpi.caption}>
              <p className="font-tp-display text-[28px] font-extrabold leading-none">{kpi.value}</p>
              <p className="mt-1 text-sm" style={{ opacity: 0.85 }}>
                {kpi.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
