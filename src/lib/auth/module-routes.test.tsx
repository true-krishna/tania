import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import EvaluationsLayout from "@/app/(app)/evaluations/layout";
import IdpLayout from "@/app/(app)/idp/layout";

// 2026-10-16 (klarifikasi 9): IDP & evaluasi aktif, jadi rutenya terbuka untuk
// semua peran dan authorization-nya pindah ke dalam halaman + server (FR-15/16).
// `isModuleOpen` tetap jadi satu-satunya saklar rute, sehingga penundaan di masa
// depan cukup mengosongkan baris matriksnya lagi.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("modul yang aktif (klarifikasi 9)", () => {
  it("membiarkan /idp/* melewati layout", () => {
    expect(() => IdpLayout({ children: <main>konten</main> })).not.toThrow();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("membiarkan /evaluations/* melewati layout", () => {
    expect(() => EvaluationsLayout({ children: <main>konten</main> })).not.toThrow();
    expect(notFound).not.toHaveBeenCalled();
  });
});
