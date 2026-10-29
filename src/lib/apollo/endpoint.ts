/**
 * Backend GraphQL endpoint. Read from `NEXT_PUBLIC_GRAPHQL_URL` (browser env,
 * see .env.example). Returns an empty string when unset — used to flag "no
 * GraphQL" during build/prerender (env is not injected); at browser runtime
 * the endpoint must be set.
 */
export function getGraphqlEndpoint(): string {
  const url = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  return url ? url.replace(/\/+$/, "") : "";
}
