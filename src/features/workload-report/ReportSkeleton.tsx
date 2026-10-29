import type { ReactNode } from "react";

function Block({ className = "" }: { className?: string }) {
  return <div className={`rounded-[10px] border border-tp-line bg-tp-bg ${className}`} />;
}

function CardSkeleton({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-4 rounded-[20px] border border-tp-line bg-tp-surface p-5"
    >
      {children}
    </div>
  );
}

export function ReportSkeleton({
  variant = "executive",
  label = "Memuat data workload…",
}: {
  variant?: "executive" | "talent";
  label?: string;
}) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="text-sm text-tp-muted" role="status">
        {label}
      </p>
      <div aria-hidden className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <CardSkeleton key={i}>
            <Block className="h-3.5 w-28" />
            <Block className="h-9 w-20" />
          </CardSkeleton>
        ))}
      </div>
      {variant === "executive" ? (
        <div aria-hidden className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <CardSkeleton key={i}>
              <Block className="h-4 w-52" />
              <Block className="h-56" />
            </CardSkeleton>
          ))}
        </div>
      ) : null}
      <CardSkeleton>
        <Block className="h-4 w-64" />
        <Block className="h-72" />
      </CardSkeleton>
    </div>
  );
}
