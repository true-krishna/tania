"use client";

import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

/**
 * Placeholder for the activity-capture surface (US1 form). Added so the
 * `Aktivitas saya` nav entry resolves; the form itself is not part of TAN-125.
 */
export default function ActivitiesPage() {
  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Aktivitas saya"
        subtitle="Catat aktivitas kerja dan pelatihan yang menjadi sumber angka workload."
      />
      <Card className="max-w-2xl">
        <p className="text-sm text-zinc-600">
          Form pencatatan aktivitas belum tersedia di slice ini. Halaman ini disiapkan sebagai
          tujuan navigasi; isian aktivitas akan menyusul pada pekerjaan US1.
        </p>
      </Card>
    </section>
  );
}
