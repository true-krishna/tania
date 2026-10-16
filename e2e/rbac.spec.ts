import { expect, test, type Page } from "@playwright/test";

/**
 * RBAC e2e (002-tania-rbac; tasks T041).
 *
 * Harness: `docker-compose` kedua repo hidup (runbook `e2e/README.md`) —
 * stack backend (postgres + redis + api) dengan migrasi + `0004_seed.sql`, dan
 * aplikasi Next pada `E2E_BASE_URL` (default `http://localhost:3000`; tanpa env
 * itu `playwright.config.ts` mem-boot `npm run dev` sendiri).
 *
 * Login memakai akun quickstart `0004_seed.sql` (sandi `correct horse battery`,
 * dapat ditimpa `E2E_SEED_PASSWORD`).
 *
 * ⚠ Satu login per test. `AuthService.Login` menaikkan penghitung rate limit
 * pada **setiap** percobaan (bukan hanya yang gagal) dengan default
 * `LOGIN_RATE_MAX=10` / `LOGIN_RATE_WINDOW=15m` per alamat klien. Suite ini
 * memakai tepat satu login di tiap test (8 test = 8 login) supaya tetap di
 * bawah ambang; menambah test yang login lagi, atau retry CI, akan kena
 * `RATE_LIMITED`. Runner E2E/UAT yang butuh lebih banyak login harus menaikkan
 * `LOGIN_RATE_MAX` pada proses API (suite integrasi backend sendiri memakai
 * batas 50) atau memakai ulang `storageState` per peran.
 */

const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? "correct horse battery";

const SEED_USERS = {
  ADMIN: "admin@tania.test",
  OPERATION: "operation@tania.test",
  CHAPTER: "chapter@tania.test",
  TALENT: "talent@tania.test",
} as const;

type Role = keyof typeof SEED_USERS;

async function loginAs(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  const emailInput = page.locator("#login-email");
  await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  await emailInput.fill(email);
  await page.locator("#login-password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: /masuk ke workspace/i }).click();
  await page.waitForURL(/\/dashboard/);
}

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: /^Main navigation$/ });
}

/** Entri sidebar yang wajib tampil (matriks peran & modul, plan §2/R2.2 + §14.7). */
const NAV_VISIBLE: Record<Role, readonly string[]> = {
  ADMIN: [
    "Dashboard",
    "Aktivitas saya",
    "Workload",
    "Data Karyawan",
    "Kontrak",
    "Assignments",
    "Provisi Entra",
    "CV",
    "Master Data",
    "Accounts",
    "Audit",
  ],
  OPERATION: [
    "Dashboard",
    "Aktivitas saya",
    "Workload",
    "Data Karyawan",
    "Kontrak",
    "Assignments",
    "Provisi Entra",
    "CV",
    "Master Data",
  ],
  CHAPTER: [
    "Dashboard",
    "Aktivitas saya",
    "Workload",
    "Data Karyawan",
    "Kontrak",
    "Assignments",
    "CV",
    "Master Data",
  ],
  TALENT: ["Dashboard", "Aktivitas saya", "Workload", "Data Karyawan", "Assignments", "CV"],
};

/** Entri sidebar yang wajib tidak tampil — termasuk modul ditunda (IDP/Evaluasi). */
const NAV_HIDDEN: Record<Role, readonly string[]> = {
  ADMIN: ["IDP", "Evaluations"],
  OPERATION: ["IDP", "Evaluations", "Accounts", "Audit"],
  CHAPTER: ["Provisi Entra", "IDP", "Evaluations", "Accounts", "Audit"],
  TALENT: ["Kontrak", "Provisi Entra", "Master Data", "IDP", "Evaluations", "Accounts", "Audit"],
};

/** Modul yang ditunda untuk semua peran: URL langsung tidak boleh membuka modul. */
const DEFERRED_ROUTES = [
  "/idp",
  "/idp/new",
  "/idp/my",
  "/evaluations",
  "/evaluations/periods",
  "/evaluations/templates",
  "/evaluations/my",
] as const;

test.describe("RBAC matrix (T041)", () => {
  for (const role of ["ADMIN", "OPERATION", "CHAPTER", "TALENT"] as const) {
    test(`T041 — ${role}: nav sesuai matriks, modul ditunda 404`, async ({ page }) => {
      await loginAs(page, SEED_USERS[role]);
      await page.goto("/dashboard");

      const nav = mainNav(page);
      await expect(nav).toBeVisible();
      for (const label of NAV_VISIBLE[role]) {
        // Entri biasa = link; seksi multi-halaman (Master Data) = tombol submenu.
        const entry = nav
          .getByRole("link", { name: label, exact: true })
          .or(nav.getByRole("button", { name: label, exact: true }));
        await expect(entry).toBeVisible();
      }
      for (const label of NAV_HIDDEN[role]) {
        await expect(nav.getByRole("link", { name: label, exact: true })).toHaveCount(0);
        await expect(nav.getByText(label, { exact: true })).toHaveCount(0);
      }

      // Modul ditunda: kode fitur tetap ada, tetapi URL langsung tidak tersedia.
      for (const route of DEFERRED_ROUTES) {
        const response = await page.goto(route);
        expect(response?.status(), `${route} harus 404 untuk ${role}`).toBe(404);
      }
    });
  }

  test("T041 — ADMIN: kelola penuh pada modul aktif (TAN-212 clarify 4)", async ({ page }) => {
    await loginAs(page, SEED_USERS.ADMIN);
    // Baris matriks Assignment/CV/Entra: Admin kelola penuh, jadi aksi kelola
    // tersedia dan server tidak lagi menolak rutenya.
    await page.goto("/assignments");
    await expect(page.getByRole("heading", { name: "Assignments" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Buat Assignment/ })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: /operation not permitted/ })).toHaveCount(0);

    await page.goto("/entra");
    await expect(page.getByRole("heading", { name: /Provisi Entra/ })).toBeVisible();
  });

  test("T041 — OPERATION: Assignment hanya baca (tanpa aksi), Employees kelola", async ({ page }) => {
    await loginAs(page, SEED_USERS.OPERATION);

    await page.goto("/assignments");
    await expect(page.getByRole("heading", { name: "Assignments" })).toBeVisible();
    await expect(page.getByText("hanya baca")).toBeVisible();
    await expect(page.getByRole("link", { name: /Buat Assignment/ })).toHaveCount(0);
    // Filter per talent tetap tersedia untuk baca lintas talent.
    await expect(page.getByText("Talent", { exact: true })).toBeVisible();

    await page.goto("/employees");
    await expect(page.getByRole("link", { name: /Tambah Karyawan/ })).toBeVisible();
  });

  test("T041 — CHAPTER: Assignment kelola, Employees hanya cakupan chapter", async ({ page }) => {
    await loginAs(page, SEED_USERS.CHAPTER);

    await page.goto("/assignments");
    await expect(page.getByRole("link", { name: /Buat Assignment/ })).toBeVisible();

    await page.goto("/employees");
    await expect(
      page.getByText("Talent dalam cakupan chapter Anda yang siap ditugaskan (hanya baca)."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Tambah Karyawan/ })).toHaveCount(0);
  });

  test("T041 — TALENT: Assignment miliknya, Employees mengarah ke data diri", async ({ page }) => {
    await loginAs(page, SEED_USERS.TALENT);

    await page.goto("/assignments");
    await expect(page.getByText("Riwayat penugasan Anda.")).toBeVisible();
    // Filter talent tidak berarti untuk "miliknya" (server memfilter otomatis).
    await expect(page.getByText("Talent", { exact: true })).toHaveCount(0);

    await page.goto("/employees");
    await page.waitForURL(/\/employees\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Data Karyawan" })).toHaveCount(0);
  });
});
