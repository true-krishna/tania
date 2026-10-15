# Implementation Plan: Asisten Data & Rekomendasi (Chatbot) untuk Chapter dan Operation

**Branch**: `005-asisten-data-chatbot` | **Date**: 2026-10-14 | **Spec**: `specs/005-asisten-data-chatbot/spec.md` (TAN-203, Final)

**Revisi**: 2026-10-14 — `/speckit.clarify` teknis (TAN-204): (a) review arsitektur menemukan baca existing untuk **daftar** karyawan/kontrak bersifat Operation/Admin-only sehingga persona Chapter gagal di 5 dari 6 tool → ditambahkan **baca ber-cakupan chapter** (D9, R-11) tanpa permukaan GraphQL baru & tanpa amandemen matriks RBAC; (b) kirim pesan diberi **idempotensi** (`clientRequestId`) agar retry setelah kegagalan provider tidak menggandakan pesan user (S2); (c) `ringkas_data` memakai angka dashboard existing untuk FR-29/FR-30 (S3); (d) **retensi 90 hari disetujui pemilik produk**; (e) verifikasi provider dipindah ke **prasyarat K0** + enumerasi model via `GET /models`.

**Input**: Feature specification from `/specs/005-asisten-data-chatbot/spec.md`

**Perintah**: `/speckit.plan` — hasil untuk tiket TAN-204 atas spec TAN-203

**Repo**: **tania-dashboard** (rumah spec & UI asisten) + **tania-backend** (orkestrasi AI, penyimpanan percakapan, kontrak GraphQL) — kedua repo diubah sesuai kebutuhan spec; **stack existing tidak berubah**.

---

## Summary

Menambahkan **asisten percakapan grounded & read-only** di dalam aplikasi Tania untuk peran **Chapter & Operation** (MVP), bersumber hanya dari **data karyawan & kontrak**. Pendekatan teknis: orkestrasi AI hidup **di dalam `tania-backend`** sebagai modul clean-architecture baru (keputusan NC-04 yang memang diserahkan ke fase ini) — gateway LLM memakai endpoint **OpenAI-compatible milik organisasi via API key** (tanpa dependensi baru; `net/http` stdlib), grounding ditegakkan lewat **tool-calling loop** yang memanggil usecase read **dengan identitas penanya**, sehingga otorisasi identik peran terjadi by construction (FR-06). Karena baca existing untuk *daftar* karyawan & kontrak bersifat Operation/Admin-only, ditambahkan **tiga baca ber-cakupan chapter** di lapisan usecase (D9) — tanpa query/mutation GraphQL baru dan tanpa amandemen matriks RBAC. Percakapan disimpan di dua tabel baru (`chat_conversations`, `chat_messages`) dengan privasi mutlak per user termasuk dari Admin (FR-02), guardrail biaya berbasis env (FR-10), dan panel + bubble UI di `tania-dashboard` mengikuti TANIA Pulse (aksen `--tp-brand-red` untuk tombol AI sesuai design constitution 4.3.0). Tidak ada perubahan skema entitas bisnis, tidak ada amandemen matriks RBAC, tidak ada provider/framework baru.

## Technical Context

Stack dipin dari konstitusi v1.2.0 (Additional Constraints); **satu-satunya penambahan** adalah komponen yang khusus dibutuhkan fitur ini (modul chat + gateway LLM), semuanya di dalam stack existing.

| Aspek | Keputusan |
| --- | --- |
| Backend | Go 1.26 clean architecture (`transport → usecase → domain → repository`) + PostgreSQL 16 (pgx, migrasi forward-only) + GraphQL gqlgen + Redis + JWT — **tania-backend**, tanpa perubahan stack |
| Integrasi model AI | Endpoint **OpenAI-compatible `/chat/completions`** milik organisasi (self-hosted; NC-04) via `net/http` + `encoding/json` — **nol dependensi Go baru**; base URL + API key + model dari env/secret store |
| Mekanisme grounding | Tool-calling loop atas toolset read-only tertutup dengan identitas penanya: usecase existing + **3 baca ber-cakupan** (daftar/pencarian karyawan, kontrak segera berakhir & perlu tindak lanjut, kelengkapan data diri) untuk persona Chapter (D3, D9) |
| Frontend | TypeScript 5, Next.js (App Router), React 19, TailwindCSS 4, Apollo Client 3 + codegen (`src/generated/graphql/`) — **tania-dashboard**, tanpa perubahan stack |
| UI system | TANIA Pulse (`src/components`, tokens `--tp-*`); aksen merah brand untuk aksi AI (design constitution 4.3.0) |
| Testing | Backend: Go unit/contract (`usecase` + fakes, `authz_test`, `httpapi/e2e_test`, `security_test`); Frontend: Vitest + RTL (`MockedProvider`) + Playwright e2e |
| Constraints | Otorisasi ditegakkan server-side pada setiap kueri (Security III); percakapan privat mutlak per user (FR-02); NIK hanya pernah tampil tersamar (FR-42/FR-07); tanpa PII pada log; API key tidak pernah di-commit/di-log (FR-10, Security III/VIII) |
| Scale/Scope | 2 tabel baru; 1 modul backend baru (domain/usecase/repo/gateway); 2 query + 2 mutation GraphQL; 1 fitur UI (panel + bubble); 6 tool data MVP |

## Constitution Check

*GATE: lulus sebelum eksekusi; diperiksa ulang setelah desain rinci (bagian bawah).* Rujukan pilar: `.specify/memory/constitution-{security,technical,design}.md`.

| Prinsip | Pemeriksaan | Status |
| --- | --- | --- |
| **Security I** — lawful basis & purpose limitation | Dasar pemrosesan konten pertanyaan yang dikirim ke provider dideklarasikan di `data-model.md` (basis internal, provider di dalam perimeter organisasi); konten percakapan hanya dipakai untuk menyajikan jawaban, bukan pelatihan/proses lain | **Lulus** (deklarasi tercatat; DAMP pra-rilis = Open Item 3) |
| **Security II** — minimisasi & klasifikasi | Semua field baru diklasifikasi di `data-model.md`; tool memproyeksikan field minimal (NIK hanya `nikMasked`); TANPA data pribadi di log (log hanya ID percakapan, ID user teknis, jumlah token) | **Lulus** |
| **Security III** — keamanan by design | Otorisasi reuse `RequireRole` + `ChapterScope` di sisi server pada setiap kueri tool (termasuk baca ber-cakupan D9); API key via secret store/env (FR-10); tanpa endpoint GraphQL baru di luar modul chat | **Lulus** |
| **Security IV** — hak subjek & retensi | Retensi percakapan **90 hari lalu hapus permanen** — **disetujui pemilik produk 2026-10-14**; dijalankan job terjadwal pola `runRetentionJob` existing, dengan aksi **hard delete** (berbeda dari anonimisasi retensi karyawan) + jejak audit; DAMP pra-rilis dicatat | **Lulus** |
| **Technical I** — smallest change | Tidak ada layanan/proyek baru; tidak ada framework baru; entitas bisnis tidak diubah (kontrak spec Out of Scope); penambahan kode terbatas pada 2 tabel chat, 1 modul, dan 3 baca ber-cakupan yang memang dibutuhkan persona Chapter (D9) | **Lulus** |
| **Technical II/III** — quality by machines & testing | Perubahan perilaku disertai test unit/contract/e2e; gerbang `make test` + `pnpm lint/typecheck/test` wajib hijau | **Lulus** |
| **Technical V** — dependency hygiene | Backend: `net/http` stdlib saja; Frontend: tanpa `npm install` baru (renderer format teks ditulis sendiri, tanpa `react-markdown`) | **Lulus** |
| **Technical VII** — boundaries | Lapisan: UI → GraphQL resolver → `ChatService` (usecase) → gateway/tool → usecase domain existing → repository. UI bukan batas keamanan | **Lulus** |
| **Design I/II** — tokens.css kanon; satu aksi primer | Panel & bubble memakai token `--tp-*` existing; tombol buka asisten memakai peran aksen merah "AI actions"; bukan warna baru, bukan gradien | **Lulus** |
| **Design III/VI** — tipografi & aksesibilitas | UI Bahasa Indonesia, sentence case, Nunito Sans; pesan kegagalan memakai pola `DataState`/Toast existing | **Lulus** |
| **API contract** — satu sumber kebenaran | Skema yang dilayani: `tania-backend/graph/schema.graphqls` — ditambah, lalu codegen frontend diregenerasi; kontrak desain fitur didokumentasikan di `contracts/chat.md` | **Lulus** |

**Complexity Tracking**: tidak ada pelanggaran yang perlu dijustifikasi. Satu deviasi kecil yang disengaja dan didokumentasikan: konfigurasi `AI_PROVIDER_*` yang belum lengkap **tidak** menghentikan proses saat startup (menyimpang dari bacaan ketat Prinsip IX) karena fitur bersifat aditif — kegagalan dipermudah secara eksplisit per permintaan chat (FR-11); lihat R-2 pada `research.md`.

## Project Structure

### Documentation (fitur ini)

```text
specs/005-asisten-data-chatbot/     # di tania-dashboard (rumah spec)
├── spec.md                         # sudah ada (TAN-203, Final)
├── plan.md                         # dokumen ini
├── research.md                     # Phase 0
├── data-model.md                   # Phase 1
├── quickstart.md                   # Phase 1
└── contracts/
    └── chat.md                     # kontrak GraphQL chat + toolset data
# tasks.md (Phase 2) dibuat pada /speckit.tasks — bukan keluaran perintah ini
```

### Source Code (delta yang dibuat plan ini)

```text
tania-backend/
├── graph/
│   ├── schema.graphqls             # + ChatConversation, ChatMessage, 2 query, 2 mutation
│   └── schema.resolvers.go         # + resolver chat (regenerasi gqlgen)
├── internal/
│   ├── domain/chat.go              # entitas ChatConversation/ChatMessage + repo & gateway interfaces
│   ├── repository/postgres/chat.go # persistensi percakapan (ownership di WHERE)
│   ├── usecase/chat.go             # ChatService: gate peran, privasi, guardrail, loop tool-calling
│   ├── usecase/chat_tools.go       # toolset read-only (adapter ke Employee/Contract/Dashboard usecase)
│   ├── platform/llm/openai.go      # gateway OpenAI-compatible (net/http); kredensial dari env
│   ├── config/config.go            # + AI_PROVIDER_BASE_URL, AI_PROVIDER_API_KEY, AI_PROVIDER_MODEL, AI_MAX_OUTPUT_TOKENS, AI_REQUEST_TIMEOUT
│   └── platform/migrations/sql/0013_chat_conversations.sql
└── cmd/api/main.go                 # wiring ChatService + purge percakapan pada job retensi existing

tania-dashboard/
├── src/features/assistant/
│   ├── assistant.graphql           # dokumen GraphQL (query riwayat, mutation kirim)
│   ├── AssistantPanel.tsx          # panel chat (riwayat, chip, input ≤2000, state muat/gagal)
│   ├── AssistantBubble.tsx         # bubble akses melayang (role-gated CHAPTER/OPERATION)
│   └── assistant.test.tsx          # Vitest + RTL + MockedProvider
├── src/app/(app)/layout.tsx        # pasang bubble+panel sekali di app shell (role-gated)
└── src/generated/graphql/          # regenerasi codegen (tidak pernah diedit manual)
```

**Structure Decision**: modul mengikuti pola modul fitur backend existing persis (bandingkan `entra`/`retention`: interface di `domain`, implementasi di `platform` + `repository/postgres`, logika di `usecase`, resolver tipis di `graph`); UI adalah satu fitur baru di `src/features/assistant` yang dipasang di app shell — konsisten dengan `src/features/*` existing. Tidak ada direktori proyek baru.

## Keputusan Desain

| # | Keputusan | Alasan |
| --- | --- | --- |
| D1 | **Orkestrasi AI di dalam `tania-backend`** — modul clean-architecture baru, bukan layanan terpisah | Keputusan teknis yang diserahkan ke fase plan (NC-04). Tool grounding harus berjalan **dengan identitas penanya** memakai usecase existing; proses terpisah berarti jalur otorisasi baru/duplikat, deployment baru, dan rajah kepercayaan baru — melanggar kendala user ("stack existing tidak berubah"), Technical I, dan Security III. Referensi pola: `EntraService` (usecase + gateway/platform client di dalam proses) |
| D2 | **Gateway LLM OpenAI-compatible** (`/chat/completions`) dengan tool calling, via stdlib `net/http` | "Provider milik sendiri, tinggal tempel API key" (NC-04). OpenAI-compatible adalah konvensi de-facto provider self-hosted (vLLM/Ollama/TGI/LiteLLM), sehingga tidak mengikat ke vendor; interface `domain.LLMGateway` tipis menjaga kemampuan ganti endpoint tanpa menyentuh usecase. Kredensial hanya dari env/secret store; tidak pernah di-log (FR-10, Security III) |
| D3 | **Grounding = tool-calling atas toolset tertutup**; model tidak pernah melihat basis data, hanya hasil tool | Memenuhi FR-04/FR-06 by construction: setiap tool berjalan dengan identitas penanya dan otorisasi/cakupan diwarisi dari lapisan usecase. **Koreksi review 2026-10-14**: warisan itu hanya berlaku untuk baca *single-record* ber-cakupan (`EmployeeService.Get`); baca *daftar* (`EmployeeService.List`, seluruh baca kontrak) Operation/Admin-only → lihat **D9**. Alternatif: text-to-SQL ditolak (risiko injeksi & otorisasi), context-stuffing seluruh data ditolak (skala & minimisasi) |
| D4 | **Percakapan privat mutlak per user, termasuk dari Admin** | FR-02 eksplisit (spec mengesampingkan kemampuan umum Admin); query repo selalu `WHERE user_id = pemanggil`; akses percakapan orang lain → `ErrNotFound` (anti-enumerasi, pola `scope.go`). Diuji eksplisit di security & e2e test |
| D5 | **Panel sinkron non-streaming** dengan batas laten tegas (timeout `AI_REQUEST_TIMEOUT` default 25s, maks 5 putaran tool, `AI_MAX_OUTPUT_TOKENS` default 800) | Tidak ada infrastruktur subscription di backend (verifikasi audit) — menambahkannya = permukaan baru di luar kebutuhan MVP (Technical I). SC-001 (<30 detik) terpenuhi oleh batas tersebut; streaming jadi kandidat fase lanjutan bila UAT menunjukkan kebutuhan |
| D6 | **Guardrail biaya dari env, nilai default spec-pinned** | FR-10: riwayat konteks **12 pesan** dan panjang pesan **2.000 karakter** tetap (perubahan butuh persetujuan pemilik — dicatat di plan ini sebagai kebijakan, bukan konfigurasi); model & batas token keluaran dari env agar lingkungan bisa menyetel model hemat tanpa deploy kode. Pemakaian token per pesan tersimpan di `chat_messages` untuk laporan biaya |
| D7 | Renderer jawaban **ditulis sendiri** (bold `**…**`, daftar, baris baru) — tanpa `react-markdown` | FR-05 hanya mensyaratkan angka penting ditonjolkan; dependency baru untuk satu kebutuhan kecil melanggar Technical V. Format keluaran dibatasi oleh system prompt sehingga subset kecil cukup |
| D8 | Teks antarmuka & jawaban **Bahasa Indonesia**; chip contoh per peran dari konfigurasi statis di frontend | FR-01/FR-03; chips dipetakan ke toolset yang tersedia sehingga semua contoh benar-benar dapat dijawab (tidak menjanjikan yang tidak di-ground) |
| D9 | **Tiga baca ber-cakupan chapter di lapisan usecase** (`RequireRole(Chapter, Operation)`), **tidak diekspos sebagai query GraphQL baru** | **Koreksi review arsitektur (M1)** — tanpa ini persona Chapter (US2 AC1, US4 AC1, US5) menerima FORBIDDEN di 5 dari 6 tool: `EmployeeService.List` = Admin+Operation (`internal/usecase/employee.go`), `ContractService.List/Get/Expiring/NeedingFollowUp` = Operation dan tanpa scope chapter (`internal/usecase/contract.go`, `internal/repository/postgres/contract.go`), dan `ChapterDashboard` tidak memuat angka karyawan/kontrak (`internal/domain/dashboard.go`). Perbaikan minimal: (1) daftar/pencarian karyawan ber-cakupan **reuse** `EmployeeRepository.Search(ctx, filter, scopeChapterID *string, page)` yang sudah ada (nol perubahan repo); (2) `EmployeesNeedingFollowUp` + parameter scope (`jr.chapter_id`); (3) kontrak segera berakhir + `ScopeChapterID *string` pada `domain.ContractFilter` (baris kontrak menyimpan `job_role_id`; `contractSelect` sudah join job role/chapter) — dipakai internal saja, resolver GraphQL **tidak** memetakan nilai dari klien ke field ini; (4) kelengkapan data diri mengikuti pola (1) |

## Pemetaan Spec → Implementasi

| Spec | Rencana | Bukti / Mekanisme |
| --- | --- | --- |
| US1 — panel + riwayat (P1) | Frontend panel & bubble + `chatConversations`/`chatMessages`/`createChatConversation` | Riwayat persist di PostgreSQL per user; role gate UI `CHAPTER/OPERATION` + server |
| US2 — ringkasan cakupan (P1) | Tool `ringkas_data` (snapshot agregat karyawan & kontrak sesuai peran) | Angka yang sudah ada di dashboard diambil dari `DashboardService.For(identity)`/`DashboardRepository` (FR-29/FR-30 konsisten by construction — S3); agregat kontrak (belum ada di dashboard, juga tidak untuk Chapter) dari baca ber-cakupan D9 |
| US3 — tanya data faktual (P1) | Tool `cari_karyawan`, `detail_karyawan`, `kontrak_segera_berakhir`, `karyawan_perlu_tindak_lanjut` | Mapper tipis di atas usecase existing + baca ber-cakupan D9 untuk Chapter (baca kontrak existing menolak Chapter); hasil dibatasi (page size kecil) & diproyeksikan aman |
| US4 — otorisasi & privasi (P1) | Semua tool berjalan dengan `domain.Identity` penanya; privasi percakapan di repo/usecase | `ChapterScope` + `RequireRole` existing + gate `RequireRole(Chapter, Operation)` pada baca D9; test lintas-cakupan (dua chapter) & anti-baca lintas user; NIK hanya `nikMasked` keluar dari lapisan domain (FR-07) |
| US5 — rekomendasi tekstual (P2) | System prompt: rekomendasi selalu dirujuk ke dasar data + berlabel saran + arahkan ke modul; read-only dipaksa arsitektur (tidak ada tool tulis) | FR-09 opsi (a); kegagalan grounding diuji (data tidak cukup → jujur) |
| US6 — guardrail biaya (P2) | Penolakan >2.000 karakter sebelum memanggil model; konteks 12 pesan; pencatatan token per pesan | D6; FR-10; penolakan tidak memicu pemakaian model (diuji) |
| FR-01/FR-03/FR-12 | UI panel+bubble+chips; jawaban Bahasa Indonesia; penolakan di luar domain via system prompt | FR-12 ditutup test (pertanyaan cuaca → penolakan kategori) |
| FR-04/FR-05/FR-11 | Toolset tertutup + template sumber/periode pada jawaban; kegagalan provider → pesan jujur | D3/D5; fake gateway menguji kegagalan |
| FR-08 | Tidak ada tool tulis; tidak ada mutasi selain percakapan sendiri | Arsitektural — tidak mungkin melanggar |
| FR-10 | Lihat D6 + env keys | R-9 |
| SC-001–SC-004 | Laten dibatasi D5; konsistensi data dari reuse usecase (SC-002); keamanan diuji (SC-003); token tercatat (SC-004) | quickstart.md berisi skenario validasi lengkap |

## Data & API (ringkas)

- **Skema baru (satu sumber kebenaran: `graph/schema.graphqls`)**: tipe `ChatConversation`, `ChatMessage`, enum `ChatMessageRole`; query `chatConversations`, `chatMessages`; mutation `createChatConversation`, `sendChatMessage(conversationId, content)` — sinkron, mengembalikan **balasan asisten**. Detail lengkap + aturan otorisasi: [`contracts/chat.md`](./contracts/chat.md); entitas & retensi: [`data-model.md`](./data-model.md).
- **Toolset data** (read-only, informasi lengkap di contracts): `ringkas_data`, `cari_karyawan`, `detail_karyawan`, `kontrak_segera_berakhir`, `karyawan_perlu_tindak_lanjut`, `karyawan_data_belum_lengkap` — memakai usecase existing + **tiga baca ber-cakupan chapter** (tanpa perubahan skema existing, tanpa permukaan GraphQL baru; lihat D9 & `data-model.md` §Penambahan baca ber-cakupan).
- **Tanpa perubahan** pada entitas bisnis, matriks RBAC, skema master data, atau endpoint existing.

## Security (rekap slice)

Otorisasi berlaku di usecase (`RequireRole(Chapter, Operation)` untuk seluruh operasi chat — Admin/Talent ditolak sesuai FR-01) dan pada setiap kueri tool lewat usecase yang memeriksa peran & cakupan — termasuk baca ber-cakupan chapter (D9) untuk daftar karyawan/kontrak. Percakapan hanya milik pemanggil (FR-02, termasuk terhadap Admin). NIK hanya pernah keluar sebagai `nikMasked`. API key provider hidup di env/secret store, tidak pernah di-commit/di-log; log modul chat memuat ID teknis & jumlah token saja (tanpa isi pesan). Konten pertanyaan dikirim ke provider milik organisasi (perimeter internal) dengan dasar pemrosesan yang dideklarasikan di data-model; retensi percakapan dijalankan job scheduled dengan pola retensi existing.

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Unit backend | `ChatService`: gate peran (Admin/Talent ditolak), kepemilikan percakapan, panjang pesan, jendela konteks 12, pencatatan token, loop tool (maks putaran, hasil grounding), kegagalan gateway → jawaban jujur | Go test + fakes (`fakeGateway`), pola `fakes_*_test.go` |
| Authz/contract | Baris matriks baru di `internal/usecase/authz_test.go` (chat: Chapter/Operation ✓; Talent/Admin ✗) + baris per **baca ber-cakupan D9**: Chapter dalam cakupan ✓, Chapter luar cakupan ✗ `ErrNotFound` (bukti US4); `internal/transport/httpapi/security_test.go`: Admin tidak dapat membaca percakapan user lain | Go test existing harness |
| E2E backend | Alur penuh `sendChatMessage` via HTTP dengan gateway palsu (grounded answer, penolakan panjang, penolakan non-MVP role, **retry idempoten**: `clientRequestId` sama → tidak ada pesan user ganda) | `internal/transport/httpapi/e2e_test.go` |
| Komponen frontend | Panel terbuka (dashboard & bubble), chip per peran, kirim & tampil balasan, riwayat dimuat ulang, blokir >2.000 karakter, guard role, state gagal | Vitest + RTL + `MockedProvider` |
| E2E frontend | Tambahan skenario pada `critical-path.spec.ts`: Chapter login → tanya → balasan tampil; Talent/Admin: panel tidak tersedia | Playwright |
| K3 (UAT) | Skenario acceptance US1–US6 + probe keamanan (dua Chapter lintas chapter, percobaan prompt-injection, provider mati) | quickstart.md |

## Roadmap (gelombang eksekusi)

| Gelombang | Pekerjaan | Menutup |
| --- | --- | --- |
| **K0 — Verifikasi provider (prasyarat, ±0,5 jam)** | `GET {base}/models` pada endpoint pemilik → enumerasi model, tetapkan `AI_PROVIDER_MODEL` hemat; probe tool calling (`quickstart.md` §A); bila tool calling tidak didukung → lapor ke pemilik beserta dampaknya **sebelum** menulis kode | Open Item 2 |
| **K1 — Fondasi backend** | Migrasi 2 tabel (termasuk `client_request_id`); domain/usecase/repo chat; **3 baca ber-cakupan (D9)**; resolver + skema + regenerasi gqlgen; config env; gateway OpenAI-compatible; toolset & loop; idempotensi kirim; authz/security/e2e test | US4, US6, FR-02/06/10/11 |
| **K2 — Frontend** | Codegen; `features/assistant` (panel, bubble, chips, riwayat, guard role); pasang di app shell; Vitest/RTL; e2e Playwright | US1, FR-01/03/05/12 |
| **K3 — End-to-end & UAT** | UAT dengan provider organisasi yang sudah diverifikasi di K0; skenario quickstart; pengukuran token & biaya sampel; checklist acceptance | SC-001–SC-004 |

Estimasi: K1 ±2–2,5 hari; K2 ±1,5–2 hari; K3 ±0,5–1 hari. Rincian task menyusul pada `/speckit.tasks`.

## Open Items

1. ~~Retensi percakapan~~ — **DISETUJUI pemilik produk (2026-10-14)**: retensi **90 hari lalu hapus permanen** (privacy-minimizing; isi percakapan memuat cuplikan data karyawan). Dijalankan job terjadwal pola `runRetentionJob` existing dengan aksi **hard delete** — berbeda dari anonimisasi retensi karyawan — plus jejak audit. *(data-model.md §Retensi)*
2. **Verifikasi endpoint provider — dipindah ke prasyarat K0, bukan K3** (keputusan pemilik 2026-10-14: provider **OpenAI-like**; URL + API key akan diberikan agar model yang tersedia dapat dienumerasi). Langkah: `GET {base}/models` → pilih model hemat; lalu probe tool calling (`quickstart.md` §A). Bila tool calling tidak didukung, fallback terbatas **tidak** dibangun spekulatif — lapor ke pemilik dengan dampaknya sebelum K1 (Technical I). **Dibutuhkan dari pemilik: base URL + API key** (lewat jalur aman, jangan ditempel di komentar issue).
3. **DAMP pra-rilis** — pemrosesan konten pertanyaan (bisa memuat nama karyawan) oleh provider internal dinilai risiko rendah-sedang; checklist DAMP dijalankan konkret pada gerbang rilis (Security IV).
4. **Persetujuan guardrail (FR-10)** — masih menggantung; nilai default di plan ini **bukan** persetujuan. Butir yang perlu diputuskan pemilik (lembar keputusan dikirim di komentar TAN-204 2026-10-14):
   - **(a)** batas **anggaran biaya AI bulanan** yang disetujui (SC-004) + siapa pemantau laporan token.
   - **(b)** **model default** dari daftar provider (ditetapkan setelah enumerasi K0) dan kriteria "model hemat".
   - **(c)** batas **token keluaran per jawaban** (usulan 800) dan **timeout permintaan** (usulan 25 s).
   - **(d)** **proses kenaikan batas** (perubahan kode + persetujuan pemilik = konstanta, bukan flip env — R-9) dan **kadensi laporan token**.
   - **(e)** **rate limit per user** pada `sendChatMessage` (usulan: reuse `RateLimiter.Allow` Redis yang sudah dipakai login, mis. 20 pesan/jam/user) — tidak diminta spec, tetapi biaya per user jadi terkendali; keputusan pemilik.

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| R1 | Provider organisasi ternyata tanpa tool calling / skema respons beda | Grounding melemah; rencana K1 menyentuh gateway saja | Interface `domain.LLMGateway` tipis; verifikasi awal K3 cepat; kontingensi dikembalikan ke pemilik (Open Item 2), tidak dibangun spekulatif |
| R2 | Laten total (multi-putaran tool) melewati 30 detik | SC-001 | Timeout 25s + maks 5 putaran tool + output token dibatasi; diukur di K3; streaming dicatat sebagai opsi lanjutan |
| R3 | Jawaban mengarang selain hasil tool | Cacat grounding (SC-002) | System prompt ketat + toolset tertutup + template sumber; sampling test berkala di quickstart |
| R4 | Prompt injection meminta data lintas cakupan/NIK penuh | Kebocoran | Tidak bisa menembus: tool sudah ber-otorisasi identik penanya; NIK tersamar di lapisan domain; diuji eksplisit |
| R5 | Kebocoran privasi percakapan (lintas user/peran) | Pelanggaran FR-02 | Kepemilikan di WHERE query + uji Admin/Chapter lain → ditolak; anti-enumerasi `ErrNotFound` |
| R6 | Biaya meledak dari pemakaian berlebih | FR-10 | Batas panjang & token & putaran; token tercatat per pesan untuk pelaporan; kenaikan batas = persetujuan pemilik; rate limit per user (Open Item 4e) |
| R7 | Retry setelah kegagalan provider menggandakan pesan user (riwayat & jendela konteks kotor, biaya ganda) | Kualitas riwayat, biaya | Idempotensi `clientRequestId` pada `sendChatMessage` (S2, `contracts/chat.md`); diuji di e2e |
