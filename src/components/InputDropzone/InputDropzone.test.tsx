// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { InputDropzone } from "./InputDropzone";

const xlsxFile = (name = "assignment.xlsx") =>
  new File(["content"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

async function dropFiles(files: readonly File[]) {
  const input = screen.getByLabelText("Unggah berkas Excel") as HTMLInputElement;
  expect(input).not.toBeNull();
  fireEvent.change(input, { target: { files } });
  await Promise.resolve();
}

describe("InputDropzone", () => {
  it("forwards the dropped file and clears it from the chip", async () => {
    const onFileSelect = vi.fn();
    const { rerender } = render(
      <InputDropzone ariaLabel="Unggah berkas Excel" onFileSelect={onFileSelect} />,
    );

    expect(screen.getByText(/tarik dan letakkan berkas di sini/i)).not.toBeNull();

    await dropFiles([xlsxFile()]);
    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "assignment.xlsx" }));

    rerender(
      <InputDropzone
        ariaLabel="Unggah berkas Excel"
        onFileSelect={onFileSelect}
        selectedName="assignment.xlsx"
      />,
    );
    expect(screen.getByText("assignment.xlsx")).not.toBeNull();

    fireEvent.click(screen.getByLabelText("Hapus berkas terpilih"));
    expect(onFileSelect).toHaveBeenLastCalledWith(null);

    rerender(<InputDropzone ariaLabel="Unggah berkas Excel" onFileSelect={onFileSelect} />);
    expect(screen.queryByText("assignment.xlsx")).toBeNull();
  });

  it("forwards a rejected file so the caller can report the format error", async () => {
    const onFileSelect = vi.fn();
    render(
      <InputDropzone
        accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }}
        ariaLabel="Unggah berkas Excel"
        onFileSelect={onFileSelect}
      />,
    );

    await dropFiles([new File(["content"], "talent.csv", { type: "text/csv" })]);
    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining({ name: "talent.csv" }));
  });
});
