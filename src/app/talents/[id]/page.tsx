import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfileById, getServerApiBaseUrl } from "@/lib/api";
import { initials, type ProfileView } from "@/lib/talents";

export const dynamic = "force-dynamic";

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);

  let profile: ProfileView | null = null;
  let error: string | null = null;
  if (Number.isInteger(userId) && userId > 0) {
    try {
      profile = await getProfileById(getServerApiBaseUrl(), userId);
    } catch (err) {
      error = err instanceof Error ? err.message : "Gagal mengambil data";
    }
  }
  if (!profile && !error) notFound();

  const attributes = profile
    ? [
        { label: "Employee ID", value: profile.employeeId },
        { label: "Email", value: profile.email },
        { label: "Role", value: profile.role },
        { label: "Grade", value: profile.grade },
        { label: "Squad", value: profile.squad },
        { label: "Location", value: profile.location },
        { label: "Status", value: profile.status },
        { label: "Manager", value: profile.managerName ?? "—" },
        { label: "Dibuat", value: profile.createdAt },
      ]
    : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/talents" className="text-sm text-indigo-600 hover:underline">
        ← Kembali ke daftar talent
      </Link>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          <p className="font-medium">Tidak dapat memuat profil.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : (
        profile && (
          <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700">
                {initials(profile.name)}
              </span>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">
                  {profile.name}
                </h1>
                <p className="text-sm text-zinc-500">
                  {profile.role} · {profile.squad}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {attributes.map((attr) => (
                <div key={attr.label} className="rounded-lg bg-zinc-50 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {attr.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                    {attr.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )
      )}
    </main>
  );
}
