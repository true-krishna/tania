// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { EmployeeLookupDocument } from "@/generated/graphql";
import { EmployeePicker } from "./EmployeePicker";

const EMPLOYEES_QUERY = {
  request: {
    query: EmployeeLookupDocument,
    variables: { filter: {}, first: 10, after: null },
  },
  result: {
    data: {
      employeeLookup: {
        totalCount: 2,
        edges: [
          {
            node: {
              id: "emp-1",
              fullName: "Ahmad Fauzi",
              nomorInduk: "EMP-0100",
              email: "ahmad@telkom.co.id",
              __typename: "Employee",
            },
            cursor: "c-emp-1",
            __typename: "EmployeeEdge",
          },
          {
            node: {
              id: "emp-2",
              fullName: "Budi Santoso",
              nomorInduk: "EMP-0101",
              email: "budi@telkom.co.id",
              __typename: "Employee",
            },
            cursor: "c-emp-2",
            __typename: "EmployeeEdge",
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: "c-emp-2",
          __typename: "PageInfo",
        },
        __typename: "EmployeeConnection",
      },
    },
  },
};

function renderPicker({
  label = "Karyawan",
  onChange = vi.fn(),
  value = "",
}: {
  label?: string;
  onChange?: (employeeId: string) => void;
  value?: string;
} = {}) {
  return render(
    <MockedProvider mocks={[EMPLOYEES_QUERY] as never}>
      <EmployeePicker label={label} onChange={onChange} value={value} />
    </MockedProvider>,
  );
}

async function openOptions() {
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  await screen.findByRole("option", { name: /Ahmad Fauzi/ });
  return input;
}

describe("EmployeePicker", () => {
  it("keeps the label and input id stable across re-renders", () => {
    const { rerender } = renderPicker();
    const initialId = screen.getByRole("combobox", { name: "Karyawan" }).id;

    expect(initialId).not.toBe("");
    expect(screen.getByText("Karyawan").closest("label")).toHaveAttribute("for", initialId);

    rerender(
      <MockedProvider mocks={[EMPLOYEES_QUERY] as never}>
        <EmployeePicker label="Pemilik" onChange={() => {}} value="" />
      </MockedProvider>,
    );

    const updatedInput = screen.getByRole("combobox", { name: "Pemilik" });
    expect(updatedInput.id).toBe(initialId);
    expect(screen.getByText("Pemilik").closest("label")).toHaveAttribute("for", initialId);
  });

  it("selects the active option with ArrowDown and Enter", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    const input = await openOptions();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("emp-2");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("clears the selected employee", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange, value: "emp-1" });
    await openOptions();

    fireEvent.click(screen.getByRole("button", { name: "Bersihkan pilihan karyawan" }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("closes the option list on an outside click", async () => {
    renderPicker();
    await openOptions();
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
