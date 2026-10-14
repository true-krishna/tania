import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  Observable,
  type ObservableSubscription,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { clearSession, getSession, setSession } from "@/lib/auth/token-store";
import { refreshSessionToken } from "@/lib/auth/refresh";
import { notifySessionExpired } from "@/lib/auth/session-expiry";
import { getGraphqlEndpoint } from "@/lib/apollo/endpoint";

/**
 * Normalized cache with type policies aligned to the served schema contract.
 * Default ID uses `id`; `Type`/enums without `id` use `__typename` keying.
 * W0 approach — per-relation policies are added with feature modules
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
 * token-store (cookie-backed) into the Authorization header.
 *
 * On an auth error (expired/invalid access token) the error link tries to
 * rehydrate the session once via `refreshSession` and retries the original
 * request with the fresh token. Only when the refresh itself fails is the
 * local session cleared (forcing sign-in again) and the app routed to /login
 * (session-expiry listener, src/app/(app)/layout.tsx).
 */
export function createApolloClient(): ApolloClient<unknown> {
  const uri = getGraphqlEndpoint();
  // No endpoint (build/prerender/local-only): still build a client so the
  // provider always mounts and Apollo hooks never lose their context. SSR is
  // non-networking (ssrMode) and the browser reads .env.local for the URI.
  const httpLink = createHttpLink({ uri: uri || "" });

  const authLink = setContext((_, { headers = {} }) => {
    const token = getSession()?.accessToken;
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    const isAuthError =
      networkError?.message.includes("401") ||
      graphQLErrors?.some(
        (e) => e.extensions?.code === "UNAUTHENTICATED" || e.extensions?.code === "UNAUTHORIZED"
      );

    if (!isAuthError) return;

    const session = getSession();
    if (!session?.refreshToken) {
      clearSession();
      notifySessionExpired();
      return;
    }

    // Retry the original operation once, after refreshing the session. The
    // `forward(operation)` re-runs the chain from `authLink`, which reads the
    // fresh access token from the updated cookie.
    return new Observable((subscriber) => {
      let inner: ObservableSubscription | undefined;

      refreshSessionToken(session.refreshToken)
        .then((next) => {
          setSession({
            accessToken: next.accessToken,
            accessTokenExpiresAt: next.accessTokenExpiresAt,
            refreshToken: next.refreshToken,
            refreshTokenExpiresAt: next.refreshTokenExpiresAt,
            accessRole: next.user.accessRole,
            fullName: next.user.fullName,
            email: next.user.email,
          });
          inner = forward(operation).subscribe(subscriber);
        })
        .catch(() => {
          clearSession();
          notifySessionExpired();
          if (!subscriber.closed) {
            subscriber.error(new Error("Session expired. Please sign in again."));
          }
        });

      return () => inner?.unsubscribe();
    });
  });

  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: createCache(),
    devtools: { enabled: typeof window !== "undefined" },
  });
}