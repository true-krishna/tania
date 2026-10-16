import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import EvaluationsLayout from "@/app/(app)/evaluations/layout";
import IdpLayout from "@/app/(app)/idp/layout";

// T032 (002-tania-rbac R2.3): selama modul IDP & evaluasi ditunda, rutenya
// ditutup untuk semua peran agar URL langsung tidak menampilkan modul yang
// servernya sendiri tolak (MODULE_UNAVAILABLE). Kode fiturnya tetap utuh —
// aktivasi (T084) cukup mengembalikan baris matriksnya bersama entri nav.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

beforeEach(() => {
  vi.mocked(notFound).mockClear();
});

describe("deferred module routes (T032)", () => {
  it("menutup /idp/* dengan notFound()", () => {
    expect(() => IdpLayout({ children: <main>konten</main> })).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("menutup /evaluations/* dengan notFound()", () => {
    expect(() => EvaluationsLayout({ children: <main>konten</main> })).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
