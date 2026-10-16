# E2E harness — laporan talent (T028)

Spec Playwright: `e2e/critical-path.spec.ts` (`npm run test:e2e`). Prasyarat
skenario laporan talent: **`docker-compose` kedua repo hidup** — stack backend
(postgres + redis + api, migrasi + `0004_seed.sql` otomatis) + aplikasi Next —
plus fixture `e2e/seed-talent-report.sql`.

## 1. Stack dua repo (satu perintah compose)

Dari root `tania-dashboard` (sibling checkout `tania-backend` dibutuhkan hanya
untuk membangun image API & file compose-nya):

```sh
# Backend butuh JWT_SECRET (lihat tania-backend/.env.example); contoh:
export JWT_SECRET=dev-only-secret

docker compose -f ../tania-backend/docker-compose.yml -f e2e/docker-compose.e2e.yml up -d --build
```

Ini menyalakan postgres:5432, redis:6379, api:8080 (dengan
`CORS_ALLOWED_ORIGINS=http://localhost:3000`), dan `web:3000` (image Dockerfile
repo ini, `NEXT_PUBLIC_GRAPHQL_URL` dapat ditimpa via env).

## 2. Fixture laporan talent

```sh
docker compose -f ../tania-backend/docker-compose.yml -f e2e/docker-compose.e2e.yml \
  exec -T postgres psql -U tania -d tania < e2e/seed-talent-report.sql
```

Skenario bergantung pada data seed backend (`0004_seed.sql` + backfill kontrak
`0005`) **di database fresh** — ulangi dengan `docker compose down -v` bila
pernah ada data lain. Akun login quickstart (sandi `correct horse battery`,
bisa ditimpa `E2E_SEED_PASSWORD`): `admin@tania.test`, `operation@tania.test`,
`chapter@tania.test`, `talent@tania.test`.

## 3. Jalankan Playwright

```sh
E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

Alternatif tanpa container `web` (dev server lokal):

```sh
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/graphql npm run dev   # terminal 1
npm run test:e2e                                                   # terminal 2 (webServer playwright)
```

Varian peran (`audit route is only reachable for ADMIN`): `E2E_ROLE=ADMIN`
(default `TALENT`). Smoke shell lama tetap jalan di mode
`NEXT_PUBLIC_AUTH_LOCAL_ONLY=1` tanpa backend — `loginAs` otomatis menjadi no-op.

## Skenario T028

1. Operation login → `/reports/talent` → 5 grafik (V-1…V-5) tampil.
2. Ubah filter → angka kelima grafik berubah bersama (SC-04).
3. Unduh PNG per grafik — event unduhan, pola nama
   `<nama-grafik>-<mulai>-<akhir>.png`, dimensi PNG ≥ 2× ukuran tampil (SC-03).
4. Chapter hanya melihat cakupan chapter-nya (SC-05).
5. Talent ditolak (FR-01).

## Catatan eksekusi: instance 1 GiB / 1 CPU tidak memadai (2026-10-12)

Percobaan menjalankan stack ini di sandbox 1 GiB / 1 CPU gagal pada dua titik:

- build image `api` (Go, di dalam Docker): kompilasi OOM-kill (`signal: killed`
  pada `github.com/redis/go-redis/v9`) — compiler Go butuh memori di atas
  plafon instance;
- `next build` lokal (webpack): compile + TypeScript hijau, tetapi tahap
  "Collecting page data" default memakai 35 worker → OOM; dengan batas sementara
  `experimental.cpus: 1` build produksi penuh selesai (30/30 halaman) — batas
  itu sengaja TIDAK di-commit.

Kesimpulan: jalankan E2E (dan image build `api`) di runner CI atau mesin dengan
memori ≥4 GiB; harness + runbook di atas adalah kontrak eksekusinya.

## Skenario RBAC (T041)

Spec kedua: `e2e/rbac.spec.ts` — nav per peran sesuai matriks (IDP & grup Evaluations
**tampil untuk semua peran** sejak aktivasi 2026-10-16; yang berbeda adalah daun di dalamnya:
Roster Chapter/Operation/Admin, Periode & Template Admin, Evaluasi Saya Talent), route
`/idp` & `/evaluations/*` balas **200 untuk semua peran** (sebelumnya 404 — lihat
`specs/002-tania-rbac/plan.md` §14.11), dan penolakan server tampil sebagai pesan jelas
(bukan crash). Stack-nya sama dengan di atas, kecuali fixture laporan talent tidak diperlukan:

```sh
docker compose -f ../tania-backend/docker-compose.yml -f e2e/docker-compose.e2e.yml up -d --build
E2E_BASE_URL=http://localhost:3000 npx playwright test e2e/rbac.spec.ts
```

⚠ Spec ini melakukan **satu login per test (8 login)**. `AuthService.Login`
menaikkan penghitung rate limit pada setiap percobaan — termasuk yang berhasil —
dengan default `LOGIN_RATE_MAX=10` / `LOGIN_RATE_WINDOW=15m` per alamat klien.
Suite E2E/UAT yang butuh lebih banyak login (mis. matriks 12×4) harus menaikkan
`LOGIN_RATE_MAX` pada proses API (suite integrasi backend memakai 50) atau
menggunakan ulang `storageState` per peran; kalau tidak, suite akan berhenti
dengan `RATE_LIMITED`.

## Catatan eksekusi: matriks RBAC sudah diverifikasi tanpa browser (2026-10-16)

Lingkungan agent kini memadai untuk menjalankan backend sungguhan (postgres +
redis via `docker compose`), sehingga **seluruh suite backend dijalankan dengan
driver nyata** — `TEST_DATABASE_URL=… TEST_REDIS_ADDR=… go test ./... -count=1
-race -p 1` → 10 paket ok, termasuk `TestGraphQLEndToEnd` yang menguji matriks
RBAC per operasi di atas HTTP/GraphQL (penolakan lintas-peran, permukaan Talent,
cakupan Chapter). Temuan dan perbaikannya dicatat di `plan.md` §14.12
(`tasks.md` T089/T090). Yang masih tertunda hanyalah lapisan browser (T041/T078)
yang memerlukan bring-up dua stack di atas plus pemasangan browser Playwright;
catatan "1 GiB / 1 CPU tidak memadai" di atas berlaku untuk sandbox lama, bukan
untuk lingkungan ini.

## Percobaan pertama browser (2026-10-16): stack jalan, browser tidak

API + web + DB ter-seed **terbukti** hidup di sandbox agent (POST `/graphql`
`login` mengembalikan token untuk akun seed; `GET /login` → 200), tetapi
`pnpm exec playwright install chromium` berhasil mengunduh browser lalu gagal
meluncurkannya:

```
Error relocating …/chrome-headless-shell: snd_ctl_card_info: symbol not found
exitCode=127
```

Sandbox agent adalah **Alpine Linux (musl)**, sedangkan build Chromium Playwright
butuh **glibc**; `playwright install-deps` memerlukan `apt`/root yang tidak
tersedia. Jadi 8 skenario `rbac.spec.ts` gagal pada tahap *launch*, bukan pada
asersi matriks — jalankan spec ini di runner glibc (CI/pipeline). Dua catatan
operasional lain: `0004_seed.sql` hanya bisa diterapkan pada **database fresh**
(`units.code` NOT NULL baru ada di migrasi `0011`), dan suite Go e2e mem-`TRUNCATE`
seluruh tabel, jadi siapkan database fresh lagi sebelum menjalankan spec ini.
Rincian: `specs/002-tania-rbac/plan.md` §14.13.
