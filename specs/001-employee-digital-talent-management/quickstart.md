# Quickstart — Frontend (tania-dashboard)

Panduan menjalankan & mengembangkan frontend fitur `001-employee-digital-talent-management`.

**Stack terpasang**: Next.js 16.3.4 (App Router), React 19.2.8, TypeScript 5, TailwindCSS 4,
Vitest 5, eslint 9 (`eslint-config-next`).
**Pinned, belum terpasang**: Apollo Client, React Testing Library, GraphQL codegen.

---

## 1. Prasyarat

| Tool | Versi minimum |
| --- | --- |
| Node.js | 20 (diuji 24) |
| Backend `tania-backend` | berjalan di `:8080` (lihat quickstart repo backend) |

## 2. Instalasi

```bash
npm install
cp .env.example .env.local
```

## 3. Environment variables

| Variabel | Dipakai oleh | Arti |
| --- | --- | --- |
| `TANIA_API_URL` | server-rendered pages | base URL API (legacy REST, akan dipensiunkan) |
| `NEXT_PUBLIC_TANIA_API_URL` | form "Add User" (klien) | API yang sama, terlihat browser (CORS) |
| `NEXT_PUBLIC_GRAPHQL_URL` | **Apollo Client** (ditambahkan pada F0) | endpoint GraphQL backend, mis. `http://localhost:8080/graphql` |

> `NEXT_PUBLIC_GRAPHQL_URL` belum ada di `.env.example` — ditambahkan bersama Apollo pada F0.
> Token **tidak** masuk environment variable mana pun.

## 4. Menjalankan

```bash
npm run dev        # http://localhost:3000 — "/" redirect ke /talents (legacy) sampai F9
```

Dengan backend aktif, smoke cepat:

```bash
curl -s localhost:8080/readyz            # backend siap?
curl -s localhost:8080/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ health { status version } }"}'
```

## 5. Codegen & GraphQL (setelah F0)

```bash
npm run generate   # GraphQL codegen → src/generated/graphql/ (jangan diedit manual)
npm run lint
npm run typecheck
npm test           # vitest run
```

Codegen membaca **SDL yang dilayani backend** (`tania-backend/graph/schema.graphqls`), bukan
kontrak desain penuh — lihat `research.md` FRD3. Setelah backend menambah operasi, jalankan
`make generate` di repo backend lalu `npm run generate` di sini.

## 6. Testing

| Perintah | Isi |
| --- | --- |
| `npm test` | Vitest (unit + komponen + guard) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | eslint |

Prasyarat (F0/T009): `vitest.config.ts` diperluas ke `environment: "jsdom"` dan
`include: ["src/**/*.test.ts", "src/**/*.test.tsx"]`, lalu RTL dipasang. Tanpa itu test komponen
tidak terjaring (kondisi saat ini: hanya `src/lib/api.test.ts`, 6 test, environment `node`).

## 7. Alur kerja fitur

1. Pastikan operasi GraphQL yang dibutuhkan sudah ada di SDL backend (lihat `plan.md`
   §Ketergantungan pada Backend — backend dan frontend berjalan per gelombang yang sama).
2. Tulis operasi di `src/features/<modul>/*.graphql` → `npm run generate`.
3. Bangun hook + komponen di `src/features/<modul>/`; komponen bersama di `src/components/`.
4. Tambahkan rute di `src/app/(app)/<rute>/page.tsx`.
5. Tulis test (unit + komponen + guard) lalu jalankan `npm test`.

## 8. Struktur repo

Layout aktual & target ada di `plan.md` §Project Structure; ringkas:

```text
src/app/(auth)/login · src/app/(app)/<rute> · src/components/ · src/features/<modul>/
src/lib/{apollo,auth,errors,format}.ts · src/generated/graphql/
```

`src/lib/api.ts` + `src/lib/talents.ts` adalah klien REST **legacy** yang menyasar API eksternal
yang tidak dilayani `tania-backend`; keduanya dihapus pada F9 setelah `/talents` diport ke
GraphQL (`plan.md` §Open Items O4).

## 9. Artefak Spec Kit repo ini

```text
specs/001-employee-digital-talent-management/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md · tasks.md
└── contracts/{schema.graphql, api-conventions.md, operations.md}
```

`tasks.md` **ada di repo ini** (22 task UI) dan dijalankan lewat `/speckit.implement` dari root
repo ini. Daftar backend terpisah (108 task) ada di `tania-backend/specs/.../tasks.md`; **ID task
dipertahankan sama di dua daftar**, jadi nomor di tiap daftar tidak berurutan penuh — pemetaan
per fase ada di `tasks.md` §Pemetaan ID.
