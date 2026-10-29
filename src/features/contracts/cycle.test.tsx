// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { ContractCycleActions } from "@/features/contracts/ContractCycleActions";
import {
  EmployeeDocument,
  EmploymentContractDocument,
  JobRolesDocument,
  RecordEmployeeMutationDocument,
  ResignEmployeeDocument,
  RetireEmployeeDocument,
  UnitsDocument,
  type EmploymentContractQuery,
} from "@/generated/graphql";

type ContractNode = NonNullable<EmploymentContractQuery["employmentContract"]>;

const contractNode: ContractNode = {
  id: "ctr-1",
  contractNo: "PKWT/2025/002",
  contractType: "TKWT_DIGITAL_TALENT",
  officeEmail: "andi@corp.id",
  nomorInduk: "EMP-77",
  bandPosition: "II",
  jobTitle: "Backend Engineer",
  jobLevel: "Junior",
  workLocation: "JAKARTA",
  startDate: "2025-07-01",
  endDate: "2026-06-30",
  status: "ACTIVE",
  endReason: null,
  terminatedAt: null,
  notes: "Perpanjangan",
  employee: {
    id: "emp-1",
    fullName: "Andi Pratama",
    nikMasked: "************1234",
    email: "andi@tania.id",
  },
  unit: { id: "u-1", name: "Digital" },
  jobRole: { id: "jr-1", name: "Engineer", chapter: { id: "ch-1", name: "Platform" } },
  predecessor: null,
  createdBy: { id: "u-1", fullName: "Sari Operator" },
  createdAt: "2025-06-20T09:00:00Z",
  updatedAt: "2025-06-20T09:00:00Z",
};

const unitsMock = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: {
    data: {
      units: [
        { __typename: "Unit", id: "u-1", name: "Digital", isActive: true, projects: [] },
        { __typename: "Unit", id: "u-2", name: "Platform", isActive: true, projects: [] },
      ],
    },
  },
};

const jobRolesMock = {
  request: { query: JobRolesDocument, variables: { includeInactive: true } },
  result: {
    data: {
      jobRoles: [
        { __typename: "JobRole", id: "jr-1", name: "Engineer", isActive: true, chapter: null },
        { __typename: "JobRole", id: "jr-2", name: "Tech Lead", isActive: true, chapter: null },
      ],
    },
  },
};

const contractRefetchMock = {
  request: { query: EmploymentContractDocument, variables: { id: "ctr-1" } },
  result: { data: { employmentContract: contractNode } },
};

const employeeRefetchMock = {
  request: { query: EmployeeDocument, variables: { id: "emp-1" } },
  result: { data: { employee: { __typename: "Employee", id: "emp-1" } } },
};

function renderWith(
  mocks: React.ComponentProps<typeof MockedProvider>["mocks"],
  ui: React.ReactNode,
) {
  render(
    <React.Suspense fallback={null}>
      <MockedProvider mocks={mocks}>{ui}</MockedProvider>
    </React.Suspense>,
  );
}

function submitForm(buttonName: RegExp) {
  const form = screen.getByRole("button", { name: buttonName }).closest("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

describe("ContractCycleActions (T026)", () => {
  it("warns about active work before resign and retries with acknowledgement", async () => {
    const unack = {
      request: {
        query: ResignEmployeeDocument,
        variables: { id: "emp-1", effectiveDate: "2026-03-01", acknowledgeActiveWork: false },
      },
      result: {
        errors: [
          new GraphQLError("precondition not satisfied", {
            extensions: { code: "PRECONDITION_FAILED" },
          }),
        ],
      },
    };
    const ack = {
      request: {
        query: ResignEmployeeDocument,
        variables: { id: "emp-1", effectiveDate: "2026-03-01", acknowledgeActiveWork: true },
      },
      result: {
        data: {
          resignEmployee: {
            __typename: "Employee",
            id: "emp-1",
            status: "RESIGNED",
            assignable: false,
          },
        },
      },
    };
    renderWith(
      [unitsMock, jobRolesMock, unack, ack, contractRefetchMock, employeeRefetchMock],
      <ContractCycleActions contract={contractNode} />,
    );

    const dateInputs = await screen.findAllByLabelText(/tanggal efektif/i);
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-01" } });
    fireEvent.click(screen.getByRole("button", { name: /catat resign/i }));

    expect(await screen.findByText(/assignment aktif atau idp berjalan/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /lanjutkan resign/i }));
    expect(await screen.findByText(/resign tercatat/i)).toBeInTheDocument();
  });

  it("records a mutation with the new unit/position and links the successor contract", async () => {
    const mutationMock = {
      request: {
        query: RecordEmployeeMutationDocument,
        variables: {
          input: {
            employeeId: "emp-1",
            effectiveDate: "2026-03-01",
            contractNo: "PKWT/2026/MUT-01",
            nomorInduk: "EMP-77",
            unitId: "u-2",
            jobRoleId: "jr-2",
            workLocation: "BANDUNG",
            bandPosition: "II",
            officeEmail: "andi@corp.id",
            jobTitle: "Backend Engineer",
            jobLevel: "Junior",
          },
        },
      },
      result: {
        data: {
          recordEmployeeMutation: {
            __typename: "EmploymentContract",
            id: "ctr-3",
            contractNo: "PKWT/2026/MUT-01",
            contractType: "TKWT_DIGITAL_TALENT",
            status: "ACTIVE",
            startDate: "2026-03-01",
            endDate: null,
            employee: { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama" },
            predecessor: {
              __typename: "EmploymentContract",
              id: "ctr-1",
              contractNo: "PKWT/2025/002",
            },
          },
        },
      },
    };
    renderWith(
      [unitsMock, jobRolesMock, mutationMock, contractRefetchMock, employeeRefetchMock],
      <ContractCycleActions contract={contractNode} />,
    );

    const dateInputs = await screen.findAllByLabelText(/tanggal efektif/i);
    fireEvent.change(dateInputs[1], { target: { value: "2026-03-01" } });
    fireEvent.change(screen.getByLabelText(/no\. kontrak baru/i), {
      target: { value: "PKWT/2026/MUT-01" },
    });
    fireEvent.change(screen.getByLabelText(/unit baru/i), { target: { value: "u-2" } });
    fireEvent.change(screen.getByLabelText(/job role baru/i), { target: { value: "jr-2" } });
    fireEvent.change(screen.getByLabelText(/work location/i), { target: { value: "BANDUNG" } });
    submitForm(/catat mutasi/i);

    expect(await screen.findByText(/mutasi tercatat/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buka kontrak baru/i })).toHaveAttribute(
      "href",
      "/contracts/ctr-3",
    );
  });

  it("warns about active work before retirement and retries with acknowledgement", async () => {
    const unack = {
      request: {
        query: RetireEmployeeDocument,
        variables: { id: "emp-1", effectiveDate: "2026-09-01", acknowledgeActiveWork: false },
      },
      result: {
        errors: [
          new GraphQLError("precondition not satisfied", {
            extensions: { code: "PRECONDITION_FAILED" },
          }),
        ],
      },
    };
    const ack = {
      request: {
        query: RetireEmployeeDocument,
        variables: { id: "emp-1", effectiveDate: "2026-09-01", acknowledgeActiveWork: true },
      },
      result: {
        data: {
          retireEmployee: {
            __typename: "Employee",
            id: "emp-1",
            status: "RETIRED",
            assignable: false,
          },
        },
      },
    };
    renderWith(
      [unitsMock, jobRolesMock, unack, ack, contractRefetchMock, employeeRefetchMock],
      <ContractCycleActions contract={contractNode} />,
    );

    const dateInputs = await screen.findAllByLabelText(/tanggal efektif/i);
    fireEvent.change(dateInputs[2], { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByRole("button", { name: /catat pensiun/i }));

    expect(await screen.findByText(/assignment aktif atau idp berjalan/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /lanjutkan pensiun/i }));
    expect(await screen.findByText(/pensiun tercatat/i)).toBeInTheDocument();
  });
});
