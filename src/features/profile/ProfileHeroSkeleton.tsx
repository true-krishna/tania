import { Card } from "@/components/Card";

export function ProfileHeroSkeleton() {
  return (
    <Card aria-busy="true" className="min-w-0" padded={false}>
      <span className="sr-only">Memuat profil…</span>
      <div aria-hidden className="h-20 border-b border-tp-line bg-tp-bg" />
      <div className="animate-pulse px-5 pb-5">
        <div className="h-20 w-20 rounded-full border-4 border-tp-surface bg-tp-bg" />
        <div className="mt-4 h-8 w-64 max-w-full rounded-tp-sm bg-tp-bg" />
        <div className="mt-3 h-4 w-48 max-w-full rounded-tp-sm bg-tp-bg" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="flex flex-col gap-2" key={index}>
              <div className="h-3 w-20 rounded-tp-sm bg-tp-bg" />
              <div className="h-4 w-28 rounded-tp-sm bg-tp-bg" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
