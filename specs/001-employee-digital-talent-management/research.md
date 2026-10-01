# Research & Keputusan Teknologi — Frontend

Fase 0 `/speckit.plan` untuk `tania-dashboard`. Mencatat keputusan, alternatif yang ditolak,
dan alasannya. Konteks teknologinya ada di `plan.md` §Technical Context.

> Konstitusi repo (`.specify/memory/constitution.md` v1.1.1) mem-pin stack frontend: Next.js
> App Router + React + TypeScript + TailwindCSS + Apollo Client + Vitest/RTL + eslint/`tsc`.
> Entri di bawah menjelaskan **bagaimana** pin itu diterapkan, bukan apakah.

---

## FRD1. Lapisan data: **Apollo Client** (dipin konstitusi)

- **Keputusan**: Apollo Client sebagai satu-satunya lapisan data GraphQL, diisolasi di
  `src/lib/apollo/` dan dipakai lewat hook di `src/features/<modul>/`.
- **Alasan**: dipin konstitusi (Additional Constraints); cache normalisasi bawaan cocok untuk
  entitas ber-`id` yang dipakai lintas layar (employee, unit, job role, project); dukungan
  `MockedProvider` untuk test komponen; ekosistem codegen matang.
- **Alternatif ditolak**: `urql` (cache normalisasi tidak sepemadan), Relay (kurva belajar &
  codegen opinionated untuk tim ini), `fetch` + hook manual (mengulang cache/loading/error di
  setiap layar), React Query + kelas GraphQL sendiri (dua lapisan untuk satu tanggung jawab).
- **Konsekuensi**: satu provider di `(app)/layout.tsx`; kebijakan cache terpusat di
  `src/lib/apollo/cache.ts`; tidak ada modul lain yang mengimpor klien langsung.

## FRD2. Codegen: `@graphql-codegen/cli`, operasi co-located

- **Keputusan**: operasi `*.graphql` diletakkan di samping hook fitur
  (`src/features/<modul>/*.graphql`), hasil generate ke `src/generated/graphql/` (dilarang
  diedit manual), dijalankan lewat `npm run generate`.
- **Alasan**: tipe hasil generate memaksa operasi cocok dengan skema; operasi tetap dekat dengan
  pemakainya; menghindari satu berkas raksasa.
- **Alternatif ditolak**: menulis query sebagai string literal + tipe manual (rawan drift);
  satu direktori `src/graphql/**` terpusat (menjauhkan operasi dari layar pemakainya).
- **Konsekuensi**: menambah dependensi `@graphql-codegen/*` ke devDependencies; CI harus gagal
  bila hasil generate tidak sinkron (target `npm run generate` + `git diff --exit-code`).

## FRD3. Sumber skema untuk generate: **SDL yang dilayani backend**

- **Keputusan**: codegen membaca skema hasil layanan backend (`graph/schema.graphqls` di
  `tania-backend`), bukan kontrak desain penuh `specs/.../contracts/schema.graphql`.
- **Alasan**: kontrak desain memuat 69 operasi sementara backend baru melayani 8 (auth + Unit +
  audit) per 2026-10-01. Generate dari kontrak desain akan menghasilkan kode untuk operasi yang
  belum ada — kompilasi lolos, runtime gagal.
- **Alternatif ditolak**: generate dari kontrak desain + menandai operasi "belum siap" (menambah
  mekanisme yang tidak dibutuhkan); mem-vendor skema (drift).
- **Konsekuensi**: kontrak desain tetap dipakai sebagai acuan bentuk tipe & review; urutan UI
  mengikuti gelombang backend (`plan.md` §Ketergantungan pada Backend).

## FRD4. Penyimpanan token: **di memori** (MVP)

- **Keputusan**: access token & refresh token di `src/lib/auth/session.ts` (memori proses tab),
  disisipkan ke permintaan oleh auth link Apollo. Data ber-sesi diambil client-side.
- **Alasan**: `localStorage` mengekspos token ke XSS dan bertahan lintas sesi tanpa kendali;
  cookie `HttpOnly` belum didukung backend (refresh token dikembalikan di payload).
  Konstitusi §III menuntut RBAC & kerahasiaan — token di `localStorage` adalah trade-off yang
  lebih lemah daripada sesi yang hilang saat reload.
- **Alternatif ditolak**: `localStorage`/`sessionStorage` (XSS + persistensi tak terkendali);
  cookie non-HttpOnly (setara localStorage ditambah kerumitan CSRF); menyimpan token di cookie
  dari frontend (tidak ada endpoint yang menetapkannya).
- **Konsekuensi**: sesi hilang saat full page reload → login ulang; SSR ber-auth tidak mungkin.
  Jalur perbaikan: backend menerbitkan refresh token sebagai cookie `HttpOnly`
  (`plan.md` Open Item O1) — keputusan lintas repo, belum diambil.

## FRD5. Routing & guard: route group + gate klien

- **Keputusan**: `src/app/(auth)/login` untuk halaman publik, `src/app/(app)/<rute>` untuk semua
  halaman ber-sesi dengan satu shell (`(app)/layout.tsx`) yang memuat navigasi per peran dan
  gate `src/lib/auth/guard.ts`.
- **Alasan**: satu tempat untuk shell/guard; rute rapi dan mudah dipetakan ke peran; sesuai
  struktur target yang sudah dirujuk plan backend §6.2.
- **Alternatif ditolak**: guard di setiap halaman (duplikasi); middleware Next.js saja (tidak
  bisa memverifikasi peran tanpa memanggil API di edge; tetap perlu gate klien untuk UI).
- **Konsekuensi**: navigasi & aksi yang tidak diizinkan disembunyikan, tetapi server tetap
  menegakkan (FR-16/SC-002); GUARD hanya UX.

## FRD6. Penanganan error: peta `extensions.code` terpusat

- **Keputusan**: satu modul `src/lib/errors.ts` memetakan kode GraphQL ke perilaku UI, dipakai
  oleh error link Apollo dan komponen form.
- **Alasan**: backend mengembalikan kode terstruktur (`UNAUTHENTICATED`, `FORBIDDEN`,
  `NOT_FOUND`, `BAD_USER_INPUT`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL` — lihat
  `contracts/api-conventions.md` §3); memetakan sekali mencegah setiap layar menebak pesan.
- **Alternatif ditolak**: menampilkan `error.message` mentah di mana-mana (tidak konsisten);
  per-layar mapping (duplikasi).
- **Konsekuensi**: pesan yang ditampilkan adalah pesan server (Indonesia); kode yang belum
  dipetakan jatuh ke pesan generik + `INTERNAL` ditampilkan sebagai kegagalan umum (tanpa detail
  internal).

## FRD7. Gaya & komponen: **Tailwind 4** + komponen lokal

- **Keputusan**: tetap TailwindCSS 4; komponen bersama minimal di `src/components/`
  (tabel + pagination, form field, dialog konfirmasi, empty state, error state, badge status).
- **Alasan**: sesuai stack terpasang & konstitusi design (Legion); menghindari menambah
  library komponen yang belum dipin.
- **Alternatif ditolak**: menambah shadcn/ui atau MUI (dependensi baru tanpa keputusan);
  CSS modules (meninggalkan konvensi Tailwind yang sudah ada).
- **Konsekuensi**: token desain Legion (bila tersedia di repo) dipakai; bila belum ada, gaya
  mengikuti Tailwind default sampai pilar design memberi token konkret.

## FRD8. Testing: Vitest + RTL + `MockedProvider`

- **Keputusan**: perluas `vitest.config.ts` (`environment: "jsdom"`,
  `include: ["src/**/*.test.ts", "src/**/*.test.tsx"]`), pasang RTL, test komponen memakai
  `MockedProvider`.
- **Alasan**: runner sudah ada (jangan membuat yang kedua); RTL + MockedProvider adalah cara
  standar menguji state loading/error/empty tanpa server.
- **Alternatif ditolak**: Jest (runner kedua), Playwright sebagai satu-satunya test (lambat,
  tidak memberi umpan balik unit).
- **Konsekuensi**: `npm test` tetap satu perintah; test E2E Playwright menyusul sebagai
  tambahan, bukan pengganti.

## FRD9. Migrasi slice legacy `/talents`

- **Keputusan**: rute `/talents` dan klien REST `src/lib/api.ts` **dipertahankan sementara**,
  port ke GraphQL pada gelombang F9, lalu keduanya dihapus bersama `src/lib/talents.ts`.
- **Alasan**: klien REST menyasar API eksternal (`GET /profiles`, `POST /users`) yang **tidak
  dilayani** `tania-backend`; menghapus lebih dulu akan menghilangkan satu-satunya UI yang ada
  tanpa pengganti.
- **Alternatif ditolak**: hapus langsung (kehilangan permukaan yang ada); biarkan permanen
  (dua klien data selamanya — melanggar §VIII single source).
- **Konsekuensi**: dua klien data hidup berdampingan sampai F9; konstitusi 1.1.1 sudah
  mencatat periode transisi ini.

## FRD10. Yang sengaja **tidak** dipakai

- **State manager global** (Redux/Zustand/Jotai) — state server ditangani cache Apollo; state UI
  lokal cukup `useState`/`useReducer` per fitur.
- **i18n runtime** (next-intl/i18next) — UI hanya berbahasa Indonesia (NFR), jadi tidak ada
  kebutuhan multi-bahasa; copy ditulis langsung.
- **GraphQL subscription/WebSocket** — tidak ada kebutuhan realtime di spec.
- **Virtualisasi tabel** — ditunda sampai ada bukti masalah render pada 5.000 baris
  (pagination cursor sudah membatasi jumlah baris per halaman).
- **Design system baru** — komponen lokal + Tailwind; pilar design (Legion) tetap acuan.
