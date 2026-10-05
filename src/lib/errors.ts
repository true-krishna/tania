import type { ApolloError } from "@apollo/client";

/**
 * `extensions.code` values the served backend returns (contracts/api-conventions.md §3).
 * The client maps UI behavior from these codes, never from message text — the
 * GraphQL `message` is the Indonesian server message that is shown verbatim.
 *
 * The mapping table is the single source of truth for plan.md §Data Layer
 * ("extensions.code → perilaku UI") and constitution §IX (fail visibly).
 */
export const ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BAD_USER_INPUT",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * Fallback Indonesian action message per code, used when an operation fails
 * without a usable server message (plan.md §Data Layer: CONFLICT / RATE_LIMITED
 * / INTERNAL → pesan aksi).
 */
export const ERROR_LABEL: Record<ErrorCode, string> = {
  UNAUTHENTICATED: "Sesi Anda berakhir. Silakan masuk kembali.",
  FORBIDDEN: "Akses ditolak.",
  NOT_FOUND: "Data tidak ditemukan.",
  BAD_USER_INPUT: "Input tidak valid.",
  CONFLICT: "Data sudah ada atau bertentangan.",
  RATE_LIMITED: "Terlalu banyak permintaan. Silakan coba lagi.",
  INTERNAL: "Terjadi kesalahan. Silakan coba lagi.",
};

/**
 * The UI action a `code` should trigger (plan.md §Data Layer):
 * - `session-expired` → kontrol logout / arahkan ke login (UNAUTHENTICATED)
 * - `forbidden`       → halaman/keadaan "akses ditolak" (FORBIDDEN)
 * - `not-found`       → tampilkan empty/404 (NOT_FOUND)
 * - `field`           → error per field, saat field diketahui (BAD_USER_INPUT)
 * - `action`          → pesan aksi umum (CONFLICT / RATE_LIMITED / INTERNAL)
 */
export type ErrorBehavior =
  | { kind: "session-expired" }
  | { kind: "forbidden" }
  | { kind: "not-found" }
  | { kind: "field"; field: string | null }
  | { kind: "action" };

export function mapErrorBehavior(code: ErrorCode): ErrorBehavior {
  switch (code) {
    case "UNAUTHENTICATED":
      return { kind: "session-expired" };
    case "FORBIDDEN":
      return { kind: "forbidden" };
    case "NOT_FOUND":
      return { kind: "not-found" };
    case "BAD_USER_INPUT":
      return { kind: "field", field: null };
    case "CONFLICT":
    case "RATE_LIMITED":
    case "INTERNAL":
      return { kind: "action" };
  }
}

/**
 * First recognized `extensions.code` on an Apollo error, or null when the error
 * is not a GraphQL error with a known code.
 */
export function graphQLErrorCode(error: ApolloError | null | undefined): ErrorCode | null {
  for (const gqlError of error?.graphQLErrors ?? []) {
    const code = gqlError.extensions?.code;
    if (typeof code === "string" && (ERROR_CODES as readonly string[]).includes(code)) {
      return code as ErrorCode;
    }
  }
  return null;
}

/** First `extensions.field` on a BAD_USER_INPUT error, if the server sent one. */
export function errorField(error: ApolloError | null | undefined): string | null {
  for (const gqlError of error?.graphQLErrors ?? []) {
    const field = gqlError.extensions?.field;
    if (typeof field === "string" && field) return field;
  }
  return null;
}

export function errorMessage(
  error: ApolloError | null | undefined,
  fallback: string
): string {
  const code = graphQLErrorCode(error);
  const serverMessage = error?.graphQLErrors[0]?.message;
  if (code) {
    // Prefer the server's (Indonesian) message, falling back to the code label.
    return serverMessage || ERROR_LABEL[code];
  }
  // Non-code GraphQL error (e.g. legacy message-only) or plain error message.
  if (serverMessage) return serverMessage;
  // Network failure with no GraphQL payload — show the caller fallback, never
  // leak the raw transport detail (constitution §IX).
  return fallback;
}