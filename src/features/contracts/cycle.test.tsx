// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { ContractCycleActions } from "@/features/contracts/ContractCycleActions";
import { OperationCycleWidgets } from "@/features/contracts/OperationCycleWidgets";
import { RenewContractWizard } from "@/features/contracts/RenewContractWizard";
import {
  EmployeesNeedingFollowUpDocument,
  EmployeeDocument,
  EmploymentContractDocument,
  ExpiringContractsDocument,
  JobRolesDocument,
  PreRetirementCandidatesDocument,
  RecordEmployeeMutationDocument,
  RenewEmploymentContractDocument,
  ResignEmployeeDocument,
  RetireEmployeeDocument,
  RetirementAgeDocument,
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

function renderWith(mocks: React.ComponentProps<typeof MockedProvider>["mocks"], ui: React.ReactNode) {
  render(
    <React.Suspense fallback={null}>
      <MockedProvider mocks={mocks}>{ui}</MockedProvider>
    </React.Suspense>
  );
}

function submitForm(buttonName: RegExp) {
  const form = screen.getByRole("button", { name: buttonName }).closest("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

describe("RenewContractWizard (T025)", () => {
  const expectedInput = {
    predecessorContractId: "ctr-1",
    contractNo: "PKWT/2027/001",
    contractType: "TKWT_DIGITAL_TALENT",
    nomorInduk: "EMP-77",
    jobRoleId: "jr-2",
    unitId: "u-2",
    workLocation: "JAKARTA",
    bandPosition: "II",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    officeEmail: "andi@corp.id",
    jobTitle: "Backend Engineer",
    jobLevel: "Junior",
  };

  const renewMock = {
    request: {
      query: RenewEmploymentContractDocument,
      variables: { input: expectedInput },
    },
    result: {
      data: {
        renewEmploymentContract: {
          __typename: "EmploymentContract",
          id: "ctr-2",
          contractNo: "PKWT/2027/001",
          contractType: "TKWT_DIGITAL_TALENT",
          status: "ACTIVE",
          startDate: "2026-07-01",
          endDate: "2027-06-30",
          employee: { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama" },
          predecessor: { __typename: "EmploymentContract", id: "ctr-1", contractNo: "PKWT/2025/002" },
        },
      },
    },
  };

  it("defaults the new period to start after the old contract and rejects an overlapping start", async () => {
    renderWith([unitsMock, jobRolesMock, renewMock], <RenewContractWizard contract={contractNode} />);
    await screen.findByRole("heading", { name: /kontrak baru/i }).catch(() => undefined);

    const start = await screen.findByLabelText(/tanggal mulai/i);
    expect(start).toHaveValue("2026-07-01");

    fireEvent.change(start, { target: { value: "2026-06-01" } });
    submitForm(/lanjut/i);

    expect(
      screen.getByText(/tanggal mulai harus setelah kontrak lama berakhir/i)
    ).toBeInTheDocument();
  });

  it("creates a new contract linked to the predecessor, applying the new unit/position", async () => {
    renderWith([unitsMock, jobRolesMock, renewMock], <RenewContractWizard contract={contractNode} />);

    fireEvent.change(await screen.findByLabelText(/no\. kontrak baru/i), {
      target: { value: "PKWT/2027/001" },
    });
    fireEvent.change(screen.getByLabelText(/tanggal selesai/i), {
      target: { value: "2027-06-30" },
    });
    submitForm(/lanjut/i);

    fireEvent.change(await screen.findByLabelText(/^unit/i), { target: { value: "u-2" } });
    fireEvent.change(screen.getByLabelText(/posisi \/ job role/i), { target: { value: "jr-2" } });
    submitForm(/simpan perpanjangan/i);

    expect(
      await screen.findByText(/kontrak perpanjangan/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buka kontrak baru/i })).toHaveAttribute(
      "href",
      "/contracts/ctr-2"
    );
  });
});

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
      <ContractCycleActions contract={contractNode} />
    );

    const dateInputs = await screen.findAllByLabelText(/tanggal efektif/i);
    fireEvent.change(dateInputs[0], { target: { value: "2026-03-01" } });
    fireEvent.click(screen.getByRole("button", { name: /catat resign/i }));

    expect(
      await screen.findByText(/assignment aktif atau idp berjalan/i)
    ).toBeInTheDocument();

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
            predecessor: { __typename: "EmploymentContract", id: "ctr-1", contractNo: "PKWT/2025/002" },
          },
        },
      },
    };
    renderWith(
      [unitsMock, jobRolesMock, mutationMock, contractRefetchMock, employeeRefetchMock],
      <ContractCycleActions contract={contractNode} />
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
      "/contracts/ctr-3"
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
      <ContractCycleActions contract={contractNode} />
    );

    const dateInputs = await screen.findAllByLabelText(/tanggal efektif/i);
    fireEvent.change(dateInputs[2], { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByRole("button", { name: /catat pensiun/i }));

    expect(
      await screen.findByText(/assignment aktif atau idp berjalan/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /lanjutkan pensiun/i }));
    expect(await screen.findByText(/pensiun tercatat/i)).toBeInTheDocument();
  });
});

function retiringIn(days: number, age = 56): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCFullYear(date.getUTCFullYear() - age);
  return date.toISOString().slice(0, 10);
}

describe("OperationCycleWidgets (T027)", () => {
  const expiring90Mock = {
    request: { query: ExpiringContractsDocument, variables: { days: 90, first: 25, after: null } },
    result: {
      data: {
        expiringContracts: {
          __typename: "EmploymentContractConnection",
          totalCount: 2,
          edges: [
            {
              __typename: "EmploymentContractEdge",
              cursor: "c1",
              node: {
                __typename: "EmploymentContract",
                id: "ctr-10",
                contractNo: "PKWT/2026/010",
                contractType: "TKWT_DIGITAL_TALENT",
                endDate: "2026-12-31",
                status: "ACTIVE",
                employee: { __typename: "Employee", id: "emp-9", fullName: "Andi Pratama" },
                unit: { __typename: "Unit", id: "u-1", name: "Digital" },
                jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
              },
            },
            {
              __typename: "EmploymentContractEdge",
              cursor: "c2",
              node: {
                __typename: "EmploymentContract",
                id: "ctr-11",
                contractNo: "PKWT/2026/011",
                contractType: "TKWT_DIGITAL_TALENT",
                endDate: "2027-01-15",
                status: "ACTIVE",
                employee: { __typename: "Employee", id: "emp-10", fullName: "Eka Saputra" },
                unit: { __typename: "Unit", id: "u-1", name: "Digital" },
                jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
              },
            },
          ],
          pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: "c2" },
        },
      },
    },
  };

  const expiring30Mock = {
    request: { query: ExpiringContractsDocument, variables: { days: 30, first: 25, after: null } },
    result: {
      data: {
        expiringContracts: {
          __typename: "EmploymentContractConnection",
          totalCount: 1,
          edges: [
            {
              __typename: "EmploymentContractEdge",
              cursor: "c1",
              node: {
                __typename: "EmploymentContract",
                id: "ctr-10",
                contractNo: "PKWT/2026/010",
                contractType: "TKWT_DIGITAL_TALENT",
                endDate: "2026-12-31",
                status: "ACTIVE",
                employee: { __typename: "Employee", id: "emp-9", fullName: "Andi Pratama" },
                unit: { __typename: "Unit", id: "u-1", name: "Digital" },
                jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
              },
            },
          ],
          pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: "c1" },
        },
      },
    },
  };

  const followUpMock = {
    request: { query: EmployeesNeedingFollowUpDocument, variables: { first: 25, after: null } },
    result: {
      data: {
        employeesNeedingFollowUp: {
          __typename: "EmployeeConnection",
          totalCount: 1,
          edges: [
            {
              __typename: "EmployeeEdge",
              cursor: "e1",
              node: {
                __typename: "Employee",
                id: "emp-20",
                fullName: "Budi Santoso",
                nomorInduk: "EMP-20",
                email: "budi@tania.id",
                status: "ACTIVE",
                contracts: {
                  __typename: "EmploymentContractConnection",
                  edges: [
                    {
                      __typename: "EmploymentContractEdge",
                      node: {
                        __typename: "EmploymentContract",
                        id: "ctr-20",
                        contractNo: "PKWT/2024/020",
                        endDate: "2026-01-01",
                        endReason: "EXPIRY",
                      },
                    },
                  ],
                },
              },
            },
          ],
          pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: "e1" },
        },
      },
    },
  };

  const retirementAgeMock = {
    request: { query: RetirementAgeDocument },
    result: { data: { retirementAge: 56 } },
  };

  const candidatesMock = {
    request: { query: PreRetirementCandidatesDocument, variables: { first: 100 } },
    result: {
      data: {
        employees: {
          __typename: "EmployeeConnection",
          edges: [
            {
              __typename: "EmployeeEdge",
              cursor: "e1",
              node: {
                __typename: "Employee",
                id: "emp-30",
                fullName: "Cakra Wijaya",
                birthDate: retiringIn(20),
                nomorInduk: "EMP-30",
                unit: { __typename: "Unit", id: "u-1", name: "Digital" },
              },
            },
            {
              __typename: "EmployeeEdge",
              cursor: "e2",
              node: {
                __typename: "Employee",
                id: "emp-31",
                fullName: "Dewi Lestari",
                birthDate: retiringIn(60),
                nomorInduk: "EMP-31",
                unit: { __typename: "Unit", id: "u-1", name: "Digital" },
              },
            },
            {
              __typename: "EmployeeEdge",
              cursor: "e3",
              node: {
                __typename: "Employee",
                id: "emp-32",
                fullName: "Fajar Nugroho",
                birthDate: retiringIn(400),
                nomorInduk: "EMP-32",
                unit: { __typename: "Unit", id: "u-1", name: "Digital" },
              },
            },
          ],
        },
      },
    },
  };

  it("shows the H-90/H-30 expiry counts, follow-up list, and pre-retirement window", async () => {
    await act(async () => {
      renderWith(
        [
          expiring90Mock,
          expiring30Mock,
          followUpMock,
          retirementAgeMock,
          candidatesMock,
        ],
        <OperationCycleWidgets />
      );
    });

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("Eka Saputra")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Cakra Wijaya")).toBeInTheDocument();
    expect(screen.getByText("Dewi Lestari")).toBeInTheDocument();
    expect(screen.getByText("Usia pensiun: 56 tahun")).toBeInTheDocument();
    expect(screen.queryByText("Fajar Nugroho")).not.toBeInTheDocument();
  });
});
