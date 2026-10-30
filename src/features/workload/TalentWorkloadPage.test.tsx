// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MyProfileMetricsDocument } from "@/generated/graphql";
import { TalentWorkloadPage } from "./TalentWorkloadPage";

const h = vi.hoisted(() => ({ role: { current: "TALENT" as string | null } }));

vi.mock("@/lib/auth/guard", () => ({ useSessionRole: () => h.role.current }));

function renderPage(utilizationPercent: number | null) {
  return render(
    <MockedProvider
      mocks={[
        {
          request: { query: MyProfileMetricsDocument },
          result: {
            data: {
              myProfileMetrics: {
                __typename: "ProfileMetrics",
                activeAssignmentCount: 2,
                utilizationPercent,
                certificationCount: 1,
                runningIdpCount: 1,
                completedIdpCount: 0,
              },
            },
          },
        },
      ]}
    >
      <TalentWorkloadPage />
    </MockedProvider>,
  );
}

describe("TalentWorkloadPage (TAN-392)", () => {
  it("shows the six-month average on the healthy band", async () => {
    renderPage(76);
    expect(await screen.findByText("76%")).toBeInTheDocument();
    expect(
      screen.getByRole("meter", { name: /Utilisasi 76 persen, rentang sehat 70 sampai 85 persen/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rentang sehat 70–85%")).toBeInTheDocument();
  });

  it("shows an empty state when there is no utilization source", async () => {
    renderPage(null);
    expect(
      await screen.findByText("Belum ada data workload untuk periode ini."),
    ).toBeInTheDocument();
  });

  it("denies non-Talent roles", () => {
    h.role.current = "CHAPTER";
    renderPage(76);
    expect(screen.getByText("Anda tidak memiliki akses ke halaman ini")).toBeInTheDocument();
    h.role.current = "TALENT";
  });
});
