// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import AccountsPage from "@/app/(app)/accounts/page";
import {
  CreateUserAccountDocument,
  EmployeeLookupDocument,
  RevokeUserSessionsDocument,
  RolesDocument,
  SetUserAccountStatusDocument,
  UpdateUserAccessRoleDocument,
  UsersDocument,
} from "@/generated/graphql";

// Access roles come from the API (W3 / TAN-264): the pickers list built-ins and
// custom roles alike, so the page always asks for `roles`.
const ROLES_QUERY = {
  request: { query: RolesDocument, variables: { includeInactive: true } },
  result: {
    data: {
      roles: [
        {
          id: "role-admin",
          name: "ADMIN",
          label: "Admin",
          templateRole: "ADMIN",
          builtIn: true,
          status: "ACTIVE",
          __typename: "Role",
        },
        {
          id: "role-operation",
          name: "OPERATION",
          label: "Operation",
          templateRole: "OPERATION",
          builtIn: true,
          status: "ACTIVE",
          __typename: "Role",
        },
        {
          id: "role-chapter",
          name: "CHAPTER",
          label: "Chapter",
          templateRole: "CHAPTER",
          builtIn: true,
          status: "ACTIVE",
          __typename: "Role",
        },
        {
          id: "role-talent",
          name: "TALENT",
          label: "Talent",
          templateRole: "TALENT",
          builtIn: true,
          status: "ACTIVE",
          __typename: "Role",
        },
        {
          id: "role-pm",
          name: "PM_CHAPTER",
          label: "PM Chapter",
          templateRole: "CHAPTER",
          builtIn: false,
          status: "ACTIVE",
          __typename: "Role",
        },
      ],
    },
  },
};

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
          roleName: "ADMIN",
          status: "ACTIVE",
          employee: {
            chapter: null,
            __typename: "Employee",
          },
          __typename: "User",
        },
        {
          id: "usr-2",
          fullName: "Budi Santoso",
          email: "budi@telkom.co.id",
          accessRole: "TALENT",
          roleName: "TALENT",
          status: "INACTIVE",
          employee: {
            chapter: null,
            __typename: "Employee",
          },
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
          roleName: "ADMIN",
          status: "ACTIVE",
          employee: {
            chapter: null,
            __typename: "Employee",
          },
          __typename: "User",
        },
        {
          id: "usr-2",
          fullName: "Budi Santoso",
          email: "budi@telkom.co.id",
          accessRole: "CHAPTER",
          roleName: "CHAPTER",
          status: "INACTIVE",
          employee: {
            chapter: { id: "ch-1", name: "Design", __typename: "Chapter" },
            __typename: "Employee",
          },
          __typename: "User",
        },
      ],
    },
  },
};

const EMPLOYEE_1 = {
  id: "emp-1",
  fullName: "Ahmad Fauzi",
  nomorInduk: "EMP-0100",
  email: "ahmad@telkom.co.id",
  __typename: "Employee",
};

function employeeLookupMock(search: string | undefined, nodes: unknown[]) {
  return {
    request: {
      query: EmployeeLookupDocument,
      variables: {
        filter: search ? { search } : {},
        first: 10,
        after: null,
      },
    },
    result: {
      data: {
        employeeLookup: {
          totalCount: nodes.length,
          edges: nodes.map((n) => ({
            node: n,
            cursor: `c-${(n as { id: string }).id}`,
            __typename: "EmployeeEdge",
          })),
          pageInfo: {
            hasNextPage: false,
            endCursor: nodes.length ? `c-${(nodes[nodes.length - 1] as { id: string }).id}` : null,
            __typename: "PageInfo",
          },
          __typename: "EmployeeConnection",
        },
      },
    },
  };
}

function renderPage(mocks: unknown[]) {
  render(
    <MockedProvider mocks={[ROLES_QUERY, ...mocks] as never}>
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

async function openCreateForm() {
  fireEvent.click(screen.getByRole("button", { name: "Tambah Akun" }));
  expect(screen.getByRole("dialog", { name: "Tambah Akun" })).toBeInTheDocument();
  // The picker mounts and fires an initial empty-search query.
  await screen.findByRole("combobox", { name: /karyawan/i });
}

async function selectEmployeeByName(name: string) {
  const input = screen.getByRole("combobox", { name: /karyawan/i });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: name } });
  // Wait for the debounced query to resolve and the option to appear.
  const option = await screen.findByRole("option", { name: new RegExp(name, "i") });
  fireEvent.mouseDown(option);
}

describe("accounts management (Admin) — T053", () => {
  it("lists accounts with role badges and status", async () => {
    renderPage([USERS_QUERY]);

    await screen.findByText("Sari Dewi");
    const adminRow = rowOf("Sari Dewi");
    expect(within(adminRow).getAllByRole("cell")[2]).toHaveTextContent("Admin");
    expect(within(adminRow).getAllByRole("cell")[3]).toHaveTextContent("—");
    expect(within(adminRow).getAllByRole("cell")[4]).toHaveTextContent("Aktif");
    fireEvent.click(within(adminRow).getByRole("button", { name: "Aksi Sari Dewi" }));
    expect(screen.getByLabelText("Ubah peran Sari Dewi")).toHaveValue("ADMIN");

    const talentRow = rowOf("Budi Santoso");
    expect(within(talentRow).getAllByRole("cell")[2]).toHaveTextContent("Talent");
    expect(within(talentRow).getAllByRole("cell")[3]).toHaveTextContent("—");
    expect(within(talentRow).getAllByRole("cell")[4]).toHaveTextContent("Nonaktif");
  });

  it("blocks creating an account without employee, email, and role (client-side)", async () => {
    renderPage([USERS_QUERY, employeeLookupMock(undefined, [])]);

    await screen.findByText("Sari Dewi");
    await openCreateForm();
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(screen.getByText("Karyawan wajib dipilih.")).toBeInTheDocument();
    expect(screen.getByText("Email wajib diisi.")).toBeInTheDocument();
    expect(screen.getByText("Peran akses wajib dipilih.")).toBeInTheDocument();
  });

  it("creates an account for an employee and shows the success toast", async () => {
    renderPage([
      USERS_QUERY,
      employeeLookupMock(undefined, [EMPLOYEE_1]),
      employeeLookupMock("Ahmad", [EMPLOYEE_1]),
      {
        request: {
          query: CreateUserAccountDocument,
          variables: {
            employeeId: "emp-1",
            email: "ahmad@telkom.co.id",
            roleName: "TALENT",
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
              roleName: "TALENT",
              status: "ACTIVE",
              __typename: "User",
            },
          },
        },
      },
      USERS_QUERY,
    ]);

    await screen.findByText("Sari Dewi");
    await openCreateForm();
    await selectEmployeeByName("Ahmad");
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ahmad@telkom.co.id" },
    });
    fireEvent.change(screen.getByLabelText("Peran Akses"), { target: { value: "TALENT" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      'Akun "ahmad@telkom.co.id" berhasil dibuat.',
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("surfaces the server validation message on the create form", async () => {
    const serverMessage = "Karyawan sudah memiliki akun.";
    renderPage([
      USERS_QUERY,
      employeeLookupMock(undefined, [EMPLOYEE_1]),
      employeeLookupMock("Ahmad", [EMPLOYEE_1]),
      {
        request: {
          query: CreateUserAccountDocument,
          variables: {
            employeeId: "emp-1",
            email: "ahmad@telkom.co.id",
            roleName: "TALENT",
            temporaryPassword: null,
          },
        },
        error: new Error(serverMessage),
      },
    ]);

    await screen.findByText("Sari Dewi");
    await openCreateForm();
    await selectEmployeeByName("Ahmad");
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
      {
        request: {
          query: UpdateUserAccessRoleDocument,
          variables: { userId: "usr-2", roleName: "CHAPTER" },
        },
        result: {
          data: {
            updateUserAccessRole: {
              id: "usr-2",
              fullName: "Budi Santoso",
              email: "budi@telkom.co.id",
              accessRole: "CHAPTER",
              roleName: "CHAPTER",
              status: "INACTIVE",
              __typename: "User",
            },
          },
        },
      },
      USERS_QUERY_AFTER_ROLE_CHANGE,
    ]);

    await screen.findByText("Budi Santoso");
    fireEvent.click(
      within(rowOf("Budi Santoso")).getByRole("button", { name: "Aksi Budi Santoso" }),
    );
    fireEvent.change(screen.getByLabelText("Ubah peran Budi Santoso"), {
      target: { value: "CHAPTER" },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Peran akses berhasil diubah.");
    expect(within(rowOf("Budi Santoso")).getAllByRole("cell")[2]).toHaveTextContent("Chapter");
    expect(await within(rowOf("Budi Santoso")).findByText("Design")).toBeInTheDocument();
  });

  it("deactivates an account and shows the success toast", async () => {
    renderPage([
      USERS_QUERY,
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
              roleName: "ADMIN",
              status: "INACTIVE",
              __typename: "User",
            },
          },
        },
      },
      USERS_QUERY,
    ]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(within(rowOf("Sari Dewi")).getByRole("button", { name: "Aksi Sari Dewi" }));
    fireEvent.click(within(rowOf("Sari Dewi")).getByRole("button", { name: "Nonaktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Akun berhasil dinonaktifkan.");
  });

  it("revokes sessions only after the confirmation step", async () => {
    renderPage([
      USERS_QUERY,
      {
        request: { query: RevokeUserSessionsDocument, variables: { userId: "usr-1" } },
        result: { data: { revokeUserSessions: true } },
      },
    ]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(within(rowOf("Sari Dewi")).getByRole("button", { name: "Aksi Sari Dewi" }));
    fireEvent.click(within(rowOf("Sari Dewi")).getByRole("button", { name: "Cabut Sesi" }));

    expect(screen.getByText("Cabut semua sesi akun ini?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ya, cabut" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sesi pengguna berhasil dicabut.");
  });

  it("surfaces the server message when revoking sessions fails", async () => {
    const serverMessage = "Sesi tidak dapat dicabut.";
    renderPage([
      USERS_QUERY,
      {
        request: { query: RevokeUserSessionsDocument, variables: { userId: "usr-1" } },
        error: new Error(serverMessage),
      },
    ]);

    await screen.findByText("Sari Dewi");
    fireEvent.click(within(rowOf("Sari Dewi")).getByRole("button", { name: "Aksi Sari Dewi" }));
    fireEvent.click(within(rowOf("Sari Dewi")).getByRole("button", { name: "Cabut Sesi" }));
    fireEvent.click(screen.getByRole("button", { name: "Ya, cabut" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(serverMessage);
  });
});
