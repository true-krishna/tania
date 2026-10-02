import { print } from "graphql";
import { RefreshSessionDocument, type AuthSessionFragment } from "@/generated/graphql";
import { getGraphqlEndpoint } from "@/lib/apollo/endpoint";

/**
 * Rehydrate an expired access token by calling `refreshSession` against the
 * backend. Used by the Apollo error link (src/lib/apollo/client.ts) so an
 * expired access token is silently replaced before the original request is
 * retried. Throws when the refresh fails (invalid/expired refresh token),
 * which leads the link to clear the session and force sign-in again.
 */
export async function refreshSessionToken(
  refreshToken: string
): Promise<AuthSessionFragment> {
  const uri = getGraphqlEndpoint();
  if (!uri) throw new Error("GraphQL endpoint is not configured.");

  const query = print(RefreshSessionDocument);
  const res = await fetch(uri, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { refreshToken },
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    data?: { refreshSession?: AuthSessionFragment | null };
    errors?: Array<{ message: string }>;
  } | null;

  if (!res.ok || !json?.data?.refreshSession) {
    const message = json?.errors?.[0]?.message ?? `refreshSession failed (${res.status})`;
    throw new Error(message);
  }

  return json.data.refreshSession;
}