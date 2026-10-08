// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const h = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
  role: { current: "CHAPTER" as string | null },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.params,
  useRouter: () => ({ replace: h.replace, push: vi.fn() }),
}));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => h.role.current,
}));

import { DEFAULT_PERIOD_ID, WORKLOAD_PERIODS } from "./mocks";
import { WorkloadPageView } from "./WorkloadPageView";

beforeEach(() => {
  h.params = new URLSearchParams();
  h.role.current = "CHAPTER";
  h.replace.mockReset();
});

describe("WorkloadPageView — role-adaptive landing (SC-003 / US4)", () => {
  it("lands CHAPTER on the chapter list and offers the own view as a second tab", async () => {
    render(<WorkloadPageView />);

    expect(screen.getByRole("tab", { name: "Chapter saya" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Workload saya" })).toBeInTheDocument();
    expect(await screen.findByText("Talent dalam Chapter DPS")).toBeInTheDocument();
    // Highest load first, overload visible on the row (SC-003).
    expect(screen.getByText("Rani Puspita")).toBeInTheDocument();
    expect(screen.getAllByText("128%").length).toBeGreaterThan(0);
  });

  it("switches to the own view and renders only server-provided figures", async () => {
    render(<WorkloadPageView />);
    await screen.findByText("Talent dalam Chapter DPS");

    fireEvent.click(screen.getByRole("tab", { name: "Workload saya" }));

    expect(await screen.findByText("Beban kerja periode ini")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("36 dari 40 jam kapasitas terisi")).toBeInTheDocument();
    expect(screen.getByText("Bekerja 78%")).toBeInTheDocument();
  });

  it("gives TALENT the own view with no tab bar", async () => {
    h.role.current = "TALENT";
    render(<WorkloadPageView />);

    expect(await screen.findByText("Beban kerja periode ini")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("lands ORGANISATION roles on the distribution with dimension tabs", async () => {
    h.role.current = "OPERATION";
    render(<WorkloadPageView />);

    expect(await screen.findByText("Distribusi beban")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Distribusi organisasi" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Unit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat talent Chapter DPS" })).toBeInTheDocument();
  });

  it("keeps the period as an opaque id in the URL", async () => {
    render(<WorkloadPageView />);
    await screen.findByText("Talent dalam Chapter DPS");

    fireEvent.change(screen.getByLabelText("Pilih periode workload"), {
      target: { value: WORKLOAD_PERIODS[1].id },
    });

    expect(h.replace).toHaveBeenCalledWith(`/workload?period=${WORKLOAD_PERIODS[1].id}`);
    expect(h.params.get("period")).toBeNull();
  });
});

describe("WorkloadPageView — state matrix (design §6)", () => {
  it("shows the loading skeleton before the period resolves", () => {
    render(<WorkloadPageView />);
    expect(screen.getByText("Memuat data workload…")).toBeInTheDocument();
  });

  it("renders the no-data empty state without inventing a zero", async () => {
    h.params.set("period", "prd_7c04");
    render(<WorkloadPageView />);

    expect(await screen.findByText("Belum ada data workload untuk periode ini.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Catat aktivitas/ })).toBeInTheDocument();
  });

  it("keeps last-known figures and flags them stale when the source is unavailable", async () => {
    h.params.set("period", "prd_6b93");
    render(<WorkloadPageView />);

    expect(await screen.findByText("Tidak dapat menghubungi sumber data WAD.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
    // Last-known chapter figures are still rendered.
    expect(screen.getByText("Talent dalam Chapter DPS")).toBeInTheDocument();
  });

  it("marks a stale period with the `Data lama` chip", async () => {
    h.params.set("period", "prd_5a12");
    render(<WorkloadPageView />);

    expect(await screen.findByText(/Data lama — terakhir diperbarui/)).toBeInTheDocument();
    expect(screen.getAllByText("Data lama").length).toBeGreaterThan(0);
  });

  it("treats an undefined split as incomplete rather than zero", async () => {
    h.params.set("period", "prd_49d7");
    h.role.current = "TALENT";
    render(<WorkloadPageView />);

    expect(await screen.findByText("Beban kerja periode ini")).toBeInTheDocument();
    expect(screen.getByText("Data tidak lengkap", { selector: "span" })).toBeInTheDocument();
    expect(
      screen.getByText(/rincian alokasi aktivitas belum tersedia/),
    ).toBeInTheDocument();
  });

  it("explains the missing TMS link instead of showing figures", async () => {
    h.params.set("period", "prd_3870");
    h.role.current = "TALENT";
    render(<WorkloadPageView />);

    expect(await screen.findByText("Anda belum terhubung ke TMS.")).toBeInTheDocument();
  });

  it("shows the hard-error card with a retry for an unloadable period", async () => {
    h.params.set("period", "prd_26e5");
    render(<WorkloadPageView />);

    expect(await screen.findByText("Data workload tidak dapat dimuat.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });

  it("falls back to the default period for an unknown period id", async () => {
    h.params.set("period", "not-a-period");
    render(<WorkloadPageView />);

    expect(await screen.findByText("Talent dalam Chapter DPS")).toBeInTheDocument();
    expect(screen.getByLabelText("Pilih periode workload")).toHaveValue(DEFAULT_PERIOD_ID);
  });
});
