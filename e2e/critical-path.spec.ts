import * as fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * Critical-path E2E (constitution §VII; tasks T129/T133 + T028 laporan talent).
 *
 * Harness: `docker-compose` kedua repo hidup (runbook `e2e/README.md`) —
 * stack backend (postgres + redis + api) dengan fixture
 * `e2e/seed-talent-report.sql` di atas migrasi 0004/0005, dan aplikasi Next
 * pada `E2E_BASE_URL` (default `http://localhost:3000`; tanpa env itu
 * `playwright.config.ts` mem-boot `npm run dev` sendiri).
 *
 * Login memakai akun quickstart `0004_seed.sql` (sandi sama
 * `correct horse battery`, dapat ditimpa `E2E_SEED_PASSWORD`).
 *
 * Mode `NEXT_PUBLIC_AUTH_LOCAL_ONLY=1` (dev, tanpa backend) tetap didukung
 * untuk smoke shell: `loginAs` menjadi no-op dan peran datang dari
 * `NEXT_PUBLIC_DEFAULT_ACCESS_ROLE`.
 */

const SEED_PASSWORD = process.env.E2E_SEED_PASSWORD ?? "correct horse battery";

const SEED_USERS: Record<string, string> = {
  ADMIN: "admin@tania.test",
  OPERATION: "operation@tania.test",
  CHAPTER: "chapter@tania.test",
  TALENT: "talent@tania.test",
};

/**
 * Ekspektasi angka `n = …` dari fixture (backend 0004_seed.sql + backfill
 * kontrak 0005 + `e2e/seed-talent-report.sql`); rincian hitungan ada di
 * komentar seed. Rentang default = `talentReportRange` penuh (2022-01 ..
 * Desember tahun berjalan).
 */
const OPERATION_FULL_RANGE = { distribution: 6, movement: 10 };
const OPERATION_2025_ONLY = { distribution: 4, movement: 3 };
const CHAPTER_FULL_RANGE = { distribution: 4, movement: 6 };

const CHART_LABELS = [
  "Talent per role",
  "Talent per generasi",
  "Talent per jenjang pendidikan",
  "Talent per lokasi kerja",
  "Tren churn vs new talent",
] as const;

async function loginAs(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  const emailInput = page.locator("#login-email");
  try {
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    // Mode local-only: LoginForm tidak dirender, guard sudah langsung ke /dashboard.
  }
  if (await emailInput.isVisible()) {
    await emailInput.fill(email);
    await page.locator("#login-password").fill(SEED_PASSWORD);
    await page.getByRole("button", { name: /masuk ke workspace/i }).click();
  }
  await page.waitForURL(/\/dashboard/);
}

function chartOf(page: Page, ariaLabel: string) {
  return page.getByRole("img", { name: ariaLabel });
}

function totalOf(page: Page, chartTitle: string) {
  return page
    .getByRole("heading", { name: chartTitle, level: 2 })
    .locator("xpath=following-sibling::p[1]");
}

async function readTotal(page: Page, chartTitle: string): Promise<number> {
  const text = (await totalOf(page, chartTitle).textContent()) ?? "";
  const match = text.match(/n = (\d+)/);
  if (!match) throw new Error(`subjudul total tidak terbaca untuk "${chartTitle}": "${text}"`);
  return Number(match[1]);
}

async function readAllTotals(page: Page) {
  return {
    role: await readTotal(page, "Talent per role"),
    generation: await readTotal(page, "Talent per generasi"),
    education: await readTotal(page, "Talent per jenjang pendidikan"),
    workLocation: await readTotal(page, "Talent per lokasi kerja"),
    movement: await readTotal(page, "Tren churn vs new talent"),
  };
}

function downloadButtonOf(page: Page, chartTitle: string) {
  return page
    .getByRole("heading", { name: chartTitle, level: 2 })
    .locator("xpath=../..")
    .getByRole("button", { name: "Unduh PNG" });
}

/** Dimensi PNG dari header IHDR (tanpa dependensi pembaca gambar). */
function pngSize(file: string): { width: number; height: number } {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test("app boots and the shell renders with navigation", async ({ page }) => {
  await loginAs(page, SEED_USERS.OPERATION);
  await page.goto("/dashboard");

  await expect(page.getByText("Tania")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();

  // Navigation exposes role-scoped links; the dashboard is common to all roles.
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
});

test("dashboard renders a widget heading", async ({ page }) => {
  await loginAs(page, SEED_USERS.OPERATION);
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("audit route is only reachable for ADMIN", async ({ page }) => {
  const role = process.env.E2E_ROLE ?? process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE ?? "TALENT";
  await loginAs(page, SEED_USERS[role] ?? SEED_USERS.TALENT);
  await page.goto("/audit");

  if (role === "ADMIN") {
    await expect(page.getByRole("heading", { name: "Jejak Audit" })).toBeVisible();
  } else {
    // Non-admin sees the access note, not the viewer.
    await expect(page.getByText(/hanya dapat diakses oleh peran Admin/i)).toBeVisible();
  }
});

test("T028 — Operation melihat 5 grafik laporan talent di Dashboard", async ({ page }) => {
  await loginAs(page, SEED_USERS.OPERATION);
  // Amandemen penempatan (TAN-154): konten laporan menggantikan konten Dashboard.
  await page.goto("/dashboard");

  for (const label of CHART_LABELS) {
    await expect(chartOf(page, label)).toBeVisible();
    await expect(chartOf(page, label).locator("canvas")).toBeVisible();
  }

  const totals = await readAllTotals(page);
  expect(totals).toEqual({
    role: OPERATION_FULL_RANGE.distribution,
    generation: OPERATION_FULL_RANGE.distribution,
    education: OPERATION_FULL_RANGE.distribution,
    workLocation: OPERATION_FULL_RANGE.distribution,
    movement: OPERATION_FULL_RANGE.movement,
  });
});

test("T028 — satu aksi filter memperbarui kelima grafik (SC-04)", async ({ page }) => {
  await loginAs(page, SEED_USERS.OPERATION);
  await page.goto("/dashboard");
  await expect(chartOf(page, "Talent per role").locator("canvas")).toBeVisible();

  const before = await readAllTotals(page);
  expect(before.role).toBe(OPERATION_FULL_RANGE.distribution);
  expect(before.movement).toBe(OPERATION_FULL_RANGE.movement);

  await page.getByLabel("Bulan mulai").selectOption("2025-01");
  await page.getByLabel("Bulan akhir").selectOption("2025-12");
  await page.getByRole("button", { name: "Terapkan" }).click();

  await expect(totalOf(page, "Tren churn vs new talent")).toHaveText(
    `n = ${OPERATION_2025_ONLY.movement}`,
  );
  const after = await readAllTotals(page);
  expect(after).toEqual({
    role: OPERATION_2025_ONLY.distribution,
    generation: OPERATION_2025_ONLY.distribution,
    education: OPERATION_2025_ONLY.distribution,
    workLocation: OPERATION_2025_ONLY.distribution,
    movement: OPERATION_2025_ONLY.movement,
  });

  // Kelima angka berubah dari satu aksi "Terapkan".
  for (const key of Object.keys(before) as (keyof typeof before)[]) {
    expect(after[key], `total ${key} berubah`).not.toBe(before[key]);
  }
});

test("T028 — Unduh PNG per grafik: event, pola nama, dimensi ≥ 2× (SC-03)", async ({ page }) => {
  await loginAs(page, SEED_USERS.OPERATION);
  await page.goto("/dashboard");
  await expect(chartOf(page, "Talent per role").locator("canvas")).toBeVisible();

  const startMonth = await page.getByLabel("Bulan mulai").inputValue();
  const endMonth = await page.getByLabel("Bulan akhir").inputValue();

  for (const chartTitle of ["Talent per role", "Tren churn vs new talent"]) {
    const downloadPromise = page.waitForEvent("download");
    await downloadButtonOf(page, chartTitle).click();
    const download = await downloadPromise;

    // Pola nama file FR-14: <nama-grafik>-<mulai>-<akhir>.png.
    const slug = chartTitle === "Talent per role" ? "talent-per-role" : "tren-churn-vs-new-talent";
    expect(download.suggestedFilename()).toBe(`${slug}-${startMonth}-${endMonth}.png`);

    // SC-03: resolusi PNG ≥ 2× ukuran tampil kanvas.
    const file = await download.path();
    expect(file).not.toBeNull();
    const box = await chartOf(page, chartTitle).boundingBox();
    expect(box).not.toBeNull();
    const { width, height } = pngSize(file as string);
    expect(width, "lebar PNG ≥ 2×").toBeGreaterThanOrEqual(Math.floor(2 * (box as { width: number }).width));
    expect(height, "tinggi PNG ≥ 2×").toBeGreaterThanOrEqual(Math.floor(2 * (box as { height: number }).height));
  }
});

test("T028 — Chapter hanya melihat cakupan chapter-nya (SC-05)", async ({ page }) => {
  await loginAs(page, SEED_USERS.CHAPTER);
  await page.goto("/dashboard");
  await expect(chartOf(page, "Talent per role").locator("canvas")).toBeVisible();

  const totals = await readAllTotals(page);
  expect(totals).toEqual({
    role: CHAPTER_FULL_RANGE.distribution,
    generation: CHAPTER_FULL_RANGE.distribution,
    education: CHAPTER_FULL_RANGE.distribution,
    workLocation: CHAPTER_FULL_RANGE.distribution,
    movement: CHAPTER_FULL_RANGE.movement,
  });

  // Cakupan Chapter (role Engineer) lebih kecil daripada milik Operation.
  expect(totals.role).toBeLessThan(OPERATION_FULL_RANGE.distribution);
  expect(totals.movement).toBeLessThan(OPERATION_FULL_RANGE.movement);
});

test("T028 — Talent tidak melihat laporan; rute lama redirect ke Dashboard (FR-01)", async ({ page }) => {
  await loginAs(page, SEED_USERS.TALENT);

  // Amandemen penempatan: rute /reports/talent hanya redirect — konten laporan
  // bukan bagian dashboard Talent, dan penegakan authz tetap di server (FR-01).
  await page.goto("/reports/talent");
  await page.waitForURL(/\/dashboard/);
  await expect(chartOf(page, "Talent per role")).toHaveCount(0);
  await expect(page.getByText(/Penugasan aktif|Aktivitas/).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// T029 — Asisten Data: invariant panel (005-asisten-data-chatbot, K2)
//
// Skenario di bawah tidak memanggil model: panel, fokus, chip, batas panjang,
// dan guard peran semuanya lokal, jadi lulus tanpa provider. Balasan grounded +
// retry idempoten ada di T034 (K3) dan di-`skip` eksplisit kecuali
// `E2E_AI_PROVIDER=1` — lihat `e2e/README.md`.
// ---------------------------------------------------------------------------

test("T029 — Chapter membuka panel: fokus, chip, batas 2.000 karakter, tutup (tanpa provider)", async ({ page }) => {
  await loginAs(page, SEED_USERS.CHAPTER);
  await page.goto("/dashboard");

  const bubble = page.getByRole("button", { name: "Buka asisten data" });
  await expect(bubble).toBeVisible();
  await bubble.click();

  const dialog = page.getByRole("dialog", { name: "Asisten data Tania" });
  await expect(dialog).toBeVisible();

  const input = page.getByLabel("Pertanyaan untuk asisten");
  await expect(input).toBeFocused();

  // Chip contoh Chapter mengisi draft + penghitung karakter (FR-01/FR-05).
  const chip = "Siapa saja yang kontraknya berakhir dalam 90 hari?";
  await dialog.getByRole("button", { name: chip }).click();
  await expect(input).toHaveValue(chip);
  await expect(dialog.getByText(`${chip.length}/2000 karakter`)).toBeVisible();

  // Batas 2.000 karakter ditegakkan di input itu sendiri (`maxLength`). Jalur
  // "di atas batas" tidak dapat dicapai lewat UI karena browser sudah memotong;
  // jalur itu diuji unit di T028 (blokir tanpa memanggil mutation).
  await expect(input).toHaveAttribute("maxlength", "2000");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(bubble).toBeFocused();
});

test("T029 — peran non-MVP tidak melihat panel/bubble asisten (FR-01)", async ({ page }) => {
  const role = process.env.E2E_ROLE ?? process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE ?? "TALENT";
  await loginAs(page, SEED_USERS[role] ?? SEED_USERS.TALENT);
  await page.goto("/dashboard");

  await expect(page.getByRole("button", { name: "Buka asisten data" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Asisten data Tania" })).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// T034 — Asisten Data: balasan grounded & coba ulang idempoten (K3)
//
// ⚠ Kedua skenario di bawah butuh API hidup + provider AI. Tanpa provider,
// `sendChatMessage` menjawab "asisten belum dikonfigurasi", sehingga assertion
// balasan tidak mungkin lulus — karena itu keduanya **bukan** gate K2 dan
// di-`skip` secara eksplisit kecuali `E2E_AI_PROVIDER=1` (lihat
// `e2e/README.md`). Ter-`skip` bukan lulus.
// ---------------------------------------------------------------------------

test("T034 — Chapter menerima balasan grounded dari asisten (butuh provider)", async ({ page }) => {
  test.skip(
    process.env.E2E_AI_PROVIDER !== "1",
    "butuh API + provider AI: jalankan dengan E2E_AI_PROVIDER=1 (lihat e2e/README.md)",
  );

  await loginAs(page, SEED_USERS.CHAPTER);
  await page.goto("/dashboard");

  const bubble = page.getByRole("button", { name: "Buka asisten data" });
  await expect(bubble).toBeVisible();
  await bubble.click();

  const dialog = page.getByRole("dialog", { name: "Asisten data Tania" });
  await expect(dialog).toBeVisible();

  const question = "Siapa saja yang kontraknya berakhir dalam 90 hari?";
  const input = page.getByLabel("Pertanyaan untuk asisten");
  await input.fill(question);
  await page.getByRole("button", { name: "Kirim pertanyaan" }).click();

  // Bubble user tampil optimistis — dipilih lewat `data-role`, sebab teks
  // pertanyaan ini juga muncul sebagai chip contoh statis.
  await expect(dialog.locator('[data-role="USER"]', { hasText: question })).toBeVisible();
  await expect(dialog.locator('[data-role="ASSISTANT"]').first()).toBeVisible({ timeout: 30_000 });
  await expect(dialog.getByText("Belum terjawab")).toHaveCount(0);

  // T052: selama `busy` tombol kirim (yang baru saja diklik, jadi pemegang fokus)
  // di-`disable`, dan browser memindahkan fokus ke `body`; `Escape` dari sana
  // tidak melewati dialog yang handler-nya ada di elemen dialog. Tunggu kiriman
  // selesai (input kembali aktif ⇔ tidak `busy`) lalu kembalikan fokus ke dalam
  // panel sebelum `Escape`, agar hasilnya tidak bergantung kecepatan backend.
  // Assertion panel-tertutup di bawah tidak dilonggarkan.
  await expect(input).toBeEnabled();
  await input.focus();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(bubble).toBeFocused();
});

test("T034 — gagal ramah lalu coba ulang idempoten dengan clientRequestId sama (butuh provider)", async ({ page }) => {
  test.skip(
    process.env.E2E_AI_PROVIDER !== "1",
    "butuh API + provider AI: jalankan dengan E2E_AI_PROVIDER=1 (lihat e2e/README.md)",
  );

  await loginAs(page, SEED_USERS.CHAPTER);
  await page.goto("/dashboard");

  const bubble = page.getByRole("button", { name: "Buka asisten data" });
  await expect(bubble).toBeVisible();
  await bubble.click();

  const dialog = page.getByRole("dialog", { name: "Asisten data Tania" });
  await expect(dialog).toBeVisible();

  // Kegagalan disimulasikan di sisi klien: POST `SendChatMessage` pertama
  // di-`abort` sebelum menyentuh server, jadi tidak perlu mematikan provider
  // nyata. Kiriman coba ulang dibiarkan lewat. Setiap `clientRequestId` yang
  // benar-benar terkirim dicatat untuk membuktikan idempotensinya.
  const graphqlRoute = "**/graphql";
  const sentRequestIds: string[] = [];
  let abortSend = true;
  await page.route(graphqlRoute, async (route) => {
    const request = route.request();
    const body = request.postData() ?? "";
    if (request.method() !== "POST" || !body.includes("SendChatMessage")) {
      await route.continue();
      return;
    }
    const variables = (JSON.parse(body) as { variables?: { clientRequestId?: string } }).variables;
    if (variables?.clientRequestId) sentRequestIds.push(variables.clientRequestId);
    if (abortSend) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  const question = "Siapa saja yang kontraknya berakhir dalam 90 hari?";
  await page.getByLabel("Pertanyaan untuk asisten").fill(question);
  await page.getByRole("button", { name: "Kirim pertanyaan" }).click();

  // State gagal ramah: bubble optimistis menyebut belum terkirim + menawarkan
  // "Coba ulang", dan toast memuat pesan ramah — bukan crash atau layar kosong.
  const userBubbles = dialog.locator('[data-role="USER"]', { hasText: question });
  await expect(userBubbles).toHaveCount(1);
  await expect(userBubbles.getByText("Belum terkirim")).toBeVisible();
  const retry = userBubbles.getByRole("button", { name: "Coba ulang" });
  await expect(retry).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Asisten gagal menjawab" })).toBeVisible();

  // Percobaan ulang: simulasi kegagalan dilepas, tombol "Coba ulang" ditekan.
  abortSend = false;
  await retry.click();

  await expect(dialog.locator('[data-role="ASSISTANT"]').first()).toBeVisible({ timeout: 30_000 });

  // Balasan masuk → "Belum terjawab" hilang, dan riwayat tetap SATU pesan USER
  // untuk pertanyaan itu (tidak digandakan oleh coba ulang).
  await expect(dialog.getByText("Belum terjawab")).toHaveCount(0);
  await expect(userBubbles).toHaveCount(1);

  // Idempotensi FR-14: coba ulang memakai `clientRequestId` yang sama.
  expect(sentRequestIds).toHaveLength(2);
  expect(sentRequestIds[1]).toBe(sentRequestIds[0]);
});
