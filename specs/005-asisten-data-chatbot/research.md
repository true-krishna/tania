# Phase 0 — Research: Asisten Data & Rekomendasi (Chatbot) untuk Chapter dan Operation

**Feature**: `005-asisten-data-chatbot` (TAN-203, plan untuk TAN-204) · **Date**: 2026-10-14

Audit 2026-10-14 atas `tania-dashboard` (branch `agent/cobra/da79d8b05e16` @ `a7d3bc6`) dan `tania-backend`. Kendala dari pemilik produk (TAN-204): **tech stack existing tidak berubah; tambahkan seperlunya sesuai spec; jika tidak ada yang perlu, jangan tambahkan apapun.** Seluruh butir teknis di bawah diselesaikan sebelum desain; tidak ada `NEEDS CLARIFICATION` tersisa (butir yang butuh keputusan pemilik produk dicatat sebagai Open Items di `plan.md`, bukan unknown teknis).

## R-1 — Di mana orkestrasi AI ditempatkan? (NC-04, diserahkan ke fase ini)

- **Decision**: **Di dalam `tania-backend`** sebagai modul clean-architecture baru (`domain/chat.go` → `usecase/chat.go` + `usecase/chat_tools.go` → `repository/postgres/chat.go` + `platform/llm/openai.go`), bukan layanan terpisah.
- **Rationale**: mekanisme grounding wajib menjalankan kueri data **dengan identitas penanya** melalui usecase yang sama dengan aplikasi (FR-06). Di dalam proses yang sama, tool cukup memanggil `EmployeeService`/`ContractService` — otorisasi, cakupan chapter-as-data, dan penyamaran NIK **diwarisi**, bukan ditulis ulang. Layanan terpisah berarti: jalur otorisasi baru (duplikasi matriks RBAC atau trust boundary internal baru), deployment & observability baru, dan perubahan rajah stack — bertentangan dengan kendala pemilik produk dan Prinsip Technical I & Security III. Pola internal yang membuktikan kelayakan: `EntraService` (usecase + client `platform/entra` di dalam proses) dan `RetentionService` (job terjadwal in-process).
- **Alternatives considered**: (a) layanan orkestrasi terpisah (ditolak — duplikasi otorisasi/perimeter baru, perubahan stack); (b) orkestrasi di frontend dengan kunci provider di browser (ditolak fatal — API key terekspos publik, melanggar FR-10 & Security III; juga tidak bisa menegakkan otorisasi server-side).

## R-2 — Bentuk integrasi provider model organisasi

- **Decision**: gateway memakai endpoint **OpenAI-compatible** (`POST {base}/chat/completions`) dengan dukungan **tool calling**, dikonsumsi via `net/http` + `encoding/json` stdlib. Konfigurasi env: `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_API_KEY`, `AI_PROVIDER_MODEL`, `AI_MAX_OUTPUT_TOKENS` (default 800), `AI_REQUEST_TIMEOUT` (default 25s).
- **Rationale**: NC-04 = "provider milik sendiri, tinggal tempel API key". API OpenAI-compatible adalah konvensi de-facto penyaji model self-hosted (vLLM, Ollama, TGI, LiteLLM, dan sebagian besar gateway korporat), sehingga "tempel API key + base URL" realistis tanpa mengikat vendor. Interface `domain.LLMGateway` (satu metode `Complete(ctx, request) (response, error)`) membuat endpoint/ganti model tidak menyentuh usecase.
- **Asumsi yang dideklarasikan (diverifikasi di K3, bukan unknown desain)**: endpoint organisasi mendukung `tools`/`tool_calls`. Verifikasi satu `curl` tercantum di `quickstart.md`. Bila ternyata tidak didukung, dampaknya terbatas pada lapisan gateway dan keputusan dikembalikan ke pemilik (Open Item 2 plan) — kontingensi tidak dibangun spekulatif (Technical I).
- **Alternatives considered**: SDK pihak ketiga Go (ditolak — dependensi baru untuk panggilan HTTP sederhana, melanggar Technical V; stdlib cukup); provider API komersial (ditolak — bertentangan dengan NC-04).
- **Catatan konfigurasi (deviasi kecil yang disengaja dari Prinsip IX)**: bila `AI_PROVIDER_*` belum diset, proses API **tetap berjalan** dan seluruh operasi chat mengembalikan kegagalan eksplisit ("asisten belum dikonfigurasi") — fitur aditif tidak boleh mematikan layanan existing saat rollout; kegagalan tetap visible & jujur per permintaan (FR-11).

## R-3 — Mekanisme grounding jawaban

- **Decision**: **tool-calling loop dengan toolset tertutup** (6 tool read-only) yang mengadaptasi usecase existing; model menyusun jawaban hanya dari hasil tool; maksimum 5 putaran tool per jawaban; template penutup wajib mencantumkan sumber & waktu data (FR-05).
- **Rationale**: FR-04 melarang angka karangan dan FR-06 mewajibkan otorisasi identik penanya — keduanya hanya dapat dijamin arsitektural bila satu-satunya jalur data ke model adalah tool yang ber-otorisasi. Toolset dipetakan 1:1 ke kemampuan usecase yang sudah ada dan teruji:
  | Tool | Mengadaptasi | Menutup |
  | --- | --- | --- |
  | `ringkas_data` | komposisi `EmployeeService.List` + `ContractService.Expiring/NeedingFollowUp` (identitas penanya) | US2 (ringkasan) |
  | `cari_karyawan` | `EmployeeService.List(filter, page kecil)` | US3 (pencarian) |
  | `detail_karyawan` | `EmployeeService.Get` | US3 (detail & tindak lanjut percakapan) |
  | `kontrak_segera_berakhir` | `ContractService.Expiring(days)` | US3, contoh FR-40 |
  | `karyawan_perlu_tindak_lanjut` | `ContractService.NeedingFollowUp` | US3/US5 |
  | `karyawan_data_belum_lengkap` | pembacaan baru kecil (NULL-check field opsional; lihat data-model) | contoh pendorong spec ("data dirinya belum lengkap"), US5 |
- **Alternatives considered**: text-to-SQL (ditolak — melanggar FR-06: jalur data baru di luar matriks, risiko injeksi); stuffing snapshot data mentah ke prompt (ditolak — minimisasi & skala; angka mudah basi); fine-tuning per organisasi (ditolak — luar MVP, biaya & kompleksitas).

## R-4 — Model otorisasi & privasi percakapan

- **Decision**: seluruh operasi chat memakai `RequireRole(identity, RoleChapter, RoleOperation)` pada pintu usecase (FR-01 — Admin/Talent ditolak pada MVP); kepemilikan percakapan diegakkan di repository (`WHERE user_id = pemanggil`) + usecase; percakapan orang lain → `ErrNotFound` (anti-enumerasi, pola `internal/usecase/scope.go`); **tidak ada pengecualian untuk Admin** (FR-02 eksplisit). Matriks RBAC `002-tania-rbac` **tidak diamandemen**: asisten bukan permukaan data baru, melainkan konsumen kueri ber-hak-akses yang sudah diratifikasi.
- **Rationale**: konsisten dengan keputusan `/speckit.analyze` TAN-203 (baris "Data karyawan & kontrak kerja" berlaku; US4 chapter-as-data; penegakan sisi server). Frontend guard (`useSessionRole`) hanya kenyamanan, bukan batas keamanan.
- **Alternatives considered**: mengecualikan Admin dari larangan baca (ditolak — melanggar FR-02 verbatim); endpoint chat terpisah tanpa JWT (ditolak — memecah model auth existing).

## R-5 — Penyamaran NIK & proyeksi field aman

- **Decision**: tool DTO hanya memuat field aman yang setara tampilan modul (`nikMasked`, nama, unit/jobRole/chapter, status, tanggal kontrak, dsb.); NIK terenkripsi **tidak pernah keluar** dari lapisan domain; tidak ada tool "unmask". DTO didefinisikan sekali di `usecase/chat_tools.go`.
- **Rationale**: FR-07 + FR-42 induk ("tidak ada jalur asisten yang menampilkan nilai penuh") dipenuhi secara struktural, bukan oleh kepatuhan prompt (prompt bisa di-inject; DTO tidak). Sekaligus memenuhi Security II (minimisasi): model hanya menerima field yang dibutuhkan untuk menjawab.
- **Alternatives considered**: menyaring di prompt/system message (ditolak — bukan batas keamanan); menyaring output model dengan regex NIK (ditolak — rapuh; sumber data harus sudah bersih).

## R-6 — Persistensi percakapan & kepatuhan data pribadi

- **Decision**: dua tabel baru `chat_conversations` & `chat_messages` (migrasi `0013`), query selalu ter-ownership; retensi diusulkan **90 hari** lalu hapus permanen via job scheduled (pola `runRetentionJob` di `cmd/api/main.go`); konten pertanyaan dikirim ke provider organisasi dengan dasar pemrosesan "kepentingan sah — pelaksanaan fungsi kepegawaian internal", terekam di data-model; log modul chat tanpa isi pesan (hanya ID teknis & token).
- **Rationale**: spec mewajibkan deklarasi retensi, dasar pemrosesan, dan larangan data pribadi pada log di fase plan (Key Entities; konstitusi Prinsip I–IV). Provider di dalam perimeter organisasi (NC-04) menekan eksposur. Angka 90 hari = proposal privacy-minimizing yang **perlu persetujuan pemilik** (Open Item 1) — plan tidak menganggapnya disetujui.
- **Alternatives considered**: retensi tanpa batas (ditolak — melanggar Prinsip IV); anonimisasi alih-alih hapus (ditolak untuk MVP — isi percakapan tanpa identitas pengguna kehilangan nilai konteks riwayat; hapus lebih sederhana & lebih aman).

## R-7 — Sinkron vs streaming

- **Decision**: jawaban **sinkron** (mutation mengembalikan balasan final); laten dibatasi timeout + putaran tool + batas token (D5 plan). Streaming/SSE/subscriptions tidak dibangun pada MVP.
- **Rationale**: skema backend saat ini tidak punya subscription (audit `graph/schema.graphqls`); menambahkannya = permukaan infrastruktur baru (gqlgen websocket, klien Apollo subscription) di luar kebutuhan fungsi MVP — melanggar kendala pemilik produk & Technical I. SC-001 (<30 detik) tercapai dengan batas laten; keputusan streaming dapat ditinjau setelah UAT.
- **Alternatives considered**: subscription GraphQL (ditunda — fase lanjutan bila UAT menuntut); polling berkala klien (ditolak — boros & lebih rumit daripada satu mutation sinkron).

## R-8 — Frontend: keterlibatan dependensi & penempatan UI

- **Decision**: satu fitur baru `src/features/assistant/` (panel + bubble + chips + dokumen GraphQL), dipasang di `src/app/(app)/layout.tsx` sekali untuk seluruh app shell dengan guard `useSessionRole ∈ {CHAPTER, OPERATION}`; renderer format jawaban ditulis sendiri (bold/daftar/baris baru, ±50 baris + test); **tanpa `pnpm install` baru**.
- **Rationale**: FR-01 menuntut akses dari dashboard & bubble dari halaman lain — shell-level adalah satu-satunya titik pemasangan tunggal. Design constitution 4.3.0 menetapkan **aksen merah brand untuk "AI actions"** — tombol buka asisten memakai `--tp-brand-red` peran yang sudah diratifikasi (bukan warna baru). `react-markdown` untuk satu kebutuhan bold/daftar melanggar Technical V (R-3 plan D7).
- **Alternatives considered**: halaman `/assistant` terpisah (ditolak — bertentangan dengan FR-01 "tertanam"); markdown parser penuh (ditolak — dependensi untuk kebutuhan kecil).

## R-9 — Konfigurasi guardrail biaya

- **Decision**: nilai yang **tetap oleh spec** di-hard-code sebagai konstanta terdokumentasi: jendela konteks 12 pesan, panjang pesan 2.000 karakter; nilai yang **boleh disetel lingkungan** dari env: model (`AI_PROVIDER_MODEL`), batas token keluaran, timeout. Pemakaian token per pesan tersimpan (`input_tokens`, `output_tokens`); laporan biaya berkala dibaca langsung dari tabel (agregasi SQL), tanpa API laporan baru.
- **Rationale**: FR-10 menyatakan kenaikan batas mana pun butuh persetujuan pemilik — justru karena itu dua nilai kunci dibuat **bukan konfigurasi** (mengubahnya = perubahan kode yang direview, bukan flip env diam-diam). Pencatatan token memenuhi US6 tanpa membangun dashboard biaya yang tidak diminta spec.
- **Alternatives considered**: semua nilai dari env (ditolak — memungkinkan kenaikan batas tanpa jejak persetujuan); API laporan biaya (ditolak — tidak ada FR untuk itu).

## R-10 — Strategi pengujian

- **Decision**: backend memakai fakes `domain.LLMGateway` (respons deterministik, skenario tool-loop, kegagalan, timeout) + fakes repository; baris matriks baru di `authz_test.go`; skenario privasi di `security_test.go`; alur penuh di `httpapi/e2e_test.go`. Frontend memakai `MockedProvider` (pola `master-data.test.tsx`/`dashboard.test.tsx`). UAT manual mengikuti `quickstart.md` termasuk probe keamanan (dua Chapter lintas cakupan, prompt-injection, provider mati, Admin ditolak).
- **Rationale**: Technical III; konsistensi dengan harness existing membuat test baru murah dan deterministik (tanpa panggilan provider nyata di CI).
- **Alternatives considered**: test terhadap provider live di CI (ditolak — tidak deterministik & butuh kredensial; verifikasi provider cukup sekali manual di K3).
