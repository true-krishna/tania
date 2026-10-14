// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import IdpPage from "@/app/(app)/idp/page";
import NewIdpPage from "@/app/(app)/idp/new/page";
import IdpDetailPage from "@/app/(app)/idp/[id]/page";
import {
  AddDevelopmentActionDocument,
  AddIdpReviewDocument,
  AssignableTalentsDocument,
  CloseIdpDocument,
  CreateIdpDocument,
  IdpDocument,
  IdpsDocument,
  UpdateDevelopmentActionStatusDocument,
} from "@/generated/graphql";

const nav = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  notFound: () => {
    throw new Error("notFound");
  },
}));

const talent = {
  __typename: "Employee",
  id: "emp-1",
  fullName: "Andi Pratama",
  nomorInduk: "EMP-001",
  assignable: true,
};

const assignableTalentsResult = {
  data: {
    assignableTalents: {
      __typename: "EmployeeConnection",
      edges: [{ __typename: "EmployeeEdge", cursor: "emp-1", node: talent }],
    },
  },
};

const idpNode = {
  __typename: "Idp",
  id: "idp-1",
  status: "IN_PROGRESS",
  developmentObjective: "Menjadi Go backend engineer yang andal",
  timelineStart: "2025-07-01",
  timelineEnd: "2025-09-30",
  talent: { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama", nomorInduk: "EMP-001" },
  actions: [
    { __typename: "DevelopmentAction", id: "act-1", status: "COMPLETED" },
    { __typename: "DevelopmentAction", id: "act-2", status: "IN_PROGRESS" },
  ],
  reviews: [{ __typename: "ReviewLog", id: "rev-1" }],
};

const idpsResult = {
  data: {
    idps: {
      __typename: "IdpConnection",
      totalCount: 1,
      edges: [{ __typename: "IdpEdge", cursor: "idp-1", node: idpNode }],
      pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
    },
  },
};

const idpDetail = {
  __typename: "Idp",
  id: "idp-1",
  status: "NEEDS_REVIEW",
  developmentObjective: "Menjadi Go backend engineer yang andal",
  currentAssessment: "Kuat di API, kurang di concurrency",
  gapAnalysis: "Butuh pemahaman goroutine & channel",
  timelineStart: "2025-07-01",
  timelineEnd: "2025-09-30",
  successIndicators: "Menyelesaikan 3 fitur backend mandiri",
  talent: {
    __typename: "Employee",
    id: "emp-1",
    fullName: "Andi Pratama",
    nomorInduk: "EMP-001",
    jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
  },
  actions: [
    {
      __typename: "DevelopmentAction",
      id: "act-1",
      description: "Training Go lanjutan",
      method: "TRAINING",
      status: "IN_PROGRESS",
      dueDate: "2025-08-01",
    },
  ],
  reviews: [
    {
      __typename: "ReviewLog",
      id: "rev-1",
      reviewDate: "2025-08-05",
      summary: "Progres baik, lanjut mentoring",
      followUp: "Tambahkan praktik concurrent",
      createdBy: { __typename: "User", id: "u-1", fullName: "Chapter Satu" },
    },
  ],
  revisions: [
    {
      __typename: "IdpRevision",
      id: "revs-1",
      revisionNo: 1,
      changeNote: "Revisi gap analysis",
      createdAt: "2025-07-15T00:00:00Z",
      changedBy: { __typename: "User", id: "u-1", fullName: "Chapter Satu" },
    },
  ],
};

const idpDetailResult = { data: { idp: idpDetail } };
const idpDetailUpdateResult = {
  data: {
    idp: {
      ...idpDetail,
      status: "COMPLETED",
      actions: [
        {
          ...idpDetail.actions[0],
          status: "COMPLETED",
        },
      ],
    },
  },
};

describe("IdpPage (Apollo, US3)", () => {
  it("renders the IDP list with status, filter and action progress", async () => {
    render(
      <MockedProvider
        mocks={[
          { request: { query: IdpsDocument, variables: { filter: {}, first: 100 } }, result: idpsResult },
        ]}
      >
        <IdpPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument(); // completed/total actions
    expect(screen.getByRole("option", { name: "Berjalan" })).toBeInTheDocument();
  });

  it("filters the list by status when a status is selected", async () => {
    const filteredResult = {
      data: { idps: { ...idpsResult.data.idps, totalCount: 0, edges: [] } },
    };
    render(
      <MockedProvider
        mocks={[
          { request: { query: IdpsDocument, variables: { filter: {}, first: 100 } }, result: idpsResult },
          {
            request: { query: IdpsDocument, variables: { filter: { status: "COMPLETED" }, first: 100 } },
            result: filteredResult,
          },
        ]}
      >
        <IdpPage />
      </MockedProvider>
    );

    await screen.findByText("Andi Pratama");
    fireEvent.change(screen.getByRole("combobox", { name: /status/i }), {
      target: { value: "COMPLETED" },
    });

    expect(await screen.findByText(/tidak ada idp yang cocok/i)).toBeInTheDocument();
  });

  it("shows an empty state when there are no IDPs", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: IdpsDocument, variables: { filter: {}, first: 100 } },
            result: {
              data: {
                idps: {
                  __typename: "IdpConnection",
                  totalCount: 0,
                  edges: [],
                  pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
                },
              },
            },
          },
        ]}
      >
        <IdpPage />
      </MockedProvider>
    );

    expect(await screen.findByText(/tidak ada idp yang cocok/i)).toBeInTheDocument();
  });
});

describe("NewIdpPage (Apollo form, US3)", () => {
  const newMocks = [
    { request: { query: AssignableTalentsDocument, variables: { first: 100 } }, result: assignableTalentsResult },
    {
      request: {
        query: CreateIdpDocument,
        variables: {
          input: {
            employeeId: "emp-1",
            developmentObjective: "Menjadi Go backend engineer yang andal",
            currentAssessment: "Kuat di API",
            gapAnalysis: "Butuh concurrency",
            timelineStart: "2025-07-01",
            timelineEnd: "2025-09-30",
            successIndicators: "Selesaikan 3 fitur",
            actions: [
              { description: "Training Go lanjutan", method: "TRAINING", dueDate: undefined },
            ],
          },
        },
      },
      result: {
        data: { createIdp: { __typename: "Idp", id: "idp-2", status: "IN_PROGRESS", talent } },
      },
    },
  ];

  it("shows required-field errors on an empty submit", async () => {
    render(
      <MockedProvider mocks={newMocks}>
        <NewIdpPage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /buat idp/i });

    fireEvent.submit(screen.getByRole("button", { name: /simpan/i }).closest("form")!);

    expect(screen.getByText(/talent wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/development objective wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal mulai wajib diisi/i)).toBeInTheDocument();
  });

  it("offers only assignable talents and creates an IDP with an action", async () => {
    render(
      <MockedProvider mocks={newMocks}>
        <NewIdpPage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /buat idp/i });

    const talentSelect = screen.getByRole("combobox", { name: /talent/i });
    expect(Array.from(talentSelect.querySelectorAll("option")).some((o) => o.textContent?.includes("Andi Pratama"))).toBe(
      true
    );

    fireEvent.change(talentSelect, { target: { value: "emp-1" } });
    fireEvent.change(screen.getByLabelText(/development objective/i), {
      target: { value: "Menjadi Go backend engineer yang andal" },
    });
    fireEvent.change(screen.getByLabelText(/penilaian kondisi saat ini/i), {
      target: { value: "Kuat di API" },
    });
    fireEvent.change(screen.getByLabelText(/identifikasi gap/i), {
      target: { value: "Butuh concurrency" },
    });
    fireEvent.change(screen.getByLabelText(/timeline mulai/i), { target: { value: "2025-07-01" } });
    fireEvent.change(screen.getByLabelText(/timeline selesai/i), { target: { value: "2025-09-30" } });
    fireEvent.change(screen.getByLabelText(/success indicators/i), {
      target: { value: "Selesaikan 3 fitur" },
    });

    fireEvent.click(screen.getByRole("button", { name: /\+ tambah aksi/i }));
    fireEvent.change(screen.getByLabelText(/deskripsi \/ tindakan/i), {
      target: { value: "Training Go lanjutan" },
    });
    // method defaults to TRAINING
    fireEvent.change(screen.getByLabelText(/metode/i), { target: { value: "TRAINING" } });

    fireEvent.submit(screen.getByRole("button", { name: /simpan/i }).closest("form")!);

    expect(await screen.findByText(/berhasil dibuat/i)).toBeInTheDocument();
  });

  it("shows an error toast when the create mutation fails", async () => {
    const failingMocks = [
      { request: { query: AssignableTalentsDocument, variables: { first: 100 } }, result: assignableTalentsResult },
      {
        request: {
          query: CreateIdpDocument,
          variables: {
            input: {
              employeeId: "emp-1",
              developmentObjective: "Menjadi Go backend engineer yang andal",
              currentAssessment: "Kuat di API",
              gapAnalysis: "Butuh concurrency",
              timelineStart: "2025-07-01",
              timelineEnd: "2025-09-30",
              successIndicators: "Selesaikan 3 fitur",
              actions: [],
            },
          },
        },
        error: new Error("Gagal membuat IDP."),
      },
    ];

    render(
      <MockedProvider mocks={failingMocks}>
        <NewIdpPage />
      </MockedProvider>
    );
    await screen.findByRole("heading", { name: /buat idp/i });

    fireEvent.change(screen.getByRole("combobox", { name: /talent/i }), { target: { value: "emp-1" } });
    fireEvent.change(screen.getByLabelText(/development objective/i), {
      target: { value: "Menjadi Go backend engineer yang andal" },
    });
    fireEvent.change(screen.getByLabelText(/penilaian kondisi saat ini/i), {
      target: { value: "Kuat di API" },
    });
    fireEvent.change(screen.getByLabelText(/identifikasi gap/i), {
      target: { value: "Butuh concurrency" },
    });
    fireEvent.change(screen.getByLabelText(/timeline mulai/i), { target: { value: "2025-07-01" } });
    fireEvent.change(screen.getByLabelText(/timeline selesai/i), { target: { value: "2025-09-30" } });
    fireEvent.change(screen.getByLabelText(/success indicators/i), {
      target: { value: "Selesaikan 3 fitur" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /simpan/i }).closest("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent(/gagal membuat idp/i);
  });
});

describe("IdpDetailPage (Apollo, US3)", () => {
  const detailMocks = [
    { request: { query: IdpDocument, variables: { id: "idp-1" } }, result: idpDetailResult },
    { request: { query: IdpDocument, variables: { id: "idp-1" } }, result: idpDetailUpdateResult },
    {
      request: {
        query: UpdateDevelopmentActionStatusDocument,
        variables: { id: "act-1", status: "COMPLETED" },
      },
      result: {
        data: {
          updateDevelopmentActionStatus: {
            __typename: "DevelopmentAction",
            id: "act-1",
            description: "Training Go lanjutan",
            method: "TRAINING",
            status: "COMPLETED",
            dueDate: "2025-08-01",
          },
        },
      },
    },
    {
      request: {
        query: AddDevelopmentActionDocument,
        variables: {
          idpId: "idp-1",
          input: { description: "Mentoring mingguan", method: "MENTORING", dueDate: undefined },
        },
      },
      result: {
        data: {
          addDevelopmentAction: {
            __typename: "DevelopmentAction",
            id: "act-2",
            description: "Mentoring mingguan",
            method: "MENTORING",
            status: "TODO",
            dueDate: null,
          },
        },
      },
    },
    {
      request: {
        query: AddIdpReviewDocument,
        variables: {
          idpId: "idp-1",
          input: { reviewDate: "2025-09-01", summary: "Progres stabil", followUp: "Lanjut" },
        },
      },
      result: {
        data: { addIdpReview: { __typename: "ReviewLog", id: "rev-2", reviewDate: "2025-09-01", summary: "Progres stabil", followUp: "Lanjut", createdAt: "2025-09-01T00:00:00Z" } },
      },
    },
    {
      request: { query: CloseIdpDocument, variables: { id: "idp-1" } },
      result: { data: { closeIdp: { __typename: "Idp", id: "idp-1", status: "COMPLETED" } } },
    },
  ];


  it("renders all IDP components and the review history", async () => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={detailMocks}>
            <IdpDetailPage params={Promise.resolve({ id: "idp-1" })} />
          </MockedProvider>
        </React.Suspense>
      );
    });

    expect(await screen.findByText(/menjadi go backend engineer yang andal/i)).toBeInTheDocument();
    expect(screen.getByText(/kuat di api, kurang di concurrency/i)).toBeInTheDocument();
    expect(screen.getByText(/butuh pemahaman goroutine & channel/i)).toBeInTheDocument();
    expect(screen.getByText(/menyelesaikan 3 fitur backend mandiri/i)).toBeInTheDocument();
    expect(screen.getByText(/2025-07-01 — 2025-09-30/i)).toBeInTheDocument();
    expect(screen.getByText(/training go lanjutan/i)).toBeInTheDocument();
    expect(screen.getByText(/progres baik, lanjut mentoring/i)).toBeInTheDocument();
    expect(screen.getByText(/revisi #1/i)).toBeInTheDocument();
  });

  it("updates the status of a development action", async () => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={detailMocks}>
            <IdpDetailPage params={Promise.resolve({ id: "idp-1" })} />
          </MockedProvider>
        </React.Suspense>
      );
    });

    const statusSelect = (await screen.findByRole("combobox", {
      name: /status aksi training go lanjutan/i,
    })) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "COMPLETED" } });

    // refetch (IdpDocument) supplies updated status; await the new select value
    expect(await screen.findByRole("combobox", { name: /status aksi training go lanjutan/i })).toHaveValue(
      "COMPLETED"
    );
  });

  it("records a review check-in", async () => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={detailMocks}>
            <IdpDetailPage params={Promise.resolve({ id: "idp-1" })} />
          </MockedProvider>
        </React.Suspense>
      );
    });
    await screen.findByText(/catat hasil review/i);

    fireEvent.change(screen.getByLabelText(/tanggal review/i), { target: { value: "2025-09-01" } });
    fireEvent.change(screen.getByLabelText(/ringkasan hasil/i), {
      target: { value: "Progres stabil" },
    });
    fireEvent.change(screen.getByLabelText(/tindak lanjut/i), { target: { value: "Lanjut" } });

    fireEvent.click(screen.getByRole("button", { name: /simpan review/i }));

    expect(await screen.findByText(/hasil review dicatat/i)).toBeInTheDocument();
  });

  it("closes an IDP that is not yet completed", async () => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={detailMocks}>
            <IdpDetailPage params={Promise.resolve({ id: "idp-1" })} />
          </MockedProvider>
        </React.Suspense>
      );
    });
    await screen.findByText(/tutup idp ini/i);

    fireEvent.click(screen.getByRole("button", { name: /tutup idp/i }));

    expect(await screen.findByText(/idp ditutup/i)).toBeInTheDocument();
  });
});