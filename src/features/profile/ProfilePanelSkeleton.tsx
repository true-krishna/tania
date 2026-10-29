import { Card } from "@/components/Card";

export function ProfilePanelSkeleton({ label = "Memuat…" }: { label?: string }) {
  return (
    <Card aria-busy="true" className="min-w-0">
      <span className="sr-only">{label}</span>
      <div aria-hidden className="flex animate-pulse flex-col gap-3">
        <div className="h-4 w-40 rounded-tp-sm bg-tp-bg" />
        <div className="h-3 w-full rounded-tp-sm bg-tp-bg" />
        <div className="h-3 w-5/6 rounded-tp-sm bg-tp-bg" />
        <div className="h-3 w-2/3 rounded-tp-sm bg-tp-bg" />
      </div>
    </Card>
  );
}
