// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import AccountsPage from "@/app/(app)/accounts/page";
import {
  CreateUserAccountDocument,
  EmployeesDocument,
  RevokeUserSessionsDocument,
  SetUserAccountStatusDocument,
  UpdateUserAccessRoleDocument,
  UsersDocument,
} from "@/generated/graphql";

const USERS_QUERY = {
  request: { query: UsersDocument },
  result: {
    data: {
      users: [
        {
          id: "usr-1",
          fullName: "Sari Dewi",
          email: "sari@telkom.co.id",
          accessRole: "ADMIN",
          status: "ACTIVE",
          __typename: "User",
        },
        {
          id: "usr-2",
          fullName: "Budi Santoso",
          email: "budi@telkom.co.id",
          accessRole: "TALENT",
          status: "INACTIVE",
          __typename: "User",
        },
      ],
    },
  },
};

const USERS_QUERY_AFTER_ROLE_CHANGE = {
  request: { query: UsersDocument },
  result: {
    data: {
      users: [
        {
          id: "usr-1",
          fullName: "Sari Dewi",
          email: "sari@telkom.co.id",
          accessRole: "ADMIN",
          status: "ACTIVE",
          __typename: "User",
        },
        {
          id: "usr-2",
          fullName: "Budi Santoso",
          email: "budi@telkom.co.id",
          accessRole: "CHAPTER",
          status: "INACTIVE",
          __typename: "User",
        },
      ],
    },
  },
};

const EMPLOYEES_QUERY = {
  request: { query: EmployeesDocument, variables: { filter: {}, first: 100, after: null } },
  result: {
    data: {
      employees: {
        totalCount: 1,
        edges: [
          {
            node: {
              id: "emp-1",
              fullName: "Ahmad Fauzi",
              nomorInduk: "EMP-0100",
              email: "ahmad@telkom.co.id",
              status: "ACTIVE",
              assignable: true,
              unit: { id: "u-1", name: "Digital", __typename: "Unit" },
              jobRole: { id: "jr-1", name: "Engineer", __typename: "JobRole" },
              __typename: "Employee",
            },
            cursor: "c1",
            __typename: "EmployeeEdge",
          },
        ],
        pageInfo: { hasNextPage: false, endCursor: "c1", __typename: "PageInfo" },
        __typename: "EmployeeConnection",
      },
    },
  },
};

function renderPage(mocks: unknown[]) {
  render(
    <MockedProvider mocks={mocks as never}>
      <ToastProvider>
        <AccountsPage />
      </ToastProvider>
    </MockedProvider>,
  );
}

function rowOf(name: string) {
  const cell = screen.getByText(name).closest("tr");
  if (!cell) throw new Error(`row for ${name} not found`);
  return cell as HTMLElement;
}

describe("accounts management (Admin) — T053", () => {
  it("lists accounts with role badges and status", async () => {
    renderPage([USERS_QUERY, EMPLOYEES_QUERY]);

    await screen.findByText("Sari Dewi");
    const adminRow = rowOf("Sari Dewi");
    expect(within(adminRow).getAllByRole("cell")[2]).toHaveTextContent("Admin");
    expect(within(adminRow).getAllByRole("cell")[3]).toHaveTextContent("Aktif");
    expect(screen.getByLabelText("Ubah peran Sari Dewi")).toHaveValue("ADMIN");

    const talentRow = rowOf("Budi Santoso");
    expect(within(talentRow).getAllByRole("cell")[2]).toHaveTextContent("Talent");
    expect(within(talentRow).getAllByRole("cell")[3]).toHaveTextContent("Nonaktif");
  });

  it("blocks creating an account without employee, email, and role (client-side)", async () => {
    renderPage([USERS_QUERY, EMPLOYEES_QUERY]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(screen.getByRole("button", { name: "Tambah Akun" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(screen.getByText("Karyawan wajib dipilih.")).toBeInTheDocument();
    expect(screen.getByText("Email wajib diisi.")).toBeInTheDocument();
    expect(screen.getByText("Peran akses wajib dipilih.")).toBeInTheDocument();
  });

  it("creates an account for an employee and shows the success toast", async () => {
    renderPage([
      USERS_QUERY,
      EMPLOYEES_QUERY,
      {
        request: {
          query: CreateUserAccountDocument,
          variables: {
            employeeId: "emp-1",
            email: "ahmad@telkom.co.id",
            accessRole: "TALENT",
            temporaryPassword: null,
          },
        },
        result: {
          data: {
            createUserAccount: {
              id: "usr-3",
              fullName: "Ahmad Fauzi",
              email: "ahmad@telkom.co.id",
              accessRole: "TALENT",
              status: "ACTIVE",
              __typename: "User",
            },
          },
        },
      },
      USERS_QUERY,
    ]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(screen.getByRole("button", { name: "Tambah Akun" }));
    fireEvent.change(screen.getByLabelText("Karyawan"), { target: { value: "emp-1" } });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ahmad@telkom.co.id" },
    });
    fireEvent.change(screen.getByLabelText("Peran Akses"), { target: { value: "TALENT" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      'Akun "ahmad@telkom.co.id" berhasil dibuat.',
    );
  });

  it("surfaces the server validation message on the create form", async () => {
    const serverMessage = "Karyawan sudah memiliki akun.";
    renderPage([
      USERS_QUERY,
      EMPLOYEES_QUERY,
      {
        request: {
          query: CreateUserAccountDocument,
          variables: {
            employeeId: "emp-1",
            email: "ahmad@telkom.co.id",
            accessRole: "TALENT",
            temporaryPassword: null,
          },
        },
        error: new Error(serverMessage),
      },
    ]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(screen.getByRole("button", { name: "Tambah Akun" }));
    fireEvent.change(screen.getByLabelText("Karyawan"), { target: { value: "emp-1" } });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ahmad@telkom.co.id" },
    });
    fireEvent.change(screen.getByLabelText("Peran Akses"), { target: { value: "TALENT" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByText(serverMessage)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("ahmad@telkom.co.id");
  });

  it("changes a user's access role and reflects it in the list (scenario 8)", async () => {
    renderPage([
      USERS_QUERY,
      EMPLOYEES_QUERY,
      {
        request: {
          query: UpdateUserAccessRoleDocument,
          variables: { userId: "usr-2", accessRole: "CHAPTER" },
        },
        result: {
          data: {
            updateUserAccessRole: {
              id: "usr-2",
              fullName: "Budi Santoso",
              email: "budi@telkom.co.id",
              accessRole: "CHAPTER",
              status: "INACTIVE",
              __typename: "User",
            },
          },
        },
      },
      USERS_QUERY_AFTER_ROLE_CHANGE,
    ]);

    await screen.findByText("Budi Santoso");
    fireEvent.change(screen.getByLabelText("Ubah peran Budi Santoso"), {
      target: { value: "CHAPTER" },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Peran akses berhasil diubah.");
    expect(within(rowOf("Budi Santoso")).getAllByRole("cell")[2]).toHaveTextContent("Chapter");
  });

  it("deactivates an account and shows the success toast", async () => {
    renderPage([
      USERS_QUERY,
      EMPLOYEES_QUERY,
      {
        request: {
          query: SetUserAccountStatusDocument,
          variables: { userId: "usr-1", status: "INACTIVE" },
        },
        result: {
          data: {
            setUserAccountStatus: {
              id: "usr-1",
              fullName: "Sari Dewi",
              email: "sari@telkom.co.id",
              accessRole: "ADMIN",
              status: "INACTIVE",
              __typename: "User",
            },
          },
        },
      },
      USERS_QUERY,
    ]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Akun berhasil dinonaktifkan.");
  });

  it("revokes sessions only after the confirmation step", async () => {
    renderPage([
      USERS_QUERY,
      EMPLOYEES_QUERY,
      {
        request: { query: RevokeUserSessionsDocument, variables: { userId: "usr-1" } },
        result: { data: { revokeUserSessions: true } },
      },
    ]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(within(rowOf("Sari Dewi")).getByRole("button", { name: "Cabut Sesi" }));

    expect(screen.getByText("Cabut semua sesi akun ini?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ya, cabut" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sesi pengguna berhasil dicabut.");
  });

  it("surfaces the server message when revoking sessions fails", async () => {
    const serverMessage = "Sesi tidak dapat dicabut.";
    renderPage([
      USERS_QUERY,
      EMPLOYEES_QUERY,
      {
        request: { query: RevokeUserSessionsDocument, variables: { userId: "usr-1" } },
        error: new Error(serverMessage),
      },
    ]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(within(rowOf("Sari Dewi")).getByRole("button", { name: "Cabut Sesi" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya, cabut" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(serverMessage);
  });
});
