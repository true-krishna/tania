import { redirect } from "next/navigation";

/**
 * Amandemen penempatan (2026-10-12, keputusan pemilik produk, TAN-154):
 * konten Laporan Talent menggantikan konten Dashboard untuk Operation &
 * Chapter, dan entri nav "Laporan Talent" dihapus. Rute `/reports/talent`
 * hanya dibiarkan sebagai redirect agar bookmark lama tidak mati.
 */
export default function TalentReportPage() {
  redirect("/dashboard");
}
