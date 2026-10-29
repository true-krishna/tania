import { Card } from "@/components/Card";

export function RecentChangesCard() {
  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <h2 className="tp-h3">Perubahan terakhir</h2>
        <span className="tp-label">Jejak audit milik saya</span>
      </div>
      <p className="tp-empty mt-3">
        <strong>Belum tersedia</strong>
        Jejak audit mandiri menunggu kueri backend (TAN-387).
      </p>
    </Card>
  );
}
