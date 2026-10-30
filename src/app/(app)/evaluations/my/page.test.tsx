// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MyPerformanceEvaluationsDocument } from "@/generated/graphql";
import MyEvaluationsPage from "./MyEvaluationsPage";

const submitted = {
  __typename: "PerformanceEvaluation",
  id: "eval-1",
  status: "SUBMITTED",
  summaryAchievement: "Memimpin peluncuran tahap 1.",
  developmentNotes: "Perdalam domain telco.",
  updatedAt: "2025-07-29T00:00:00Z",
  period: {
    __typename: "EvaluationPeriod",
    id: "per-1",
    name: "Evaluasi H1 2025",
    startDate: "2025-01-01",
    endDate: "2025-06-30",
    state: "CLOSED",
  },
  answers: [
    {
      __typename: "EvaluationAnswer",
      valueNumeric: 4,
      valueBool: null,
      valueText: null,
      criterion: {
        __typename: "EvaluationCriterion",
        id: "cri-1",
        label: "Kualitas hasil kerja",
        answerType: "SCALE_1_5",
        position: 1,
      },
    },
    {
      __typename: "EvaluationAnswer",
      valueNumeric: null,
      valueBool: true,
      valueText: null,
      criterion: {
        __typename: "EvaluationCriterion",
        id: "cri-2",
        label: "Kolaborasi lintas tim",
        answerType: "YES_NO",
        position: 2,
      },
    },
    {
      __typename: "EvaluationAnswer",
      valueNumeric: null,
      valueBool: null,
      valueText: "Siap untuk tanggung jawab lintas unit.",
      criterion: {
        __typename: "EvaluationCriterion",
        id: "cri-3",
        label: "Catatan evaluator",
        answerType: "FREE_TEXT",
        position: 3,
      },
    },
  ],
};

const draft = {
  ...submitted,
  id: "eval-2",
  status: "DRAFT",
  summaryAchievement: null,
  developmentNotes: null,
  answers: [],
  period: {
    __typename: "EvaluationPeriod",
    id: "per-2",
    name: "Evaluasi H2 2025",
    startDate: "2025-07-01",
    endDate: "2025-12-31",
    state: "OPEN",
  },
};

function renderPage(evaluations: readonly unknown[]) {
  return render(
    <MockedProvider
      mocks={[
        {
          request: { query: MyPerformanceEvaluationsDocument },
          result: { data: { myPerformanceEvaluations: evaluations } },
        },
      ]}
    >
      <MyEvaluationsPage />
    </MockedProvider>,
  );
}

describe("MyEvaluationsPage (TAN-392)", () => {
  it("renders criteria by answer type with period status", async () => {
    renderPage([submitted, draft]);

    expect(await screen.findByText("Evaluasi H1 2025")).toBeInTheDocument();
    expect(screen.getByText("Diserahkan")).toBeInTheDocument();
    expect(screen.getByText("Draf")).toBeInTheDocument();
    expect(screen.getByText("Kualitas hasil kerja")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Ya")).toBeInTheDocument();
    expect(screen.getByText("Siap untuk tanggung jawab lintas unit.")).toBeInTheDocument();
  });

  it("keeps the honest dash placeholders while a draft has no answers", async () => {
    renderPage([draft]);
    expect(await screen.findByText("Evaluasi H2 2025")).toBeInTheDocument();
    expect(screen.getAllByText("–").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Status Draf berarti evaluator belum menyerahkan hasil/),
    ).toBeInTheDocument();
  });

  it("keeps today's empty-state sentence", async () => {
    renderPage([]);
    expect(
      await screen.findByText("Belum ada evaluasi performa untuk Anda pada periode ini."),
    ).toBeInTheDocument();
  });
});
