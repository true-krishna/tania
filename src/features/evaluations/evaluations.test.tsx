// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import EvaluationsPage from "@/app/(app)/evaluations/page";
import EvaluationFormPage from "@/app/(app)/evaluations/[periodId]/[employeeId]/page";
import {
  CurrentEvaluationPeriodDocument,
  EvaluationRosterDocument,
  PerformanceEvaluationForTalentDocument,
  SubmitPerformanceEvaluationDocument,
  UpsertPerformanceEvaluationDocument,
} from "@/generated/graphql";

import { ToastProvider } from "@/components/Toast";
vi.mock("next/navigation", () => ({
  useParams: () => ({ periodId: "period-1", employeeId: "emp-1" }),
}));

const runningPeriod = {
  __typename: "EvaluationPeriod",
  id: "period-1",
  name: "Q3 2025",
  startDate: "2025-07-01",
  endDate: "2025-09-30",
  state: "RUNNING",
  isActive: true,
  template: { __typename: "EvaluationTemplate", id: "tpl-1", name: "Framework Performa" },
};

const closedPeriod = {
  ...runningPeriod,
  id: "period-2",
  name: "Q2 2025",
  startDate: "2025-04-01",
  endDate: "2025-06-30",
  state: "CLOSED",
};

const rosterEntry = (employeeId: string, fullName: string, fillState: "NOT_EVALUATED" | "EVALUATED") => ({
  __typename: "EvaluationPeriodRosterEntry",
  talent: {
    __typename: "Employee",
    id: employeeId,
    fullName,
    nomorInduk: "EMP-001",
    jobRole: { __typename: "JobRole", id: "role-1", name: "Go Engineer" },
  },
  fillState,
  evaluation:
    fillState === "EVALUATED"
      ? { __typename: "PerformanceEvaluation", id: "eval-1", status: "SUBMITTED", updatedAt: "2025-08-01T00:00:00Z" }
      : null,
});

describe("EvaluationsPage roster (Apollo, US7)", () => {
  it("renders the running period roster with fill-state badges and value links", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: CurrentEvaluationPeriodDocument }, result: { data: { currentEvaluationPeriod: runningPeriod } } },
          {
            request: { query: EvaluationRosterDocument, variables: { periodId: "period-1" } },
            result: { data: { evaluationRoster: [rosterEntry("emp-1", "Andi Pratama", "NOT_EVALUATED"), rosterEntry("emp-2", "Budi Santoso", "EVALUATED")] } },
          },
        ]}
      >
        <EvaluationsPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Q3 2025")).toBeInTheDocument();
    expect(screen.getByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Belum dinilai")).toBeInTheDocument();
    expect(screen.getByText("Dinilai")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^nilai$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nilai ulang/i })).toBeInTheDocument();
    expect(screen.getByText("1/2 talent dinilai")).toBeInTheDocument();
  });

  it("shows a closed period as read-only with Lihat links (no scoring)", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: CurrentEvaluationPeriodDocument }, result: { data: { currentEvaluationPeriod: closedPeriod } } },
          {
            request: { query: EvaluationRosterDocument, variables: { periodId: "period-2" } },
            result: { data: { evaluationRoster: [rosterEntry("emp-1", "Andi Pratama", "EVALUATED")] } },
          },
        ]}
      >
        <EvaluationsPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Q2 2025")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lihat/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nilai/i })).not.toBeInTheDocument();
  });

  it("shows an empty state when there is no running period", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: CurrentEvaluationPeriodDocument }, result: { data: { currentEvaluationPeriod: null } } },
        ]}
      >
        <EvaluationsPage />
      </MockedProvider>
    );

    expect(await screen.findByText(/belum ada periode evaluasi berjalan/i)).toBeInTheDocument();
  });
});

describe("EvaluationFormPage (Apollo, US7)", () => {
  const criteria = [
    { __typename: "EvaluationCriterion", id: "crit-1", label: "Prestasi kerja", answerType: "SCALE_1_5", position: 1 },
    { __typename: "EvaluationCriterion", id: "crit-2", label: "Kolaborasi", answerType: "YES_NO", position: 2 },
    { __typename: "EvaluationCriterion", id: "crit-3", label: "Catatan bebas", answerType: "FREE_TEXT", position: 3 },
  ];

  const detailPeriod = {
    __typename: "EvaluationPeriod",
    id: "period-1",
    name: "Q3 2025",
    startDate: "2025-07-01",
    endDate: "2025-09-30",
    state: "RUNNING",
    template: { __typename: "EvaluationTemplate", id: "tpl-1", name: "Framework Performa", criteria },
  };

  const detailResult = {
    data: {
      performanceEvaluations: {
        __typename: "PerformanceEvaluationConnection",
        edges: [
          {
            __typename: "PerformanceEvaluationEdge",
            node: {
              __typename: "PerformanceEvaluation",
              id: "eval-1",
              status: "DRAFT",
              summaryAchievement: null,
              developmentNotes: null,
              talent: { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama", nomorInduk: "EMP-001" },
              period: detailPeriod,
              answers: [
                {
                  __typename: "EvaluationAnswer",
                  criterion: { __typename: "EvaluationCriterion", id: "crit-1", label: "Prestasi kerja", answerType: "SCALE_1_5", position: 1 },
                  valueNumeric: 4,
                  valueBool: null,
                  valueText: null,
                },
                {
                  __typename: "EvaluationAnswer",
                  criterion: { __typename: "EvaluationCriterion", id: "crit-2", label: "Kolaborasi", answerType: "YES_NO", position: 2 },
                  valueNumeric: null,
                  valueBool: true,
                  valueText: null,
                },
              ],
              createdBy: null,
              createdAt: "2025-08-01T00:00:00Z",
              updatedAt: "2025-08-01T00:00:00Z",
            },
          },
        ],
      },
    },
  };

  it("renders the scoring form with one input per criterion by answer type", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: CurrentEvaluationPeriodDocument }, result: { data: { currentEvaluationPeriod: runningPeriod } } },
          {
            request: { query: EvaluationRosterDocument, variables: { periodId: "period-1" } },
            result: { data: { evaluationRoster: [rosterEntry("emp-1", "Andi Pratama", "NOT_EVALUATED")] } },
          },
          {
            request: { query: PerformanceEvaluationForTalentDocument, variables: { periodId: "period-1", employeeId: "emp-1", first: 1 } },
            result: detailResult,
          },
        ]}
      >
        <ToastProvider>
          <EvaluationFormPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("1. Prestasi kerja")).toBeInTheDocument();
    expect(screen.getByText("2. Kolaborasi")).toBeInTheDocument();
    expect(screen.getByText("3. Catatan bebas")).toBeInTheDocument();
    const scaleSelect = screen.getByRole("combobox", { name: /1\. prestasi kerja/i });
    expect(scaleSelect).toHaveValue("4");
    const yesNoSelect = screen.getByRole("combobox", { name: /2\. kolaborasi/i });
    expect(yesNoSelect).toHaveValue("yes");
  });

  it("submits the evaluation (upsert then submit)", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: CurrentEvaluationPeriodDocument }, result: { data: { currentEvaluationPeriod: runningPeriod } } },
          {
            request: { query: EvaluationRosterDocument, variables: { periodId: "period-1" } },
            result: { data: { evaluationRoster: [rosterEntry("emp-1", "Andi Pratama", "NOT_EVALUATED")] } },
          },
          {
            request: { query: PerformanceEvaluationForTalentDocument, variables: { periodId: "period-1", employeeId: "emp-1", first: 1 } },
            result: detailResult,
          },
          {
            request: {
              query: UpsertPerformanceEvaluationDocument,
              variables: {
                input: {
                  periodId: "period-1",
                  employeeId: "emp-1",
                  summaryAchievement: undefined,
                  developmentNotes: undefined,
                  answers: [
                    { criterionId: "crit-1", valueNumeric: 4, valueBool: undefined, valueText: undefined },
                    { criterionId: "crit-2", valueNumeric: undefined, valueBool: true, valueText: undefined },
                    { criterionId: "crit-3", valueNumeric: undefined, valueBool: undefined, valueText: undefined },
                  ],
                },
              },
            },
            result: { data: { upsertPerformanceEvaluation: { __typename: "PerformanceEvaluation", id: "eval-1", status: "SUBMITTED", summaryAchievement: null, developmentNotes: null, answers: [] } } },
          },
          {
            request: { query: SubmitPerformanceEvaluationDocument, variables: { id: "eval-1" } },
            result: { data: { submitPerformanceEvaluation: { __typename: "PerformanceEvaluation", id: "eval-1", status: "SUBMITTED" } } },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationFormPage />
        </ToastProvider>
      </MockedProvider>
    );

    await screen.findByText("Andi Pratama");
    fireEvent.click(screen.getByRole("button", { name: /serahkan/i }));

    expect(await screen.findByText(/evaluasi diserahkan/i)).toBeInTheDocument();
  });

  it("renders a closed period as read-only (no editable controls)", async () => {
    const closedDetail = {
      data: {
        performanceEvaluations: {
          __typename: "PerformanceEvaluationConnection",
          edges: [
            {
              __typename: "PerformanceEvaluationEdge",
              node: {
                ...detailResult.data.performanceEvaluations.edges[0].node,
                status: "SUBMITTED",
                period: {
                  ...detailPeriod,
                  id: "period-1",
                  name: "Q2 2025",
                  state: "CLOSED",
                },
              },
            },
          ],
        },
      },
    };

    render(
      <MockedProvider
        mocks={[
          { request: { query: CurrentEvaluationPeriodDocument }, result: { data: { currentEvaluationPeriod: null } } },
          {
            request: { query: PerformanceEvaluationForTalentDocument, variables: { periodId: "period-1", employeeId: "emp-1", first: 1 } },
            result: closedDetail,
          },
        ]}
      >
        <ToastProvider>
          <EvaluationFormPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(screen.queryByRole("button", { name: /serahkan/i })).not.toBeInTheDocument();
    expect(await screen.findByText(/periode telah berakhir — evaluasi hanya-baca/i)).toBeInTheDocument();
    const yesNoSelect = screen.getByRole("combobox", { name: /2\. kolaborasi/i });
    expect(yesNoSelect).toBeDisabled();
  });

  it("renders a blank scoring form for a talent not yet evaluated (criteria from current period)", async () => {
    const currentPeriodWithCriteria = {
      __typename: "EvaluationPeriod",
      id: "period-1",
      name: "Q3 2025",
      startDate: "2025-07-01",
      endDate: "2025-09-30",
      state: "RUNNING",
      isActive: true,
      template: { __typename: "EvaluationTemplate", id: "tpl-1", name: "Framework Performa", criteria },
    };

    render(
      <MockedProvider
        mocks={[
          { request: { query: CurrentEvaluationPeriodDocument }, result: { data: { currentEvaluationPeriod: currentPeriodWithCriteria } } },
          {
            request: { query: EvaluationRosterDocument, variables: { periodId: "period-1" } },
            result: { data: { evaluationRoster: [rosterEntry("emp-1", "Andi Pratama", "NOT_EVALUATED")] } },
          },
          {
            request: { query: PerformanceEvaluationForTalentDocument, variables: { periodId: "period-1", employeeId: "emp-1", first: 1 } },
            result: {
              data: {
                performanceEvaluations: { __typename: "PerformanceEvaluationConnection", edges: [] },
              },
            },
          },
        ]}
      >
        <ToastProvider>
          <EvaluationFormPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("1. Prestasi kerja")).toBeInTheDocument();
    const scaleSelect = screen.getByRole("combobox", { name: /1\. prestasi kerja/i });
    expect(scaleSelect).toHaveValue("");
    expect(screen.getByRole("button", { name: /serahkan/i })).toBeInTheDocument();
  });
});