// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import EvaluationPeriodsPage from "@/app/(app)/evaluations/periods/page";
import EvaluationTemplatesPage from "@/app/(app)/evaluations/templates/page";
import {
  CreateEvaluationPeriodDocument,
  CreateEvaluationTemplateDocument,
  EvaluationPeriodsDocument,
  EvaluationTemplatesDocument,
} from "@/generated/graphql";
import { ToastProvider } from "@/components/Toast";

const nav = vi.hoisted(() => ({ push: vi.fn(), redirect: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  redirect: (url: string): never => {
    nav.redirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

const templateNode = {
  __typename: "EvaluationTemplate",
  id: "tpl-1",
  name: "Framework Performa",
  isActive: true,
  criteria: [],
  createdAt: "2025-01-01T00:00:00Z",
};

const periodsData = [
  {
    __typename: "EvaluationPeriod",
    id: "period-1",
    name: "Q3 2025",
    startDate: "2025-07-01",
    endDate: "2025-09-30",
    state: "RUNNING",
    isActive: true,
    template: { __typename: "EvaluationTemplate", id: "tpl-1", name: "Framework Performa" },
  },
];

describe("EvaluationPeriodsPage — create modal", () => {
  it("membuka modal create dengan form kosong", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: EvaluationPeriodsDocument, variables: { includeInactive: true } },
            result: { data: { evaluationPeriods: periodsData } },
          },
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateNode] } },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationPeriodsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Q3 2025")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /buat periode/i }));

    expect(screen.getByRole("dialog", { name: "Buat Periode Evaluasi" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Nama Periode")).toHaveValue("");
    expect(screen.getByLabelText("Template Evaluasi")).toHaveValue("");
    expect(screen.getByLabelText("Tanggal Mulai")).toHaveValue("");
    expect(screen.getByLabelText("Tanggal Selesai")).toHaveValue("");
  });

  it("menutup modal dengan tombol batal", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: EvaluationPeriodsDocument, variables: { includeInactive: true } },
            result: { data: { evaluationPeriods: periodsData } },
          },
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateNode] } },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationPeriodsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("Q3 2025");
    fireEvent.click(screen.getByRole("button", { name: /buat periode/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Batal" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("menampilkan error validasi di dalam modal", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: EvaluationPeriodsDocument, variables: { includeInactive: true } },
            result: { data: { evaluationPeriods: periodsData } },
          },
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateNode] } },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationPeriodsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("Q3 2025");
    fireEvent.click(screen.getByRole("button", { name: /buat periode/i }));
    const submit = await screen.findByRole("button", { name: "Simpan" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    expect(await screen.findByText("Nama periode wajib diisi.")).toBeInTheDocument();
    expect(screen.getByText("Template evaluasi wajib dipilih.")).toBeInTheDocument();
    expect(screen.getByText("Tanggal mulai wajib diisi.")).toBeInTheDocument();
    expect(screen.getByText("Tanggal selesai wajib diisi.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("submit berhasil menutup modal dan me-refresh daftar", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: EvaluationPeriodsDocument, variables: { includeInactive: true } },
            result: { data: { evaluationPeriods: periodsData } },
          },
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateNode] } },
          },
          {
            request: {
              query: CreateEvaluationPeriodDocument,
              variables: {
                input: {
                  name: "Q4 2025",
                  templateId: "tpl-1",
                  startDate: "2025-10-01",
                  endDate: "2025-12-31",
                },
              },
            },
            result: {
              data: {
                createEvaluationPeriod: {
                  __typename: "EvaluationPeriod",
                  id: "period-2",
                  name: "Q4 2025",
                  startDate: "2025-10-01",
                  endDate: "2025-12-31",
                  state: "DRAFT",
                  isActive: true,
                  template: {
                    __typename: "EvaluationTemplate",
                    id: "tpl-1",
                    name: "Framework Performa",
                  },
                },
              },
            },
          },
          {
            request: { query: EvaluationPeriodsDocument, variables: { includeInactive: true } },
            result: {
              data: {
                evaluationPeriods: [
                  ...periodsData,
                  {
                    ...periodsData[0],
                    id: "period-2",
                    name: "Q4 2025",
                    startDate: "2025-10-01",
                    endDate: "2025-12-31",
                  },
                ],
              },
            },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationPeriodsPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("Q3 2025");
    fireEvent.click(screen.getByRole("button", { name: /buat periode/i }));

    fireEvent.change(await screen.findByLabelText("Nama Periode"), {
      target: { value: "Q4 2025" },
    });
    fireEvent.change(screen.getByLabelText("Template Evaluasi"), {
      target: { value: "tpl-1" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal Mulai"), {
      target: { value: "2025-10-01" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal Selesai"), {
      target: { value: "2025-12-31" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText(/berhasil dibuat/i)).toBeInTheDocument();
    expect(await screen.findByText("Q4 2025")).toBeInTheDocument();
  });
});

describe("EvaluationTemplatesPage — create modal", () => {
  const templateWithCriteria = {
    ...templateNode,
    criteria: [
      {
        __typename: "EvaluationCriterion",
        id: "crit-1",
        label: "Prestasi",
        answerType: "SCALE_1_5",
        position: 1,
      },
    ],
  };

  it("membuka modal create dengan form kosong", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateWithCriteria] } },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationTemplatesPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Framework Performa")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /buat template/i }));

    expect(screen.getByRole("dialog", { name: "Buat Template Evaluasi" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nama Template")).toHaveValue("");
    expect(screen.getByPlaceholderText("Label kriteria")).toHaveValue("");
  });

  it("menutup modal dengan tombol batal", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateWithCriteria] } },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationTemplatesPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("Framework Performa");
    fireEvent.click(screen.getByRole("button", { name: /buat template/i }));
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("menampilkan error validasi di dalam modal", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateWithCriteria] } },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationTemplatesPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("Framework Performa");
    fireEvent.click(screen.getByRole("button", { name: /buat template/i }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText("Nama template wajib diisi.")).toBeInTheDocument();
    expect(screen.getByText("Setiap kriteria wajib memiliki label.")).toBeInTheDocument();
  });

  it("menambah kriteria lalu submit berhasil", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateWithCriteria] } },
          },
          {
            request: {
              query: CreateEvaluationTemplateDocument,
              variables: {
                input: {
                  name: "Template Baru",
                  criteria: [
                    { label: "Kualitas", answerType: "SCALE_1_5", position: 1 },
                    { label: "Kecepatan", answerType: "SCALE_1_10", position: 2 },
                  ],
                },
              },
            },
            result: {
              data: {
                createEvaluationTemplate: {
                  __typename: "EvaluationTemplate",
                  id: "tpl-2",
                  name: "Template Baru",
                  isActive: true,
                  criteria: [
                    {
                      __typename: "EvaluationCriterion",
                      id: "crit-1",
                      label: "Kualitas",
                      answerType: "SCALE_1_5",
                      position: 1,
                    },
                    {
                      __typename: "EvaluationCriterion",
                      id: "crit-2",
                      label: "Kecepatan",
                      answerType: "SCALE_1_10",
                      position: 2,
                    },
                  ],
                },
              },
            },
          },
          {
            request: { query: EvaluationTemplatesDocument, variables: { includeInactive: true } },
            result: { data: { evaluationTemplates: [templateWithCriteria] } },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationTemplatesPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("Framework Performa");
    fireEvent.click(screen.getByRole("button", { name: /buat template/i }));

    fireEvent.change(screen.getByLabelText("Nama Template"), {
      target: { value: "Template Baru" },
    });
    fireEvent.change(screen.getByPlaceholderText("Label kriteria"), {
      target: { value: "Kualitas" },
    });

    fireEvent.click(screen.getByRole("button", { name: /tambah kriteria/i }));
    const criterionInputs = screen.getAllByPlaceholderText("Label kriteria");
    expect(criterionInputs).toHaveLength(2);
    fireEvent.change(criterionInputs[1], { target: { value: "Kecepatan" } });

    const secondRow = criterionInputs[1].closest("div.flex.items-end");
    expect(secondRow).not.toBeNull();
    fireEvent.change(within(secondRow as HTMLElement).getByRole("combobox"), {
      target: { value: "SCALE_1_10" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText(/berhasil dibuat/i)).toBeInTheDocument();
  });
});

describe("Redirect /new ke daftar", () => {
  it("redirect /evaluations/periods/new ke daftar periode", async () => {
    const mod = await import("@/app/(app)/evaluations/periods/new/page");
    expect(() => mod.default()).toThrow("NEXT_REDIRECT");
    expect(nav.redirect).toHaveBeenCalledWith("/evaluations/periods");
  });

  it("redirect /evaluations/templates/new ke daftar template", async () => {
    const mod = await import("@/app/(app)/evaluations/templates/new/page");
    expect(() => mod.default()).toThrow("NEXT_REDIRECT");
    expect(nav.redirect).toHaveBeenCalledWith("/evaluations/templates");
  });
});
