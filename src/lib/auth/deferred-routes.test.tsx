import { describe, expect, it, vi } from "vitest";
import EvaluationsLayout from "@/app/(app)/evaluations/layout";
import IdpLayout from "@/app/(app)/idp/layout";

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("next/navigation", () => ({ notFound }));

describe("deferred module routes (T032)", () => {
  it("renders 404 for /idp/*", () => {
    expect(() => IdpLayout({ children: null })).toThrow("NEXT_NOT_FOUND");
  });

  it("renders 404 for /evaluations/*", () => {
    expect(() => EvaluationsLayout({ children: null })).toThrow("NEXT_NOT_FOUND");
  });
});
