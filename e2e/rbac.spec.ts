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

/** Landing pasca-login (static by design, TAN-343/TAN-373). */
const LANDING: Record<Role, RegExp> = {
  ADMIN: /\/accounts$/,
  OPERATION: /\/dashboard$/,
  CHAPTER: /\/dashboard$/,
  TALENT: /\/employees\/[^/]+$/,
};

async function loginAs(page: Page, role: Role): Promise<void> {
  await page.goto("/login");
  const emailInput = page.locator("#login-email");
  await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  await emailInput.fill(SEED_USERS[role]);
  await page.locator("#login-password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL(LANDING[role]);
}

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: /^Main navigation$/ });
}

/**
 * Entri sidebar yang wajib tampil (matriks peran & modul). TAN-374 (keputusan
 * TAN-364): Admin memegang seluruh modul operasional lagi, Workload hilang
 * untuk semua peran, Talent hanya permukaan miliknya.
 */
const NAV_VISIBLE: Record<Role, readonly string[]> = {
  ADMIN: [
    "Dashboard",
    "Aktivitas saya",
    "Data Karyawan",
    "Kontrak",
    "Assignments",
    "Provisi Entra",
    "IDP",
    "Evaluations",
    "Master Data",
    "Accounts",
    "Audit",
  ],
  OPERATION: [
    "Dashboard",
    "Aktivitas saya",
    "Data Karyawan",
    "Kontrak",
    "Assignments",
    "Provisi Entra",
    "IDP",
    "Evaluations",
    "Master Data",
  ],
  CHAPTER: [
    "Dashboard",
    "Aktivitas saya",
    "Data Karyawan",
    "Kontrak",
    "Assignments",
    "IDP",
    "Evaluations",
    "Master Data",
  ],
  TALENT: ["Aktivitas saya", "Data Karyawan", "IDP", "Evaluations"],
};

/**
 * Entri sidebar yang wajib tidak tampil. IDP & Evaluations tidak lagi di sini:
 * sejak aktivasi 2026-10-16 (klarifikasi 9) keduanya tampil untuk semua peran,
 * hanya aksesnya yang berbeda. TAN-372: CV bukan lagi menu. TAN-374: Workload
 * hilang untuk semua peran.
 */
const NAV_HIDDEN: Record<Role, readonly string[]> = {
  ADMIN: ["CV", "Workload"],
  OPERATION: ["CV", "Workload", "Accounts", "Audit"],
  CHAPTER: ["CV", "Workload", "Provisi Entra", "Accounts", "Audit"],
  TALENT: [
    "CV",
    "Workload",
    "Dashboard",
    "Kontrak",
    "Assignments",
    "Provisi Entra",
    "Master Data",
    "Accounts",
    "Audit",
  ],
};

/** Rute modul yang aktif: URL langsung harus membuka halamannya (bukan 404). */
const ACTIVE_ROUTES = ["/idp", "/evaluations"] as const;

test.describe("RBAC matrix (T041)", () => {
  for (const role of ["ADMIN", "OPERATION", "CHAPTER", "TALENT"] as const) {
    test(`T041 — ${role}: nav sesuai matriks, modul aktif terbuka`, async ({ page }) => {
      await loginAs(page, role);
      // Halaman netral: semua peran memegang Aktivitas saya.
      await page.goto("/activities");

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

      // Modul aktif (klarifikasi 9): URL langsung membuka halamannya, bukan 404.
      for (const route of ACTIVE_ROUTES) {
        const response = await page.goto(route);
        expect(response?.status(), `${route} harus terbuka untuk ${role}`).toBe(200);
      }

      if (role === "ADMIN") {
        // TAN-374: Workload tersembunyi — rutenya mengalihkan, bukan merender fixture.
        await page.goto("/workload");
        await page.waitForURL(/\/accounts$/);
        await expect(page.getByText("Workload", { exact: true })).toHaveCount(0);
      }
    });
  }

  test("T041 — ADMIN: kelola penuh pada modul aktif (TAN-212 clarify 4)", async ({ page }) => {
    await loginAs(page, "ADMIN");
    // Baris matriks Assignment/Entra: Admin kelola penuh, jadi aksi kelola
    // tersedia dan server tidak lagi menolak rutenya.
    await page.goto("/assignments");
    await expect(page.getByRole("heading", { name: "Assignments" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Buat Assignment/ })).toBeVisible();
    await expect(
      page.getByRole("alert").filter({ hasText: /operation not permitted/ }),
    ).toHaveCount(0);

    await page.goto("/entra");
    await expect(page.getByRole("heading", { name: /Provisi Entra/ })).toBeVisible();

    // IDP aktif untuk semua peran; Admin mengelolanya penuh (klarifikasi 9).
    await page.goto("/idp");
    await expect(page.getByRole("link", { name: /Buat IDP/ })).toBeVisible();
  });

  test("T041 — OPERATION: Assignment hanya baca (tanpa aksi), Employees kelola", async ({
    page,
  }) => {
    await loginAs(page, "OPERATION");

    await page.goto("/assignments");
    await expect(page.getByRole("heading", { name: "Assignments" })).toBeVisible();
    await expect(page.getByText("hanya baca")).toBeVisible();
    await expect(page.getByRole("link", { name: /Buat Assignment/ })).toHaveCount(0);
    // Filter per talent tetap tersedia untuk baca lintas talent.
    await expect(page.getByText("Talent", { exact: true })).toBeVisible();

    await page.goto("/employees");
    await expect(page.getByRole("link", { name: /Tambah Karyawan/ })).toBeVisible();

    // IDP & Evaluations: Operation hanya membaca (klarifikasi 9).
    await page.goto("/idp");
    await expect(page.getByText(/hanya baca/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Buat IDP/ })).toHaveCount(0);
    await page.goto("/evaluations");
    await expect(page.getByRole("heading", { name: "Evaluasi" })).toBeVisible();
  });

  test("T041 — CHAPTER: Assignment kelola, Employees hanya cakupan chapter", async ({ page }) => {
    await loginAs(page, "CHAPTER");

    await page.goto("/assignments");
    await expect(page.getByRole("link", { name: /Buat Assignment/ })).toBeVisible();

    await page.goto("/employees");
    await expect(
      page.getByText("Talent dalam cakupan chapter Anda yang siap ditugaskan (hanya baca)."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Tambah Karyawan/ })).toHaveCount(0);
  });

  test("T041 — TALENT: Employees mengarah ke data diri, IDP miliknya", async ({ page }) => {
    await loginAs(page, "TALENT");

    await page.goto("/employees");
    await page.waitForURL(/\/employees\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Data Karyawan" })).toHaveCount(0);

    // Entri IDP yang sama membuka rencana milik Talent sendiri (klarifikasi 9).
    await page.goto("/idp");
    await expect(page.getByRole("heading", { name: "IDP Saya" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Buat IDP/ })).toHaveCount(0);
  });
});
