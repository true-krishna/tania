"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api";
import { LOCATIONS, ROLES, SQUADS, type CreateUserInput } from "@/lib/talents";

interface Props {
  managers: Array<{ userId: number; name: string }>;
  grades: string[];
  statuses: string[];
}

export default function AddUserForm({ managers, grades, statuses }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const apiBase = process.env.NEXT_PUBLIC_TANIA_API_URL?.replace(/\/+$/, "");
    if (!apiBase) {
      setError(
        "NEXT_PUBLIC_TANIA_API_URL environment variable is not set — see README"
      );
      setPending(false);
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload: CreateUserInput = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      role: form.get("role") ? String(form.get("role")) : undefined,
      grade: form.get("grade") ? String(form.get("grade")) : undefined,
      squad: form.get("squad") ? String(form.get("squad")) : undefined,
      location: form.get("location") ? String(form.get("location")) : undefined,
      status: form.get("status") ? String(form.get("status")) : undefined,
      managerId: form.get("managerId")
        ? Number(form.get("managerId"))
        : undefined,
    };

    try {
      const profile = await createUser(apiBase, payload);
      setSuccess(
        `User created — profile ${profile.employeeId} auto-generated.`
      );
      event.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach the server");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        + Add User
      </button>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";
  const labelClass = "mb-1 block text-xs font-medium text-zinc-600";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Add User</h2>
          <p className="text-xs text-zinc-500">
            Enter name and email only — the full profile is generated with
            default attributes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name *
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Full name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="name@tania.id"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="role" className={labelClass}>
            Role
          </label>
          <select id="role" name="role" className={inputClass} defaultValue="">
            <option value="">(default: Member)</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="grade" className={labelClass}>
            Grade
          </label>
          <select id="grade" name="grade" className={inputClass} defaultValue="">
            <option value="">(default: Junior)</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="squad" className={labelClass}>
            Squad
          </label>
          <select id="squad" name="squad" className={inputClass} defaultValue="">
            <option value="">(default: Unassigned)</option>
            {SQUADS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <select
            id="location"
            name="location"
            className={inputClass}
            defaultValue=""
          >
            <option value="">(default: Remote)</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select id="status" name="status" className={inputClass} defaultValue="">
            <option value="">(default: Active)</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="managerId" className={labelClass}>
            Manager
          </label>
          <select
            id="managerId"
            name="managerId"
            className={inputClass}
            defaultValue=""
          >
            <option value="">(no manager)</option>
            {managers.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="mt-3 text-sm text-emerald-600">{success}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Create User"}
      </button>
    </form>
  );
}
