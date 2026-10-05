import { expect, test } from "@playwright/test";

/**
 * Critical-path E2E smoke (constitution §VII, tasks T129/T133).
 *
 * Prerequisite: the app is running with `NEXT_PUBLIC_AUTH_LOCAL_ONLY=1` (dev
 * mode — guard assumes a signed-in default role, see src/lib/auth/config.ts),
 * and `NEXT_PUBLIC_DEFAULT_ACCESS_ROLE` selects the role under test. This
 * proves the shell boot, role-scoped navigation, and the dashboard render.
 *
 * The full database-backed multi-role flow (login 4 roles → CRUD) requires the
 * backend `docker-compose` stack and is exercised by the wider T129 harness.
 */
test("app boots and the shell renders with navigation", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByText("Tania")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();

  // Navigation exposes role-scoped links; the dashboard is common to all roles.
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
});

test("dashboard renders a widget heading", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("audit route is only reachable for ADMIN", async ({ page }) => {
  const role = process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE ?? "TALENT";
  await page.goto("/audit");

  if (role === "ADMIN") {
    await expect(page.getByRole("heading", { name: "Jejak Audit" })).toBeVisible();
  } else {
    // Non-admin sees the access note, not the viewer.
    await expect(page.getByText(/hanya dapat diakses oleh peran Admin/i)).toBeVisible();
  }
});