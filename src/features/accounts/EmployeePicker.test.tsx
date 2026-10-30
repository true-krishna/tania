// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
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

const FILTERED_QUERY = {
  request: {
    query: EmployeeLookupDocument,
    variables: { filter: { search: "Zulkifli" }, first: 10, after: null },
  },
  result: {
    data: {
      employeeLookup: {
        totalCount: 1,
        edges: [
          {
            node: {
              id: "emp-9",
              fullName: "Zulkifli Rahman",
              nomorInduk: "EMP-0909",
              email: "zulkifli@telkom.co.id",
              __typename: "Employee",
            },
            cursor: "c-emp-9",
            __typename: "EmployeeEdge",
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: "c-emp-9",
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

/** Mirrors AccountsSection: the picked id is lifted into the parent's form state. */
function ControlledPicker() {
  const [value, setValue] = React.useState("");
  return <EmployeePicker label="Karyawan" onChange={setValue} value={value} />;
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
    render(
      <MockedProvider mocks={[EMPLOYEES_QUERY, FILTERED_QUERY] as never}>
        <ControlledPicker />
      </MockedProvider>,
    );
    const input = await openOptions();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("(EMP-0101)")).toBeInTheDocument();
  });

  it("keeps a picked employee outside the default page visible as a chip", async () => {
    render(
      <MockedProvider mocks={[EMPLOYEES_QUERY, FILTERED_QUERY] as never}>
        <ControlledPicker />
      </MockedProvider>,
    );

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Zulkifli" } });

    const option = await screen.findByRole("option", { name: /Zulkifli Rahman/ });
    fireEvent.mouseDown(option);

    // Let the debounced query settle back to the unfiltered first page: the
    // picked employee is not on it, so the chip has to survive on its own.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(screen.getByText("Zulkifli Rahman")).toBeInTheDocument();
    expect(screen.getByText("(EMP-0909)")).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("");

    fireEvent.focus(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("(EMP-0909)")).toBeInTheDocument();
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
