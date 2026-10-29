import type { ApolloError } from "@apollo/client";
import type { BulkAssignmentErrorCode, BulkMasterDataErrorCode } from "@/generated/graphql/types";

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
  "PRECONDITION_FAILED",
  "RATE_LIMITED",
  // Kode modul asisten (FR-13/FR-11). Dipisahkan dari RATE_LIMITED login agar
  // panel dapat memperlakukan penolakan kuota sebagai keadaan tersendiri.
  "CHAT_RATE_LIMITED",
  "CHAT_FAILED",
  "CHAT_NOT_CONFIGURED",
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
  PRECONDITION_FAILED: "Aturan bisnis belum terpenuhi.",
  RATE_LIMITED: "Terlalu banyak permintaan. Silakan coba lagi.",
  CHAT_RATE_LIMITED: "Batas pertanyaan per jam tercapai. Coba lagi nanti.",
  CHAT_FAILED: "Asisten gagal menjawab, coba lagi.",
  CHAT_NOT_CONFIGURED: "Asisten belum dikonfigurasi.",
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
    case "PRECONDITION_FAILED":
    case "RATE_LIMITED":
    case "CHAT_RATE_LIMITED":
    case "CHAT_FAILED":
    case "CHAT_NOT_CONFIGURED":
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

/**
 * Wait time the server attached to an assistant quota refusal (FR-13), from
 * `extensions.retryAfterSeconds`. Null when the error carries none, so the
 * caller can tell "the window ends in N seconds" from "unknown".
 */
export function errorRetryAfterSeconds(error: ApolloError | null | undefined): number | null {
  for (const gqlError of error?.graphQLErrors ?? []) {
    const seconds = Number(gqlError.extensions?.retryAfterSeconds);
    if (Number.isFinite(seconds) && seconds > 0) return seconds;
  }
  return null;
}

export function errorMessage(error: ApolloError | null | undefined, fallback: string): string {
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

/**
 * Pesan fallback Indonesia untuk kegagalan satu baris operasi massal
 * assignment (TAN-337) — `BulkAssignmentError.message` dari server sudah
 * berbahasa Indonesia dan ditampilkan apa adanya; label ini hanya dipakai
 * bila baris gagal tanpa pesan yang bisa dipakai.
 */
export const BULK_ASSIGNMENT_ERROR_LABEL: Record<BulkAssignmentErrorCode, string> = {
  OUT_OF_SCOPE: "Data tidak ditemukan atau di luar cakupan chapter Anda.",
  NOT_ASSIGNABLE: "Talent tidak aktif atau tidak assignable.",
  PROJECT_INACTIVE: "Project tidak aktif.",
  INVALID_PERIOD: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
  DUPLICATE_ACTIVE: "Talent sudah memiliki assignment aktif pada project tersebut.",
  NOT_ACTIVE: "Assignment sudah selesai dan tidak dapat diubah atau dihapus.",
  REFERENCED: "Assignment masih dirujuk data lain dan tidak dapat dihapus.",
  BATCH_LIMIT: "Melebihi batas 100 baris per operasi massal.",
  INVALID: "Input tidak valid.",
};

/**
 * Pesan fallback Indonesia untuk kegagalan satu baris operasi master data
 * massal (TAN-348) — `BulkMasterDataError.message` dari server sudah
 * berbahasa Indonesia dan ditampilkan apa adanya; label ini hanya dipakai
 * bila baris gagal tanpa pesan yang bisa dipakai.
 */
export const BULK_MASTER_DATA_ERROR_LABEL: Record<BulkMasterDataErrorCode, string> = {
  CONFLICT: "Nilai sudah dipakai entri lain.",
  REF_NOT_FOUND: "Referensi tidak ditemukan.",
  REF_INACTIVE: "Referensi nonaktif.",
  REF_AMBIGUOUS: "Nilai referensi dipakai lebih dari satu entitas aktif.",
  BATCH_LIMIT: "Melebihi batas 100 baris per operasi massal.",
  INVALID: "Input tidak valid.",
  REFERENCED: "Entri masih direferensikan data lain dan tidak dapat dinonaktifkan.",
};

export type SubmitError = { field: string | null; message: string };

/**
 * Maps a failed mutation to a form error. `extensions.field` targets a form
 * field (BAD_USER_INPUT); CONFLICT has no field on the wire, so the caller
 * supplies the clear per-form message naming its uniqueness constraints.
 */
export function mapSubmitError(
  error: ApolloError | null | undefined,
  conflictMessage: string,
  fallback: string,
): SubmitError {
  if (graphQLErrorCode(error) === "CONFLICT") {
    return { field: null, message: conflictMessage };
  }
  return { field: errorField(error), message: errorMessage(error, fallback) };
}

/**
 * Pesan per field untuk penolakan `BAD_USER_INPUT` dari usecase assignment
 * (domain.Invalid): server mengirim `extensions.field` — alasannya berbahasa
 * Inggris di kawat ("invalid periodEnd: must not precede periodStart"), jadi
 * klien memetakan field → pesan Indonesia (plan.md §Data Layer).
 */
const ASSIGNMENT_FIELD_MESSAGES: Record<string, string> = {
  periodEnd: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
  employeeId: "Talent harus karyawan aktif dan assignable.",
};

/**
 * Pesan aksi untuk penolakan server form buat/ubah assignment (G5/K4). Pesan
 * server untuk kode-kode ini berbahasa Inggris di kawat (mis. `ErrConflict`
 * = "resource already exists"), jadi pesan Indonesia diturunkan dari kode —
 * bukan dari teks server. NOT_FOUND di sini juga menutup penolakan lintas
 * cakupan chapter (server sengaja tidak membocorkan keberadaan data).
 */
const ASSIGNMENT_CODE_MESSAGES: Partial<Record<ErrorCode, string>> = {
  CONFLICT: "Talent ini sudah memiliki assignment aktif pada project tersebut.",
  FORBIDDEN: "Anda tidak memiliki izin untuk aksi ini.",
  NOT_FOUND: "Data tidak ditemukan atau di luar cakupan chapter Anda.",
  PRECONDITION_FAILED: "Assignment sudah selesai dan tidak dapat diubah.",
};

/**
 * Memetakan penolakan mutasi assignment (buat & ubah) ke `SubmitError`:
 * `BAD_USER_INPUT` → error per field bila field dikenali, `CONFLICT` /
 * `FORBIDDEN` / `NOT_FOUND` / `PRECONDITION_FAILED` → pesan aksi Indonesia;
 * kode lain tetap memakai label kodenya dan error tanpa kode memakai pesan
 * server/fallback (konstitusi §IX — tanpa swallowed error).
 */
export function mapAssignmentSubmitError(
  error: ApolloError | null | undefined,
  fallback: string,
): SubmitError {
  const code = graphQLErrorCode(error);
  if (code === "BAD_USER_INPUT") {
    const field = errorField(error);
    if (field && ASSIGNMENT_FIELD_MESSAGES[field]) {
      return { field, message: ASSIGNMENT_FIELD_MESSAGES[field] };
    }
    return { field: null, message: ERROR_LABEL.BAD_USER_INPUT };
  }
  const message = code
    ? (ASSIGNMENT_CODE_MESSAGES[code] ?? ERROR_LABEL[code])
    : errorMessage(error, fallback);
  return { field: null, message };
}
