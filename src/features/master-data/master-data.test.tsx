// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import UnitsPage from "@/app/(app)/master-data/units/page";
import {
  CreateUnitDocument,
  SetUnitActiveDocument,
  UnitsDocument,
  UpdateUnitDocument,
} from "@/generated/graphql";

const UNITS_QUERY = {
  request: { query: UnitsDocument, variables: { includeInactive: true } },
  result: {
    data: {
      units: [
        {
          id: "u-1",
          name: "Digital Business & Technology",
          isActive: true,
          projects: [],
          __typename: "Unit",
        },
      ],
    },
  },
};

describe("master-data CRUD (Admin) — T052/T054", () => {
  it("creates a unit and shows the success toast", async () => {
    const mocks = [
      UNITS_QUERY,
      {
        request: { query: CreateUnitDocument, variables: { name: "Engineering" } },
        result: {
          data: {
            createUnit: { id: "u-2", name: "Engineering", isActive: true, projects: [], __typename: "Unit" },
          },
        },
      },
      UNITS_QUERY,
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tambah Unit" }));
    fireEvent.change(screen.getByLabelText("Nama Unit"), { target: { value: "Engineering" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent('Unit "Engineering" berhasil dibuat.');
  });

  it("renames a unit via the edit form", async () => {
    const mocks = [
      UNITS_QUERY,
      {
        request: { query: UpdateUnitDocument, variables: { id: "u-1", name: "Digital" } },
        result: {
          data: {
            updateUnit: { id: "u-1", name: "Digital", isActive: true, projects: [], __typename: "Unit" },
          },
        },
      },
      UNITS_QUERY,
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ubah" }));
    fireEvent.change(screen.getByLabelText("Nama Unit"), { target: { value: "Digital" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unit berhasil diubah.");
  });

  it("deactivates a unit and shows the success toast", async () => {
    const mocks = [
      UNITS_QUERY,
      {
        request: { query: SetUnitActiveDocument, variables: { id: "u-1", isActive: false } },
        result: {
          data: {
            setUnitActive: { id: "u-1", name: "Digital Business & Technology", isActive: false, projects: [], __typename: "Unit" },
          },
        },
      },
      UNITS_QUERY,
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unit berhasil dinonaktifkan.");
  });

  it("surfaces the server validation message when deactivation is rejected (T054)", async () => {
    const serverMessage = "Unit masih direferensikan oleh proyek, tidak dapat dinonaktifkan.";
    const mocks = [
      UNITS_QUERY,
      {
        request: { query: SetUnitActiveDocument, variables: { id: "u-1", isActive: false } },
        error: new Error(serverMessage),
      },
    ];
    render(
      <MockedProvider mocks={mocks}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(serverMessage);
  });

  it("blocks creating a unit with an empty name (client-side)", async () => {
    render(
      <MockedProvider mocks={[UNITS_QUERY]}>
        <ToastProvider>
          <UnitsPage />
        </ToastProvider>
      </MockedProvider>
    );

    expect(await screen.findByText("Digital Business & Technology")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tambah Unit" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(screen.getByText("Nama Unit wajib diisi.")).toBeInTheDocument());
  });
});