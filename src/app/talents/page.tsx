import Link from "next/link";
import { getServerApiBaseUrl, listProfiles } from "@/lib/api";
import {
  PROFILE_GRADES,
  PROFILE_STATUSES,
  STATUS_STYLES,
  initials,
  type ProfileView,
} from "@/lib/talents";
import AddUserForm from "./add-user-form";

export const dynamic = "force-dynamic";

export default async function TalentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";

  let profiles: ProfileView[] = [];
  let managers: ProfileView[] = [];
  let error: string | null = null;

  try {
    const base = getServerApiBaseUrl();
    const [all, filtered] = await Promise.all([
      listProfiles(base, ""),
      listProfiles(base, query),
    ]);
    managers = all;
    profiles = filtered;
  } catch (err) {
    error = err instanceof Error ? err.message : "Gagal mengambil data";
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-indigo-600">Tania</p>
        <h1 className="text-2xl font-bold text-zinc-900">Talent Profiles</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Profil otomatis terbentuk saat user dibuat — identitas, role, grade,
          squad, lokasi, status, dan manager.
        </p>
      </header>

      <section className="mb-8">
        <AddUserForm
          managers={managers.map((m) => ({ userId: m.userId, name: m.name }))}
          grades={[...PROFILE_GRADES]}
          statuses={[...PROFILE_STATUSES]}
        />
      </section>

      <form method="get" action="/talents" className="mb-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Cari nama, email, role, grade, squad, lokasi, status, manager…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Search
        </button>
        {query ? (
          <Link
            href="/talents"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          <p className="font-medium">Tidak dapat memuat data talent.</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-zinc-500">
            {query
              ? `${profiles.length} hasil untuk “${query}”`
              : `Menampilkan semua ${profiles.length} profil`}{" "}
            · total {managers.length}
          </p>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Squad</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Manager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {profiles.map((p) => (
                  <tr key={p.userId} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {p.employeeId}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/talents/${p.userId}`}
                        className="flex items-center gap-2 group"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                          {initials(p.name)}
                        </span>
                        <span className="font-medium text-zinc-900 group-hover:text-indigo-600 group-hover:underline">
                          {p.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{p.email}</td>
                    <td className="px-4 py-3 text-zinc-700">{p.role}</td>
                    <td className="px-4 py-3 text-zinc-700">{p.grade}</td>
                    <td className="px-4 py-3 text-zinc-700">{p.squad}</td>
                    <td className="px-4 py-3 text-zinc-700">{p.location}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[p.status] ?? "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {p.managerName ?? (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-zinc-500"
                    >
                      Tidak ada profil yang cocok dengan pencarian “{query}”.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
