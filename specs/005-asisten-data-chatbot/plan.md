# Implementation Plan: Asisten Data & Rekomendasi (Chatbot) untuk Chapter dan Operation

**Branch**: `005-asisten-data-chatbot` | **Date**: 2026-10-14 | **Spec**: `specs/005-asisten-data-chatbot/spec.md` (TAN-203, Final)

**Input**: Feature specification from `/specs/005-asisten-data-chatbot/spec.md`

**Perintah**: `/speckit.plan` — hasil untuk tiket TAN-204 atas spec TAN-203

**Repo**: **tania-dashboard** (rumah spec & UI asisten) + **tania-backend** (orkestrasi AI, penyimpanan percakapan, kontrak GraphQL) — kedua repo diubah sesuai kebutuhan spec; **stack existing tidak berubah**.

---

## Summary

Menambahkan **asisten percakapan grounded & read-only** di dalam aplikasi Tania untuk peran **Chapter & Operation** (MVP), bersumber hanya dari **data karyawan & kontrak**. Pendekatan teknis: orkestrasi AI hidup **di dalam `tania-backend`** sebagai modul clean-architecture baru (keputusan NC-04 yang memang diserahkan ke fase ini) — gateway LLM memakai endpoint **OpenAI-compatible milik organisasi via API key** (tanpa dependensi baru; `net/http` stdlib), grounding ditegakkan lewat **tool-calling loop** yang memanggil usecase read existing (`EmployeeService`, `ContractService`) **dengan identitas penanya**, sehingga otorisasi identik peran terjadi by construction (FR-06) tanpa jalur data baru. Percakapan disimpan di dua tabel baru (`chat_conversations`, `chat_messages`) dengan privasi mutlak per user termasuk dari Admin (FR-02), guardrail biaya berbasis env (FR-10), dan panel + bubble UI di `tania-dashboard` mengikuti TANIA Pulse (aksen `--tp-brand-red` untuk tombol AI sesuai design constitution 4.3.0). Tidak ada perubahan skema entitas bisnis, tidak ada amandemen matriks RBAC, tidak ada provider/framework baru.

## Technical Context

Stack dipin dari konstitusi v1.2.0 (Additional Constraints); **satu-satunya penambahan** adalah komponen yang khusus dibutuhkan fitur ini (modul chat + gateway LLM), semuanya di dalam stack existing.

| Aspek | Keputusan |
| --- | --- |
| Backend | Go 1.26 clean architecture (`transport → usecase → domain → repository`) + PostgreSQL 16 (pgx, migrasi forward-only) + GraphQL gqlgen + Redis + JWT — **tania-backend**, tanpa perubahan stack |
| Integrasi model AI | Endpoint **OpenAI-compatible `/chat/completions`** milik organisasi (self-hosted; NC-04) via `net/http` + `encoding/json` — **nol dependensi Go baru**; base URL + API key + model dari env/secret store |
| Mekanisme grounding | Tool-calling loop atas toolset read-only tertutup yang mengadaptasi usecase existing dengan identitas penanya (D3) |
| Frontend | TypeScript 5, Next.js (App Router), React 19, TailwindCSS 4, Apollo Client 3 + codegen (`src/generated/graphql/`) — **tania-dashboard**, tanpa perubahan stack |
| UI system | TANIA Pulse (`src/components`, tokens `--tp-*`); aksen merah brand untuk aksi AI (design constitution 4.3.0) |
| Testing | Backend: Go unit/contract (`usecase` + fakes, `authz_test`, `httpapi/e2e_test`, `security_test`); Frontend: Vitest + RTL (`MockedProvider`) + Playwright e2e |
| Constraints | Otorisasi ditegakkan server-side pada setiap kueri (Security III); percakapan privat mutlak per user (FR-02); NIK hanya pernah tampil tersamar (FR-42/FR-07); tanpa PII pada log; API key tidak pernah di-commit/di-log (FR-10, Security III/VIII) |
| Scale/Scope | 2 tabel baru; 1 modul backend baru (domain/usecase/repo/gateway); 2 query + 2 mutation GraphQL; 1 fitur UI (panel + bubble); 6 tool data MVP |

## Constitution Check

*GATE: lulus sebelum eksekusi; diperiksa ulang setelah desain rinci (bagian bawah).* Rujukan pilar: `.specify/memory/constitution-{security,technical,design}.md`.

| Prinsip | Pemeriksaan | Status |
| --- | --- | --- |
| **Security I** — lawful basis & purpose limitation | Dasar pemrosesan konten pertanyaan yang dikirim ke provider dideklarasikan di `data-model.md` (basis internal, provider di dalam perimeter organisasi); konten percakapan hanya dipakai untuk menyajikan jawaban, bukan pelatihan/proses lain | **Lulus** (deklarasi wajib → Open Item persetujuan pemilik) |
| **Security II** — minimisasi & klasifikasi | Semua field baru diklasifikasi di `data-model.md`; tool memproyeksikan field minimal (NIK hanya `nikMasked`); TANPA data pribadi di log (log hanya ID percakapan, ID user teknis, jumlah token) | **Lulus** |
| **Security III** — keamanan by design | Otorisasi reuse `RequireRole` + `ChapterScope` di sisi server pada setiap kueri tool; API key via secret store/env (FR-10); tanpa endpoint/otorisasi baru di luar modul chat | **Lulus** |
| **Security IV** — hak subjek & retensi | Retensi percakapan dideklarasikan & dijalankan job purge terjadwal (pola `runRetentionJob` existing); proposal 90 hari → Open Item persetujuan pemilik; DAMP pra-rilis dicatat | **Lulus dengan deklarasi** |
| **Technical I** — smallest change | Tidak ada layanan/proyek baru; tidak ada framework baru; seluruh baca data memakai usecase existing; entitas bisnis tidak diubah (kontrak spec Out of Scope) | **Lulus** |
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
| D3 | **Grounding = tool-calling atas toolset tertutup** yang mengadaptasi usecase read existing dengan identitas penanya; model tidak pernah melihat basis data, hanya hasil tool | Memenuhi FR-04/FR-06 by construction: otorisasi & cakupan chapter-as-data diwarisi dari `EmployeeService`/`ContractService` yang sudah menegakkan `RequireRole` + `ChapterScope`; prompt-injection tidak bisa menembus karena tool memiliki otorisasi yang sama dengan penanya (edge case spec). Alternatif: text-to-SQL ditolak (risiko injeksi & otorisasi), context-stuffing seluruh data ditolak (skala & minimisasi) |
| D4 | **Percakapan privat mutlak per user, termasuk dari Admin** | FR-02 eksplisit (spec mengesampingkan kemampuan umum Admin); query repo selalu `WHERE user_id = pemanggil`; akses percakapan orang lain → `ErrNotFound` (anti-enumerasi, pola `scope.go`). Diuji eksplisit di security & e2e test |
| D5 | **Panel sinkron non-streaming** dengan batas laten tegas (timeout `AI_REQUEST_TIMEOUT` default 25s, maks 5 putaran tool, `AI_MAX_OUTPUT_TOKENS` default 800) | Tidak ada infrastruktur subscription di backend (verifikasi audit) — menambahkannya = permukaan baru di luar kebutuhan MVP (Technical I). SC-001 (<30 detik) terpenuhi oleh batas tersebut; streaming jadi kandidat fase lanjutan bila UAT menunjukkan kebutuhan |
| D6 | **Guardrail biaya dari env, nilai default spec-pinned** | FR-10: riwayat konteks **12 pesan** dan panjang pesan **2.000 karakter** tetap (perubahan butuh persetujuan pemilik — dicatat di plan ini sebagai kebijakan, bukan konfigurasi); model & batas token keluaran dari env agar lingkungan bisa menyetel model hemat tanpa deploy kode. Pemakaian token per pesan tersimpan di `chat_messages` untuk laporan biaya |
| D7 | Renderer jawaban **ditulis sendiri** (bold `**…**`, daftar, baris baru) — tanpa `react-markdown` | FR-05 hanya mensyaratkan angka penting ditonjolkan; dependency baru untuk satu kebutuhan kecil melanggar Technical V. Format keluaran dibatasi oleh system prompt sehingga subset kecil cukup |
| D8 | Teks antarmuka & jawaban **Bahasa Indonesia**; chip contoh per peran dari konfigurasi statis di frontend | FR-01/FR-03; chips dipetakan ke toolset yang tersedia sehingga semua contoh benar-benar dapat dijawab (tidak menjanjikan yang tidak di-ground) |

## Pemetaan Spec → Implementasi

| Spec | Rencana | Bukti / Mekanisme |
| --- | --- | --- |
| US1 — panel + riwayat (P1) | Frontend panel & bubble + `chatConversations`/`chatMessages`/`createChatConversation` | Riwayat persist di PostgreSQL per user; role gate UI `CHAPTER/OPERATION` + server |
| US2 — ringkasan cakupan (P1) | Tool `ringkas_data` (snapshot agregat karyawan & kontrak sesuai peran) | Komposisi `EmployeeService.List` terfilter + `ContractService.Expiring/NeedingFollowUp` dengan identitas penanya; angka identik dengan dashboard (FR-29 konsistensi) |
| US3 — tanya data faktual (P1) | Tool `cari_karyawan`, `detail_karyawan`, `kontrak_segera_berakhir`, `karyawan_perlu_tindak_lanjut` | Mapper tipis di atas usecase existing; hasil dibatasi (page size kecil) & diproyeksikan aman |
| US4 — otorisasi & privasi (P1) | Semua tool berjalan dengan `domain.Identity` penanya; privasi percakapan di repo/usecase | `ChapterScope` + `RequireRole` existing; test lintas-cakupan & anti-baca lintas user; NIK hanya `nikMasked` keluar dari lapisan domain (FR-07) |
| US5 — rekomendasi tekstual (P2) | System prompt: rekomendasi selalu dirujuk ke dasar data + berlabel saran + arahkan ke modul; read-only dipaksa arsitektur (tidak ada tool tulis) | FR-09 opsi (a); kegagalan grounding diuji (data tidak cukup → jujur) |
| US6 — guardrail biaya (P2) | Penolakan >2.000 karakter sebelum memanggil model; konteks 12 pesan; pencatatan token per pesan | D6; FR-10; penolakan tidak memicu pemakaian model (diuji) |
| FR-01/FR-03/FR-12 | UI panel+bubble+chips; jawaban Bahasa Indonesia; penolakan di luar domain via system prompt | FR-12 ditutup test (pertanyaan cuaca → penolakan kategori) |
| FR-04/FR-05/FR-11 | Toolset tertutup + template sumber/periode pada jawaban; kegagalan provider → pesan jujur | D3/D5; fake gateway menguji kegagalan |
| FR-08 | Tidak ada tool tulis; tidak ada mutasi selain percakapan sendiri | Arsitektural — tidak mungkin melanggar |
| FR-10 | Lihat D6 + env keys | R-9 |
| SC-001–SC-004 | Laten dibatasi D5; konsistensi data dari reuse usecase (SC-002); keamanan diuji (SC-003); token tercatat (SC-004) | quickstart.md berisi skenario validasi lengkap |

## Data & API (ringkas)

- **Skema baru (satu sumber kebenaran: `graph/schema.graphqls`)**: tipe `ChatConversation`, `ChatMessage`, enum `ChatMessageRole`; query `chatConversations`, `chatMessages`; mutation `createChatConversation`, `sendChatMessage(conversationId, content)` — sinkron, mengembalikan **balasan asisten**. Detail lengkap + aturan otorisasi: [`contracts/chat.md`](./contracts/chat.md); entitas & retensi: [`data-model.md`](./data-model.md).
- **Toolset data** (read-only, informasi lengkap di contracts): `ringkas_data`, `cari_karyawan`, `detail_karyawan`, `kontrak_segera_berakhir`, `karyawan_perlu_tindak_lanjut`, `karyawan_data_belum_lengkap` (satu penambahan baca kecil di lapisan repository untuk kelengkapan data diri — tanpa perubahan skema; lihat data-model §Penambahan baca).
- **Tanpa perubahan** pada entitas bisnis, matriks RBAC, skema master data, atau endpoint existing.

## Security (rekap slice)

Otorisasi berlaku di usecase (`RequireRole(Chapter, Operation)` untuk seluruh operasi chat — Admin/Talent ditolak sesuai FR-01) dan pada setiap kueri tool lewat usecase existing yang sudah memeriksa peran & cakupan. Percakapan hanya milik pemanggil (FR-02, termasuk terhadap Admin). NIK hanya pernah keluar sebagai `nikMasked`. API key provider hidup di env/secret store, tidak pernah di-commit/di-log; log modul chat memuat ID teknis & jumlah token saja (tanpa isi pesan). Konten pertanyaan dikirim ke provider milik organisasi (perimeter internal) dengan dasar pemrosesan yang dideklarasikan di data-model; retensi percakapan dijalankan job scheduled dengan pola retensi existing.

## Testing

| Level | Cakupan | Alat |
| --- | --- | --- |
| Unit backend | `ChatService`: gate peran (Admin/Talent ditolak), kepemilikan percakapan, panjang pesan, jendela konteks 12, pencatatan token, loop tool (maks putaran, hasil grounding), kegagalan gateway → jawaban jujur | Go test + fakes (`fakeGateway`), pola `fakes_*_test.go` |
| Authz/contract | Baris matriks baru di `authz_test.go` (chat: Chapter/Operation ✓; Talent/Admin ✗); `security_test.go`: Admin tidak dapat membaca percakapan user lain | Go test existing harness |
| E2E backend | Alur penuh `sendChatMessage` via HTTP dengan gateway palsu (grounded answer, penolakan panjang, penolakan non-MVP role) | `internal/transport/httpapi/e2e_test.go` |
| Komponen frontend | Panel terbuka (dashboard & bubble), chip per peran, kirim & tampil balasan, riwayat dimuat ulang, blokir >2.000 karakter, guard role, state gagal | Vitest + RTL + `MockedProvider` |
| E2E frontend | Tambahan skenario pada `critical-path.spec.ts`: Chapter login → tanya → balasan tampil; Talent/Admin: panel tidak tersedia | Playwright |
| K3 (UAT) | Skenario acceptance US1–US6 + probe keamanan (dua Chapter lintas chapter, percobaan prompt-injection, provider mati) | quickstart.md |

## Roadmap (gelombang eksekusi)

| Gelombang | Pekerjaan | Menutup |
| --- | --- | --- |
| **K1 — Fondasi backend** | Migrasi 2 tabel; domain/usecase/repo chat; resolver + skema + regenerasi gqlgen; config env; gateway OpenAI-compatible; toolset & loop; authz/security/e2e test | US4, US6, FR-02/06/10/11 |
| **K2 — Frontend** | Codegen; `features/assistant` (panel, bubble, chips, riwayat, guard role); pasang di app shell; Vitest/RTL; e2e Playwright | US1, FR-01/03/05/12 |
| **K3 — End-to-end & UAT** | Integrasi lingkungan dengan provider organisasi (verifikasi R-2); skenario quickstart; pengukuran token & biaya sampel; checklist acceptance | SC-001–SC-004 |

Estimasi: K1 ±2–2,5 hari; K2 ±1,5–2 hari; K3 ±0,5–1 hari. Rincian task menyusul pada `/speckit.tasks`.

## Open Items

1. **Retensi percakapan** — proposal **90 hari lalu hapus permanen** (privacy-minimizing, komposisi data berisi cuplikan data karyawan). Perlu persetujuan pemilik produk; dijalankan job scheduled pola retensi existing. *(data-model.md §Retensi)*
2. **Verifikasi endpoint provider** — asumsi OpenAI-compatible + tool calling; diverifikasi sekali dengan `curl` saat K3 (quickstart §A). Bila tidak mendukung tool calling: fallback terbatas (agregat + daftar tetap tanpa pemilihan tool oleh model) **tidak** dipilih sekarang — dikembalikan ke pemilik dengan dampaknya (Technical I: jangan bangun dua jalur spekulatif).
3. **DAMP pra-rilis** — pemrosesan konten pertanyaan (bisa memuat nama karyawan) oleh provider internal dinilai risiko rendah-sedang; checklist DAMP dijalankan konkret pada gerbang rilis (Security IV).
4. **Persetujuan guardrail (FR-10)** — masih menggantung dari spec (checklist terbuka); nilai default di plan ini **bukan** persetujuan; perubahan nilai butuh persetujuan eksplisit pemilik.

## Risks

| # | Risiko | Dampak | Tindakan |
| --- | --- | --- | --- |
| R1 | Provider organisasi ternyata tanpa tool calling / skema respons beda | Grounding melemah; rencana K1 menyentuh gateway saja | Interface `domain.LLMGateway` tipis; verifikasi awal K3 cepat; kontingensi dikembalikan ke pemilik (Open Item 2), tidak dibangun spekulatif |
| R2 | Laten total (multi-putaran tool) melewati 30 detik | SC-001 | Timeout 25s + maks 5 putaran tool + output token dibatasi; diukur di K3; streaming dicatat sebagai opsi lanjutan |
| R3 | Jawaban mengarang selain hasil tool | Cacat grounding (SC-002) | System prompt ketat + toolset tertutup + template sumber; sampling test berkala di quickstart |
| R4 | Prompt injection meminta data lintas cakupan/NIK penuh | Kebocoran | Tidak bisa menembus: tool sudah ber-otorisasi identik penanya; NIK tersamar di lapisan domain; diuji eksplisit |
| R5 | Kebocoran privasi percakapan (lintas user/peran) | Pelanggaran FR-02 | Kepemilikan di WHERE query + uji Admin/Chapter lain → ditolak; anti-enumerasi `ErrNotFound` |
| R6 | Biaya meledak dari pemakaian berlebih | FR-10 | Batas panjang & token & putaran; token tercatat per pesan untuk pelaporan; kenaikan batas = persetujuan pemilik |