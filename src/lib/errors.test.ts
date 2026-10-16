import { describe, expect, it } from "vitest";
import { ApolloError } from "@apollo/client";
import {
  ERROR_LABEL,
  errorField,
  errorMessage,
  errorRetryAfterSeconds,
  graphQLErrorCode,
  mapErrorBehavior,
  type ErrorBehavior,
  type ErrorCode,
} from "./errors";

/** Build an ApolloError whose first GraphQL error has the given code/field. */
function gqlError(code?: string, field?: string, message?: string): ApolloError {
  return new ApolloError({
    graphQLErrors: [
      {
        message: message ?? "pesan server",
        path: ["foo"],
        extensions: {
          ...(code ? { code } : {}),
          ...(field ? { field } : {}),
        },
      },
    ],
  });
}

describe("mapErrorBehavior", () => {
  it.each<[ErrorCode, ErrorBehavior["kind"]]>([
    ["UNAUTHENTICATED", "session-expired"],
    ["FORBIDDEN", "forbidden"],
    ["NOT_FOUND", "not-found"],
    ["BAD_USER_INPUT", "field"],
    ["CONFLICT", "action"],
    ["RATE_LIMITED", "action"],
    ["CHAT_RATE_LIMITED", "action"],
    ["CHAT_FAILED", "action"],
    ["CHAT_NOT_CONFIGURED", "action"],
    ["INTERNAL", "action"],
  ])("%s → %s", (code, kind) => {
    expect(mapErrorBehavior(code).kind).toBe(kind);
  });

  it("BAD_USER_INPUT carries the offending field", () => {
    expect(mapErrorBehavior("BAD_USER_INPUT")).toEqual({ kind: "field", field: null });
  });
});

describe("graphQLErrorCode", () => {
  it("extracts the first known code", () => {
    expect(graphQLErrorCode(gqlError("FORBIDDEN"))).toBe("FORBIDDEN");
  });

  it("returns null for an unknown code", () => {
    expect(graphQLErrorCode(gqlError("SOMETHING_NEW"))).toBeNull();
  });

  it("returns null for a network/empty error", () => {
    expect(graphQLErrorCode(new ApolloError({ networkError: new Error("boom") }))).toBeNull();
    expect(graphQLErrorCode(null)).toBeNull();
  });
});

describe("errorField", () => {
  it("returns the field attached to a BAD_USER_INPUT error", () => {
    expect(errorField(gqlError("BAD_USER_INPUT", "email"))).toBe("email");
  });

  it("returns null when no field is attached", () => {
    expect(errorField(gqlError("BAD_USER_INPUT"))).toBeNull();
  });
});

describe("errorRetryAfterSeconds", () => {
  it("reads the assistant quota wait time off the refusal (FR-13)", () => {
    const err = new ApolloError({
      graphQLErrors: [
        {
          message: "kuota asisten tercapai. Coba lagi dalam 12 menit.",
          path: ["sendChatMessage"],
          extensions: { code: "CHAT_RATE_LIMITED", retryAfterSeconds: 720 },
        },
      ],
    });
    expect(graphQLErrorCode(err)).toBe("CHAT_RATE_LIMITED");
    expect(errorMessage(err, "bawah")).toBe("kuota asisten tercapai. Coba lagi dalam 12 menit.");
    expect(errorRetryAfterSeconds(err)).toBe(720);
  });

  it("returns null when no wait time is attached", () => {
    expect(errorRetryAfterSeconds(gqlError("CHAT_RATE_LIMITED"))).toBeNull();
    expect(errorRetryAfterSeconds(null)).toBeNull();
  });
});

describe("errorMessage", () => {
  it("prefers the server message when the code is known", () => {
    expect(errorMessage(gqlError("CONFLICT", undefined, "Email sudah terdaftar."), "Terjadi kesalahan.")).toBe(
      "Email sudah terdaftar."
    );
  });

  it("falls back to the code label when the server message is absent", () => {
    const err = new ApolloError({
      graphQLErrors: [{ message: "", path: ["x"], extensions: { code: "UNAUTHENTICATED" } }],
    });
    expect(errorMessage(err, "bawah")).toBe(ERROR_LABEL.UNAUTHENTICATED);
  });

  it("falls back to the plain error message when the code is unknown", () => {
    expect(errorMessage(gqlError("SOMETHING_NEW", undefined, "FORBIDDEN"), "bawah")).toBe("FORBIDDEN");
  });

  it("falls back to the caller fallback for a network error", () => {
    const err = new ApolloError({ networkError: new Error("boom") });
    expect(errorMessage(err, "bawah")).toBe("bawah");
  });
});