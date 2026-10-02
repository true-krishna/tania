import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { clearSession, getSession } from "@/lib/auth/token-store";

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

/**
 * Normalized cache with type policies aligned to the `contracts/schema.graphql`
 * contract. Default ID uses `id`; `Type`/enums without `id` use `__typename`
 * keying. W0 approach — per-relation policies are added with feature modules
 * (plan.md §7: normalized cache reduces duplicate requests).
 */
function createCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Cursor pagination: keyArgs separates cache per query argument
          // (filter/period) so paging per filter does not overwrite.
          employees: { keyArgs: ["filter"] },
          assignments: { keyArgs: ["filter"] },
          idps: { keyArgs: ["filter"] },
          performanceEvaluations: { keyArgs: ["periodId", "employeeId"] },
        },
      },
      EmployeeConnection: { merge: false },
      IdpConnection: { merge: false },
      AssignmentConnection: { merge: false },
      PerformanceEvaluationConnection: { merge: false },
    },
  });
}

/**
 * Creates the browser ApolloClient. Injects the access token from the
 * token-store (cookie-backed) into the Authorization header; when the session
 * expires (auth error from the server) the local session is cleared. The
 * `refreshToken` mutation wiring lands with the auth module (W8 hardening).
 */
export function createApolloClient(): ApolloClient<unknown> | null {
  const uri = getGraphqlEndpoint();
  // No endpoint (build/prerender): do not create the client — prevents a
  // crash when env is not injected; browser runtime reads .env.local.
  if (!uri) return null;

  const httpLink = createHttpLink({ uri });

  const authLink = setContext((_, { headers = {} }) => {
    const token = getSession()?.accessToken;
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    const isAuthError =
      networkError?.message.includes("401") ||
      graphQLErrors?.some(
        (e) => e.extensions?.code === "FORBIDDEN" || e.extensions?.code === "UNAUTHORIZED"
      );

    if (isAuthError) {
      clearSession();
    }
  });

  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: createCache(),
    connectToDevTools: typeof window !== "undefined",
  });
}