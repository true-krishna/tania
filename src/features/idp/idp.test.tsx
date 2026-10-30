// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import IdpPage from "@/app/(app)/idp/page";
import { CreateIdpForm } from "@/features/idp/CreateIdpForm";
import IdpDetailPage from "@/app/(app)/idp/[id]/page";
import {
  AddDevelopmentActionDocument,
  AddIdpReviewDocument,
  AssignableTalentsDocument,
  CloseIdpDocument,
  CreateIdpDocument,
  IdpDocument,
  IdpsDocument,
  MyIdpDocument,
  UpdateDevelopmentActionStatusDocument,
} from "@/generated/graphql";

const nav = vi.hoisted(() => ({ push: vi.fn() }));
// Peran berasal dari session store di aplikasi; di sini di-drive langsung supaya
// jalur mengelola (Chapter/Admin) dan hanya-baca (Operation) sama-sama teruji
// (klarifikasi 9).
const auth = vi.hoisted(() => ({ role: "CHAPTER" as string | null }));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => children,
}));

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
      totalCount: 1,
      pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
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
          {
            request: { query: IdpsDocument, variables: { filter: {}, first: 100 } },
            result: idpsResult,
          },
        ]}
      >
        <ToastProvider>
          <IdpPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument(); // completed/total actions

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    expect(screen.getByRole("option", { name: "Berjalan" })).toBeInTheDocument();
  });

  it("filters the list by status when a status is selected", async () => {
    const filteredResult = {
      data: { idps: { ...idpsResult.data.idps, totalCount: 0, edges: [] } },
    };
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: IdpsDocument, variables: { filter: {}, first: 100 } },
            result: idpsResult,
          },
          {
            request: {
              query: IdpsDocument,
              variables: { filter: { status: "COMPLETED" }, first: 100 },
            },
            result: filteredResult,
          },
        ]}
      >
        <ToastProvider>
          <IdpPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("Andi Pratama");

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
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
        <ToastProvider>
          <IdpPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText(/tidak ada idp yang cocok/i)).toBeInTheDocument();
  });

  it("menampilkan daftar hanya-baca tanpa tombol buat untuk Operation (klarifikasi 9)", async () => {
    auth.role = "OPERATION";
    try {
      render(
        <MockedProvider
          mocks={[
            {
              request: { query: IdpsDocument, variables: { filter: {}, first: 100 } },
              result: idpsResult,
            },
          ]}
        >
          <ToastProvider>
            <IdpPage />
          </ToastProvider>
        </MockedProvider>,
      );

      expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
      expect(screen.getByText(/hanya baca/i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /buat idp/i })).toBeNull();
    } finally {
      auth.role = "CHAPTER";
    }
  });

  it("mengarahkan Talent ke IDP miliknya pada entri menu yang sama (klarifikasi 9)", async () => {
    auth.role = "TALENT";
    try {
      render(
        <MockedProvider
          mocks={[
            {
              request: { query: MyIdpDocument },
              result: {
                data: {
                  myIdp: {
                    __typename: "Idp",
                    id: "idp-1",
                    status: "IN_PROGRESS",
                    developmentObjective: "Menjadi Go backend engineer yang andal",
                    currentAssessment: "Kuat di API",
                    gapAnalysis: "Perlu concurrency",
                    timelineStart: "2025-07-01",
                    timelineEnd: "2025-09-30",
                    successIndicators: "3 fitur mandiri",
                    actions: [],
                    reviews: [],
                    revisions: [],
                  },
                },
              },
            },
          ]}
        >
          <ToastProvider>
            <IdpPage />
          </ToastProvider>
        </MockedProvider>,
      );

      expect(await screen.findByText("IDP Saya")).toBeInTheDocument();
      expect(screen.getByText(/menjadi go backend engineer yang andal/i)).toBeInTheDocument();
    } finally {
      auth.role = "CHAPTER";
    }
  });

  it("membuka modal buat IDP saat tombol Buat IDP diklik", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: IdpsDocument, variables: { filter: {}, first: 100 } },
            result: idpsResult,
          },
          {
            request: {
              query: AssignableTalentsDocument,
              variables: {
                first: 100,
                after: null,
                search: null,
                sortBy: "FULL_NAME",
                sortDirection: "ASC",
              },
            },
            result: assignableTalentsResult,
          },
        ]}
      >
        <ToastProvider>
          <IdpPage />
        </ToastProvider>
      </MockedProvider>,
    );

    expect(await screen.findByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /buat idp/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /buat idp/i }));

    expect(await screen.findByRole("dialog", { name: /buat idp/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /talent/i })).toBeInTheDocument();
  });

  it("menutup modal create IDP saat tombol Batal diklik", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: IdpsDocument, variables: { filter: {}, first: 100 } },
            result: idpsResult,
          },
          {
            request: {
              query: AssignableTalentsDocument,
              variables: {
                first: 100,
                after: null,
                search: null,
                sortBy: "FULL_NAME",
                sortDirection: "ASC",
              },
            },
            result: assignableTalentsResult,
          },
        ]}
      >
        <ToastProvider>
          <IdpPage />
        </ToastProvider>
      </MockedProvider>,
    );

    await screen.findByText("Andi Pratama");
    fireEvent.click(screen.getByRole("button", { name: /buat idp/i }));
    expect(await screen.findByRole("dialog", { name: /buat idp/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /batal/i }));
    expect(screen.queryByRole("dialog", { name: /buat idp/i })).toBeNull();
  });
});

describe("CreateIdpForm (Apollo form, US3)", () => {
  const newMocks = [
    {
      request: {
        query: AssignableTalentsDocument,
        variables: {
          first: 100,
          after: null,
          search: null,
          sortBy: "FULL_NAME",
          sortDirection: "ASC",
        },
      },
      result: assignableTalentsResult,
    },
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

  function renderForm() {
    const onSuccess = vi.fn();
    const onBusyChange = vi.fn();
    render(
      <MockedProvider mocks={newMocks}>
        <ToastProvider>
          <CreateIdpForm formId="idp-form" onBusyChange={onBusyChange} onSuccess={onSuccess} />
        </ToastProvider>
      </MockedProvider>,
    );
    return { onSuccess, onBusyChange };
  }

  it("shows required-field errors on an empty submit", async () => {
    renderForm();
    expect(await screen.findByRole("combobox", { name: /talent/i })).toBeInTheDocument();

    fireEvent.submit(document.querySelector("form")!);

    expect(screen.getByText(/talent wajib dipilih/i)).toBeInTheDocument();
    expect(screen.getByText(/development objective wajib diisi/i)).toBeInTheDocument();
    expect(screen.getByText(/tanggal mulai wajib diisi/i)).toBeInTheDocument();
  });

  it("offers only assignable talents and creates an IDP with an action", async () => {
    const { onSuccess } = renderForm();
    expect(await screen.findByRole("combobox", { name: /talent/i })).toBeInTheDocument();

    const talentSelect = screen.getByRole("combobox", { name: /talent/i });
    expect(
      Array.from(talentSelect.querySelectorAll("option")).some((o) =>
        o.textContent?.includes("Andi Pratama"),
      ),
    ).toBe(true);

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
    fireEvent.change(screen.getByLabelText(/timeline selesai/i), {
      target: { value: "2025-09-30" },
    });
    fireEvent.change(screen.getByLabelText(/success indicators/i), {
      target: { value: "Selesaikan 3 fitur" },
    });

    fireEvent.click(screen.getByRole("button", { name: /\+ tambah aksi/i }));
    fireEvent.change(screen.getByLabelText(/deskripsi \/ tindakan/i), {
      target: { value: "Training Go lanjutan" },
    });
    fireEvent.change(screen.getByLabelText(/metode/i), { target: { value: "TRAINING" } });

    fireEvent.submit(document.querySelector("form")!);

    expect(await screen.findByRole("alert")).toHaveTextContent(/berhasil dibuat/i);
    expect(onSuccess).toHaveBeenCalled();
  });

  it("shows an error toast when the create mutation fails", async () => {
    const failingMocks = [
      {
        request: {
          query: AssignableTalentsDocument,
          variables: {
            first: 100,
            after: null,
            search: null,
            sortBy: "FULL_NAME",
            sortDirection: "ASC",
          },
        },
        result: assignableTalentsResult,
      },
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
        <ToastProvider>
          <CreateIdpForm formId="idp-form" onBusyChange={() => {}} />
        </ToastProvider>
      </MockedProvider>,
    );
    expect(await screen.findByRole("combobox", { name: /talent/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /talent/i }), {
      target: { value: "emp-1" },
    });
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
    fireEvent.change(screen.getByLabelText(/timeline selesai/i), {
      target: { value: "2025-09-30" },
    });
    fireEvent.change(screen.getByLabelText(/success indicators/i), {
      target: { value: "Selesaikan 3 fitur" },
    });

    fireEvent.submit(document.querySelector("form")!);

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
        data: {
          addIdpReview: {
            __typename: "ReviewLog",
            id: "rev-2",
            reviewDate: "2025-09-01",
            summary: "Progres stabil",
            followUp: "Lanjut",
            createdAt: "2025-09-01T00:00:00Z",
          },
        },
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
        </React.Suspense>,
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
        </React.Suspense>,
      );
    });

    const statusSelect = (await screen.findByRole("combobox", {
      name: /status aksi training go lanjutan/i,
    })) as HTMLSelectElement;
    fireEvent.change(statusSelect, { target: { value: "COMPLETED" } });

    // refetch (IdpDocument) supplies updated status; await the new select value
    expect(
      await screen.findByRole("combobox", { name: /status aksi training go lanjutan/i }),
    ).toHaveValue("COMPLETED");
  });

  it("records a review check-in", async () => {
    await act(async () => {
      render(
        <React.Suspense fallback={null}>
          <MockedProvider mocks={detailMocks}>
            <IdpDetailPage params={Promise.resolve({ id: "idp-1" })} />
          </MockedProvider>
        </React.Suspense>,
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
        </React.Suspense>,
      );
    });
    await screen.findByText(/tutup idp ini/i);

    fireEvent.click(screen.getByRole("button", { name: /tutup idp/i }));

    expect(await screen.findByText(/idp ditutup/i)).toBeInTheDocument();
  });

  it("menyembunyikan form pengelolaan untuk Operation (klarifikasi 9)", async () => {
    auth.role = "OPERATION";
    try {
      await act(async () => {
        render(
          <React.Suspense fallback={null}>
            <MockedProvider mocks={detailMocks}>
              <IdpDetailPage params={Promise.resolve({ id: "idp-1" })} />
            </MockedProvider>
          </React.Suspense>,
        );
      });

      expect(await screen.findByText(/training go lanjutan/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: /status aksi training go lanjutan/i }),
      ).toBeNull();
      expect(screen.queryByText(/tambah aksi pengembangan/i)).toBeNull();
      expect(screen.queryByText(/catat hasil review/i)).toBeNull();
      expect(screen.queryByText(/tutup idp ini/i)).toBeNull();
    } finally {
      auth.role = "CHAPTER";
    }
  });
});
