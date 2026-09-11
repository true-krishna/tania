import type { CreateUserInput, ProfileView } from "./talents";

/**
 * Thin client for the external Talent Profile API.
 *
 * The API base URL is configured via environment variables (see .env.example):
 *  - `TANIA_API_URL` for server-rendered pages
 *  - `NEXT_PUBLIC_TANIA_API_URL` for the client-side "Add User" form
 *
 * The backend that serves these endpoints is intentionally out of scope for
 * this repo (e.g. an external service backed by SQLite or anything else).
 * This module only describes the contract the frontend expects:
 *   GET  /profiles?q=      -> { query, count, profiles: ProfileView[] }
 *   GET  /profiles/:id     -> { profile: ProfileView } | 404
 *   POST /users            -> { profile: ProfileView } | 400/409/500
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function getServerApiBaseUrl(): string {
  const url = process.env.TANIA_API_URL;
  if (!url) {
    throw new ApiError(
      500,
      "TANIA_API_URL environment variable is not set — see README"
    );
  }
  return url.replace(/\/+$/, "");
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // keep the status fallback
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export async function listProfiles(
  base: string,
  query = ""
): Promise<ProfileView[]> {
  const trimmed = query.trim();
  const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
  const res = await fetch(`${base}/profiles${qs}`);
  const data = await parseResponse<{ profiles: ProfileView[] }>(res);
  return data.profiles;
}

export async function getProfileById(
  base: string,
  id: number
): Promise<ProfileView | null> {
  const res = await fetch(`${base}/profiles/${id}`);
  if (res.status === 404) return null;
  const data = await parseResponse<{ profile: ProfileView }>(res);
  return data.profile;
}

export async function createUser(
  base: string,
  input: CreateUserInput
): Promise<ProfileView> {
  const res = await fetch(`${base}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseResponse<{ profile: ProfileView }>(res);
  return data.profile;
}
