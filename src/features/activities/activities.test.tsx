// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { ActivitiesProvider } from "./ActivitiesProvider";
import { ActivitiesPageView } from "./ActivitiesPageView";
import { ActivityForm } from "./ActivityForm";
import { ActivityList } from "./ActivityList";
import {
  ACTIVITY_PRIORITIES,
  ACTIVITY_PROJECTS,
  ACTIVITY_STATUSES,
  CURRENT_TALENT_ID,
  SEED_ACTIVITIES,
} from "./mocks";
import type { PersonalWorkActivity } from "./types";

const FORM_PROPS = {
  formId: "activity-form",
  projects: ACTIVITY_PROJECTS,
  priorities: ACTIVITY_PRIORITIES,
  statuses: ACTIVITY_STATUSES,
};

function renderWorkspace() {
  return render(
    <ActivitiesProvider delayMs={0}>
      <ActivitiesPageView />
    </ActivitiesProvider>,
  );
}

describe("ActivityForm — training clears and disables the project field", () => {
  it("clears the chosen project and disables the select when the type becomes training", () => {
    render(<ActivityForm {...FORM_PROPS} onSubmit={vi.fn()} />);

    const project = screen.getByLabelText("Project") as HTMLSelectElement;
    fireEvent.change(project, { target: { value: "proj-tania" } });
    expect(project.value).toBe("proj-tania");

    fireEvent.change(screen.getByLabelText("Jenis aktivitas"), {
      target: { value: "training" },
    });

    expect(project.value).toBe("");
    expect(project).toBeDisabled();
    expect(screen.getByText("Pelatihan tidak terikat project.")).toBeInTheDocument();
  });

  it("never requires a project for a training activity", async () => {
    const onSubmit = vi.fn();
    render(<ActivityForm {...FORM_PROPS} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Judul aktivitas"), {
      target: { value: "Pelatihan arsitektur" },
    });
    fireEvent.change(screen.getByLabelText("Jenis aktivitas"), {
      target: { value: "training" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal mulai"), {
      target: { value: "2026-10-05" },
    });
    fireEvent.change(screen.getByLabelText("Prioritas"), {
      target: { value: "prio-medium" },
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "status-todo" },
    });
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: "Pelatihan arsitektur",
      activityType: "training",
      projectId: null,
    });
  });

  it("blocks submit and shows field errors when required inputs are missing", () => {
    const onSubmit = vi.fn();
    render(<ActivityForm {...FORM_PROPS} onSubmit={onSubmit} />);

    fireEvent.submit(document.querySelector("form")!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Judul aktivitas wajib diisi.")).toBeInTheDocument();
    expect(screen.getByText("Tanggal mulai wajib diisi.")).toBeInTheDocument();
  });

  it("rejects an end date before the start date", () => {
    const onSubmit = vi.fn();
    render(<ActivityForm {...FORM_PROPS} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Judul aktivitas"), {
      target: { value: "Aktivitas" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal mulai"), {
      target: { value: "2026-10-10" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal selesai (opsional)"), {
      target: { value: "2026-10-01" },
    });
    fireEvent.submit(document.querySelector("form")!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("Tanggal selesai tidak boleh mendahului tanggal mulai."),
    ).toBeInTheDocument();
  });

  it("exposes the passed form id for the external footer submit button", () => {
    render(<ActivityForm {...FORM_PROPS} onSubmit={vi.fn()} />);
    expect(document.querySelector("form")).toHaveAttribute("id", "activity-form");
  });
});

describe("ActivityList — states and ownership", () => {
  it("renders the loading state", () => {
    render(
      <ActivityList
        activities={undefined}
        currentTalentId={CURRENT_TALENT_ID}
        error={null}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        status="loading"
      />,
    );
    expect(screen.getByText("Memuat aktivitas…")).toBeInTheDocument();
  });

  it("renders the error state with a retry action", () => {
    const onRetry = vi.fn();
    render(
      <ActivityList
        activities={undefined}
        currentTalentId={CURRENT_TALENT_ID}
        error="Gagal memuat aktivitas."
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onRetry={onRetry}
        status="error"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Gagal memuat aktivitas.");
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the empty state", () => {
    render(
      <ActivityList
        activities={[]}
        currentTalentId={CURRENT_TALENT_ID}
        error={null}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        status="ready"
      />,
    );
    expect(screen.getByText("Belum ada aktivitas yang cocok dengan filter.")).toBeInTheDocument();
  });

  it("offers edit and delete on owned rows only", () => {
    const foreign: PersonalWorkActivity = { ...SEED_ACTIVITIES[0], id: "act-x", talentId: "emp-999" };
    render(
      <ActivityList
        activities={[SEED_ACTIVITIES[0], foreign]}
        currentTalentId={CURRENT_TALENT_ID}
        error={null}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        status="ready"
      />,
    );
    const kebabs = screen.getAllByRole("button", { name: /^Aksi / });
    expect(kebabs).toHaveLength(2);
    expect(kebabs[0]).toBeEnabled();
    expect(kebabs[1]).toBeDisabled();
  });
});

describe("ActivitiesPageView — create, edit, delete against the store", () => {
  it("places footer actions outside the activity form", async () => {
    renderWorkspace();
    await screen.findByText("Implementasi form aktivitas");

    fireEvent.click(screen.getByRole("button", { name: "+ Catat aktivitas" }));
    const form = document.querySelector("form");
    const submit = screen.getByRole("button", { name: "Simpan aktivitas" });

    expect(form).not.toBeNull();
    expect(form?.contains(submit)).toBe(false);
    expect(submit).toHaveAttribute("form", form?.id);
  });

  it("creates an activity end-to-end and shows the success state", async () => {
    renderWorkspace();
    await screen.findByText("Implementasi form aktivitas");

    fireEvent.click(screen.getByRole("button", { name: "+ Catat aktivitas" }));
    expect(screen.getByRole("dialog", { name: "Catat aktivitas" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Judul aktivitas"), {
      target: { value: "Review arsitektur WAD" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal mulai"), {
      target: { value: "2026-10-04" },
    });
    fireEvent.change(screen.getByLabelText("Prioritas"), { target: { value: "prio-high" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "status-progress" } });
    fireEvent.change(screen.getByLabelText("Project"), { target: { value: "proj-wad" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan aktivitas" }));

    expect(
      await screen.findByText('Aktivitas "Review arsitektur WAD" berhasil dicatat.'),
    ).toBeInTheDocument();
    expect(screen.getByText("Review arsitektur WAD")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edits an owned activity", async () => {
    renderWorkspace();
    await screen.findByText("Implementasi form aktivitas");

    fireEvent.click(screen.getByRole("button", { name: "Aksi Implementasi form aktivitas" }));
    fireEvent.click(screen.getByRole("button", { name: "Ubah" }));
    expect(screen.getByRole("dialog", { name: "Ubah aktivitas" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Judul aktivitas"), {
      target: { value: "Implementasi form aktivitas v2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));

    expect(
      await screen.findByText('Aktivitas "Implementasi form aktivitas v2" berhasil diperbarui.'),
    ).toBeInTheDocument();
    expect(screen.getByText("Implementasi form aktivitas v2")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes an owned activity", async () => {
    renderWorkspace();
    await screen.findByText("Implementasi form aktivitas");

    fireEvent.click(screen.getByRole("button", { name: "Aksi Implementasi form aktivitas" }));
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    await waitFor(() => expect(screen.queryByText("Implementasi form aktivitas")).toBeNull());
    expect(screen.getByText('Aktivitas "Implementasi form aktivitas" dihapus.')).toBeInTheDocument();
  });

  it("filters the list by type and status", async () => {
    renderWorkspace();
    const table = await screen.findByRole("table", { name: "Daftar aktivitas saya" });
    expect(within(table).getByText("Pelatihan Go Clean Architecture")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "status-done" },
    });

    await waitFor(() =>
      expect(within(table).queryByText("Implementasi form aktivitas")).toBeNull(),
    );
    expect(within(table).getByText("Pelatihan Go Clean Architecture")).toBeInTheDocument();
  });
});
