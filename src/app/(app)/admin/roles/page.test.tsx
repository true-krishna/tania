// @vitest-environment jsdom

// Admin-only guard of the configuration page (W3 / TAN-264 AC7). The server
// refuses every query and mutation of this page to a non-Admin; this guard only
// keeps a non-Admin from landing on a page they cannot read.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RolesAdminPage from "./page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const session = vi.hoisted(() => ({ role: "ADMIN" as string | null }));
vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => session.role,
}));

// The page body is exercised in src/features/roles/rolesAdmin.test.tsx; here the
// guard is the subject, so the body is a marker.
vi.mock("@/features/roles/RolesAdminSection", () => ({
  RolesAdminSection: () => <div>grid menu</div>,
}));

beforeEach(() => {
  replace.mockClear();
  session.role = "ADMIN";
});

describe("/admin/roles — hanya Admin", () => {
  it("merender konfigurasi untuk Admin", () => {
    render(<RolesAdminPage />);
    expect(screen.getByText("grid menu")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("mengembalikan non-Admin ke dashboard dan tidak merender konfigurasi", () => {
    session.role = "CHAPTER";
    render(<RolesAdminPage />);
    expect(screen.queryByText("grid menu")).toBeNull();
    expect(screen.getByText(/hanya dapat diakses oleh peran Admin/i)).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("menunggu sesi terbaca sebelum menyimpulkan", () => {
    // While the session is still unknown the page must not flash the grid —
    // nor bounce an Admin away.
    session.role = null;
    render(<RolesAdminPage />);
    expect(screen.queryByText("grid menu")).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});
