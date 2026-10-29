import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * E2E konfigurasi RBAC dinamis — jalur utama W4 (TAN-265, US-D).
 *
 * Alur yang diuji: Admin membuat role kustom dari template, menutup satu menu
 * untuk role itu, user pemegang role tersebut **login ulang** dan sidebar-nya
 * mengikuti konfigurasi — lalu `resetRoleMenuConfig` mengembalikannya ke matriks
 * default tanpa deploy dan tanpa login baru.
 *
 * Setup/teardown lewat API GraphQL (`E2E_API_URL`, default
 * `http://localhost:8080/graphql`) supaya spec ini tidak bergantung pada tata
 * letak layar admin dan tidak menyentuh akun seed yang dipakai spec lain: role
 * dan akunnya dibuat khusus per run (`W4QA…`) lalu dibersihkan lagi.
 *
 * Harness: lihat `e2e/README.md` §Skenario konfigurasi RBAC (W4). Prasyarat
 * stack sama dengan `rbac.spec.ts`.
 *
 * ⚠ Dua login per test (Admin lewat API + pemegang role lewat UI). Suite E2E
 * yang menjalankan `rbac.spec.ts` (8 login) bersama spec ini melewati default
 * `LOGIN_RATE_MAX=10`/15m per alamat klien — naikkan pada proses API (suite
 * integrasi backend memakai 50) atau jalankan terpisah.
 */

const API_URL = process.env.E2E_API_URL ?? "http://localhost:8080/graphql";
const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? "correct horse battery";
const ADMIN_EMAIL = "admin@tania.test";

/** Entri sidebar default template CHAPTER (matriks FR-03) — dipakai sebagai pembanding. */
const CHAPTER_NAV = [
  "Dashboard",
  "Aktivitas saya",
  "Data Karyawan",
  "Kontrak",
  "Assignments",
  "IDP",
  "Evaluations",
  "Master Data",
] as const;
// TAN-372: CV bukan lagi menu — kontennya pindah ke profil talent.
const CHAPTER_NAV_HIDDEN = [
  "CV",
  "Workload",
  "Provisi Entra",
  "Administration",
  "Menu & Akses",
  "Accounts",
  "Audit",
] as const;

type GraphQLResult = Record<string, unknown>;

async function gql<T = GraphQLResult>(
  api: APIRequestContext,
  query: string,
  token?: string,
): Promise<T> {
  const response = await api.post(API_URL, {
    data: { query },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = (await response.json()) as {
    data?: T;
    errors?: { message: string; extensions?: Record<string, unknown> }[];
  };
  if (body.errors?.length) {
    const first = body.errors[0];
    throw new Error(`GraphQL ${String(first.extensions?.code ?? "")}: ${first.message}\n${query}`);
  }
  return body.data as T;
}

async function loginApi(
  api: APIRequestContext,
  email: string,
): Promise<{ accessToken: string; userId: string }> {
  const data = await gql<{ login: { accessToken: string; user: { id: string } } }>(
    api,
    `mutation { login(input: {email: "${email}", password: "${SEED_PASSWORD}"}) { accessToken user { id } } }`,
  );
  return { accessToken: data.login.accessToken, userId: data.login.user.id };
}

async function loginAs(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  const emailInput = page.locator("#login-email");
  await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  await emailInput.fill(email);
  await page.locator("#login-password").fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL(/\/dashboard/);
}

function mainNav(page: Page) {
  return page.getByRole("navigation", { name: /^Main navigation$/ });
}

async function expectNav(
  page: Page,
  visible: readonly string[],
  hidden: readonly string[],
): Promise<void> {
  const nav = mainNav(page);
  await expect(nav).toBeVisible();
  for (const label of visible) {
    const entry = nav
      .getByRole("link", { name: label, exact: true })
      .or(nav.getByRole("button", { name: label, exact: true }));
    await expect(entry, `${label} harus tampil`).toBeVisible();
  }
  for (const label of hidden) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toHaveCount(0);
    await expect(nav.getByText(label, { exact: true })).toHaveCount(0);
  }
}

test.describe("Konfigurasi RBAC dinamis (W4/TAN-265)", () => {
  test("jalur utama — role kustom → tutup menu → login ulang → sidebar ikut konfigurasi, reset mengembalikannya", async ({
    page,
    request: api,
  }) => {
    const suffix = String(Date.now());
    const roleName = `W4QA${suffix.slice(-6)}`;
    const email = `w4.qa.${suffix}@tania.test`;
    const nik = `3273${suffix.slice(-12)}`;
    const nomorInduk = `W4-${suffix.slice(-6)}`;
    const today = new Date().toISOString().slice(0, 10);

    const admin = await loginApi(api, ADMIN_EMAIL);

    // Role kustom dari template CHAPTER + akun pemegangnya, dibuat lewat API.
    const { createRole } = await gql<{ createRole: { id: string } }>(
      api,
      `mutation { createRole(input: {name: "${roleName}", label: "PM QA W4", templateRole: CHAPTER}) { id name templateRole } }`,
      admin.accessToken,
    );
    const roleId = createRole.id;

    const { units } = await gql<{ units: { id: string }[] }>(
      api,
      `query { units { id } }`,
      admin.accessToken,
    );
    const { jobRoles } = await gql<{ jobRoles: { id: string; chapter: unknown }[] }>(
      api,
      `query { jobRoles { id chapter { id } } }`,
      admin.accessToken,
    );
    const jobRole = jobRoles.find((role) => role.chapter);
    expect(jobRole, "seed harus punya minimal satu job role ber-chapter").toBeTruthy();

    const { createEmployee } = await gql<{ createEmployee: { id: string } }>(
      api,
      `mutation { createEmployee(input: {nik: "${nik}", fullName: "PM QA W4", email: "${email}",
        birthDate: "1997-05-05", gender: FEMALE, joinedAt: "${today}"}) { id } }`,
      admin.accessToken,
    );
    const employeeId = createEmployee.id;
    await gql(
      api,
      `mutation { createEmploymentContract(input: {employeeId: "${employeeId}", contractNo: "W4-C-${suffix.slice(-6)}",
        contractType: KARYAWAN_TETAP, nomorInduk: "${nomorInduk}", jobRoleId: "${jobRole!.id}",
        workLocation: JAKARTA, unitId: "${units[0].id}", startDate: "${today}"}) { id } }`,
      admin.accessToken,
    );
    const { createUserAccount } = await gql<{
      createUserAccount: { id: string; roleName: string; accessRole: string };
    }>(
      api,
      `mutation { createUserAccount(employeeId: "${employeeId}", email: "${email}", roleName: "${roleName}",
        temporaryPassword: "${SEED_PASSWORD}") { id roleName accessRole } }`,
      admin.accessToken,
    );
    const userId = createUserAccount.id;
    expect(createUserAccount.roleName).toBe(roleName);
    expect(createUserAccount.accessRole).toBe("CHAPTER");

    try {
      // Admin menutup menu IDP untuk role kustom ini (hanya sel itu yang berubah).
      const { setRoleMenuAccess } = await gql<{
        setRoleMenuAccess: { menuEntryId: string; visible: boolean }[];
      }>(
        api,
        `mutation { setRoleMenuAccess(roleId: "${roleId}",
          entries: [{menuEntryId: "idp", visible: false, accessLevel: NONE}]) { menuEntryId visible accessLevel } }`,
        admin.accessToken,
      );
      const idpCell = setRoleMenuAccess.find((cell) => cell.menuEntryId === "idp");
      expect(idpCell?.visible).toBe(false);

      // Login ulang pemegang role: sidebar mengikuti konfigurasi, modul lain
      // tetap seperti default template.
      await loginAs(page, email);
      await expectNav(
        page,
        CHAPTER_NAV.filter((label) => label !== "IDP"),
        [...CHAPTER_NAV_HIDDEN, "IDP"],
      );

      // Reset: kembali ke matriks default tanpa deploy dan tanpa login baru —
      // satu muat ulang halaman sudah cukup.
      await gql(
        api,
        `mutation { resetRoleMenuConfig(roleId: "${roleId}") { menuEntryId visible } }`,
        admin.accessToken,
      );
      await page.reload();
      await expectNav(page, CHAPTER_NAV, CHAPTER_NAV_HIDDEN);
    } finally {
      // Bersih-bersih: lepas akun dari role dulu (role yang masih dipakai tidak
      // boleh dihapus), lalu hapus role-nya.
      await gql(
        api,
        `mutation { resetRoleMenuConfig(roleId: "${roleId}") { menuEntryId } }`,
        admin.accessToken,
      ).catch(() => undefined);
      await gql(
        api,
        `mutation { updateUserAccessRole(userId: "${userId}", accessRole: CHAPTER) { id } }`,
        admin.accessToken,
      ).catch(() => undefined);
      await gql(
        api,
        `mutation { setUserAccountStatus(userId: "${userId}", status: INACTIVE) { id } }`,
        admin.accessToken,
      ).catch(() => undefined);
      await gql(api, `mutation { deleteRole(id: "${roleId}") }`, admin.accessToken).catch(
        () => undefined,
      );
    }
  });
});
