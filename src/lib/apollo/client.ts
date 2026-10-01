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
 * Endpoint GraphQL backend. Dibaca dari `NEXT_PUBLIC_GRAPHQL_URL` (env browser,
 * lihat .env.example). Mengembalikan string kosong saat belum diset — dipakai
 * untuk menandai "belum ada GraphQL" saat build/prerender (env tidak disuntik);
 * saat runtime browser endpoint wajib terisi.
 */
export function getGraphqlEndpoint(): string {
  const url = process.env.NEXT_PUBLIC_GRAPHQL_URL;
  return url ? url.replace(/\/+$/, "") : "";
}

/**
 * Normalized cache dengan type policies yang selaras pada kontrak
 * `contracts/schema.graphql`. ID default memakai `id`; `Type`/enum tanpa `id`
 * memakai `__typename` keying. Pendekatan W0 — policy per-relasi ditambah saat
 * modul fitur (plan.md §7: normalized cache mengurangi request berulang).
 */
function createCache(): InMemoryCache {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Cursor pagination: keyArgs memisahkan cache per argumen query
          // (filter/period) sehingga paging tiap filter tidak saling menimpa.
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
 * Membuat ApolloClient untuk browser. Menyuntikkan access token dari
 * token-store (in-memory) ke header Authorization; saat sesi/refresh habis
 * (error auth dari server), sesi lokal dibersihkan. Wiring mutation
 * `refreshToken` menyusul pada modul auth (W8 hardening).
 */
export function createApolloClient(): ApolloClient<unknown> | null {
  const uri = getGraphqlEndpoint();
  // Tanpa endpoint (build/prerender) jangan bikin client — mencegah crash
  // saat env belum disuntik; runtime browser endpoint terisi via .env.local.
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