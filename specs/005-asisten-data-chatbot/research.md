# Phase 0 — Research: Asisten Data & Rekomendasi (Chatbot) untuk Chapter dan Operation

**Feature**: `005-asisten-data-chatbot` (TAN-203, plan untuk TAN-204) · **Date**: 2026-10-14

Audit 2026-10-14 atas `tania-dashboard` (branch `agent/cobra/da79d8b05e16` @ `a7d3bc6`) dan `tania-backend`. Kendala dari pemilik produk (TAN-204): **tech stack existing tidak berubah; tambahkan seperlunya sesuai spec; jika tidak ada yang perlu, jangan tambahkan apapun.** Seluruh butir teknis di bawah diselesaikan sebelum desain; tidak ada `NEEDS CLARIFICATION` tersisa (butir yang butuh keputusan pemilik produk dicatat sebagai Open Items di `plan.md`, bukan unknown teknis).

## R-1 — Di mana orkestrasi AI ditempatkan? (NC-04, diserahkan ke fase ini)

- **Decision**: **Di dalam `tania-backend`** sebagai modul clean-architecture baru (`domain/chat.go` → `usecase/chat.go` + `usecase/chat_tools.go` → `repository/postgres/chat.go` + `platform/llm/openai.go`), bukan layanan terpisah.
- **Rationale**: mekanisme grounding wajib menjalankan kueri data **dengan identitas penanya** melalui usecase yang sama dengan aplikasi (FR-06). Di dalam proses yang sama, tool cukup memanggil `EmployeeService`/`ContractService` — otorisasi, cakupan chapter-as-data, dan penyamaran NIK **diwarisi**, bukan ditulis ulang. Layanan terpisah berarti: jalur otorisasi baru (duplikasi matriks RBAC atau trust boundary internal baru), deployment & observability baru, dan perubahan rajah stack — bertentangan dengan kendala pemilik produk dan Prinsip Technical I & Security III. Pola internal yang membuktikan kelayakan: `EntraService` (usecase + client `platform/entra` di dalam proses) dan `RetentionService` (job terjadwal in-process).
- **Alternatives considered**: (a) layanan orkestrasi terpisah (ditolak — duplikasi otorisasi/perimeter baru, perubahan stack); (b) orkestrasi di frontend dengan kunci provider di browser (ditolak fatal — API key terekspos publik, melanggar FR-10 & Security III; juga tidak bisa menegakkan otorisasi server-side).

## R-2 — Bentuk integrasi provider model organisasi

- **Decision**: gateway memakai endpoint **OpenAI-compatible** (`POST {base}/chat/completions`) dengan dukungan **tool calling**, dikonsumsi via `net/http` + `encoding/json` stdlib. Konfigurasi env **hanya koneksi & model**: `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_API_KEY`, `AI_PROVIDER_MODEL` (batas token keluaran & timeout adalah konstanta, bukan env — lihat R-9). **Konfirmasi pemilik (2026-10-14, clarify TAN-204)**: provider **OpenAI-like**; kredensial akan **dipasang sendiri oleh pemilik** ke env/secret store, lalu model yang tersedia dienumerasi lewat `GET {base}/models` dan `AI_PROVIDER_MODEL` dipilih dari daftar itu.
- **Rationale**: NC-04 = "provider milik sendiri, tinggal tempel API key". API OpenAI-compatible adalah konvensi de-facto penyaji model self-hosted (vLLM, Ollama, TGI, LiteLLM, dan sebagian besar gateway korporat), sehingga "tempel API key + base URL" realistis tanpa mengikat vendor. Interface `domain.LLMGateway` (satu metode `Complete(ctx, request) (response, error)`) membuat endpoint/ganti model tidak menyentuh usecase.
- **Asumsi yang dideklarasikan (diverifikasi pada prasyarat K0, bukan unknown desain)**: endpoint organisasi mendukung `tools`/`tool_calls`. Dua langkah verifikasi tercantum di `quickstart.md` §A — enumerasi model (`GET {base}/models`) dan satu probe tool calling. Verifikasi dijalankan **sebelum K1** (keputusan pemilik 2026-10-14), karena bila tool calling tidak didukung, bentuk grounding dan estimasi ikut berubah — bukan sekadar lapisan gateway. Bila tidak didukung, keputusan dikembalikan ke pemilik (Open Item 2 plan) — kontingensi tidak dibangun spekulatif (Technical I).
- **Alternatives considered**: SDK pihak ketiga Go (ditolak — dependensi baru untuk panggilan HTTP sederhana, melanggar Technical V; stdlib cukup); provider API komersial (ditolak — bertentangan dengan NC-04).
- **Catatan konfigurasi (mengikuti preseden yang sudah diratifikasi, bukan deviasi baru)**: bila `AI_PROVIDER_*` belum diset, proses API **tetap berjalan** dan seluruh operasi chat mengembalikan kegagalan eksplisit ("asisten belum dikonfigurasi") — persis pola `EntraConfig.Enabled()` (`internal/config/config.go`) untuk fitur aditif yang bergantung kredensial; kegagalan tetap visible & jujur per permintaan (FR-11).

## R-3 — Mekanisme grounding jawaban

- **Decision**: **tool-calling loop dengan toolset tertutup** (6 tool read-only) yang mengadaptasi usecase existing; model menyusun jawaban hanya dari hasil tool; maksimum 5 putaran tool per jawaban; template penutup wajib mencantumkan sumber & waktu data (FR-05).
- **Rationale**: FR-04 melarang angka karangan dan FR-06 mewajibkan otorisasi identik penanya — keduanya hanya dapat dijamin arsitektural bila satu-satunya jalur data ke model adalah tool yang ber-otorisasi. **Koreksi review 2026-10-14**: pemetaan 1:1 ke usecase existing hanya aman untuk baca *single-record*; baca *daftar* (`EmployeeService.List`) = Admin+Operation dan seluruh baca kontrak = Operation, sehingga tool yang memakainya akan menolak persona Chapter. Kolom **Sumber data** di bawah sudah mencerminkan perbaikan itu (baca ber-cakupan chapter — lihat **R-11**).
  | Tool | Sumber data (dengan identitas penanya) | Gate efektif | Menutup |
  | --- | --- | --- | --- |
  | `ringkas_data` | angka dashboard existing (`DashboardService.For`) + agregat kontrak ber-cakupan | Chapter, Operation | US2 (ringkasan) |
  | `cari_karyawan` | daftar/pencarian karyawan **ber-cakupan** (reuse `EmployeeRepository.Search` + `scopeChapterID`) | Chapter, Operation | US3 (pencarian) |
  | `detail_karyawan` | `EmployeeService.Get` (sudah ber-cakupan) | Chapter, Operation | US3 (detail & tindak lanjut percakapan) |
  | `kontrak_segera_berakhir` | kontrak ber-cakupan (`ScopeChapterID` pada `domain.ContractFilter`) | Chapter, Operation | US3, contoh FR-40 |
  | `karyawan_perlu_tindak_lanjut` | `EmployeesNeedingFollowUp` + parameter scope | Chapter, Operation | US3/US5 |
  | `karyawan_data_belum_lengkap` | baca baru ber-cakupan (NULL-check field opsional; lihat data-model) | Chapter, Operation | contoh pendorong spec ("data dirinya belum lengkap"), US5 |
- **Alternatives considered**: text-to-SQL (ditolak — melanggar FR-06: jalur data baru di luar matriks, risiko injeksi); stuffing snapshot data mentah ke prompt (ditolak — minimisasi & skala; angka mudah basi); fine-tuning per organisasi (ditolak — luar MVP, biaya & kompleksitas).

## R-4 — Model otorisasi & privasi percakapan

- **Decision**: seluruh operasi chat memakai `RequireRole(identity, RoleChapter, RoleOperation)` pada pintu usecase (FR-01 — Admin/Talent ditolak pada MVP); kepemilikan percakapan diegakkan di repository (`WHERE user_id = pemanggil`) + usecase; percakapan orang lain → `ErrNotFound` (anti-enumerasi, pola `internal/usecase/scope.go`); **tidak ada pengecualian untuk Admin** (FR-02 eksplisit). Matriks RBAC `002-tania-rbac` **tidak diamandemen**: asisten bukan permukaan data baru, melainkan konsumen kueri ber-hak-akses yang sudah diratifikasi.
- **Rationale**: konsisten dengan keputusan `/speckit.analyze` TAN-203 (baris "Data karyawan & kontrak kerja" berlaku; US4 chapter-as-data; penegakan sisi server). Frontend guard (`useSessionRole`) hanya kenyamanan, bukan batas keamanan. **Koreksi review 2026-10-14**: matriks memang tidak perlu diamandemen, tetapi implementasinya belum menyediakan baca *daftar* ber-cakupan chapter — tanpa baca itu, klaim "otorisasi diwarisi" gugur untuk Chapter (lihat **R-11**).
- **Alternatives considered**: mengecualikan Admin dari larangan baca (ditolak — melanggar FR-02 verbatim); endpoint chat terpisah tanpa JWT (ditolak — memecah model auth existing).

## R-5 — Penyamaran NIK & proyeksi field aman

- **Decision**: tool DTO hanya memuat field aman yang setara tampilan modul (`nikMasked`, nama, unit/jobRole/chapter, status, tanggal kontrak, dsb.); NIK terenkripsi **tidak pernah keluar** dari lapisan domain; tidak ada tool "unmask". DTO didefinisikan sekali di `usecase/chat_tools.go`.
- **Rationale**: FR-07 + FR-42 induk ("tidak ada jalur asisten yang menampilkan nilai penuh") dipenuhi secara struktural, bukan oleh kepatuhan prompt (prompt bisa di-inject; DTO tidak). Sekaligus memenuhi Security II (minimisasi): model hanya menerima field yang dibutuhkan untuk menjawab.
- **Alternatives considered**: menyaring di prompt/system message (ditolak — bukan batas keamanan); menyaring output model dengan regex NIK (ditolak — rapuh; sumber data harus sudah bersih).

## R-6 — Persistensi percakapan & kepatuhan data pribadi

- **Decision**: dua tabel baru `chat_conversations` & `chat_messages` (migrasi `0013`), query selalu ter-ownership; retensi **90 hari lalu hapus permanen** — **disetujui pemilik produk 2026-10-14** — via job scheduled (pola `runRetentionJob` di `cmd/api/main.go`, aksi hard delete berbeda dari anonimisasi retensi karyawan); konten pertanyaan dikirim ke provider organisasi dengan dasar pemrosesan "kepentingan sah — pelaksanaan fungsi kepegawaian internal", terekam di data-model; log modul chat tanpa isi pesan (hanya ID teknis & token).
- **Rationale**: spec mewajibkan deklarasi retensi, dasar pemrosesan, dan larangan data pribadi pada log di fase plan (Key Entities; konstitusi Prinsip I–IV). Provider di dalam perimeter organisasi (NC-04) menekan eksposur. Angka 90 hari = proposal privacy-minimizing; **disetujui pemilik produk pada clarify TAN-204 (2026-10-14)** sehingga Open Item 1 plan ditutup.
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

- **Decision**: **semua batas guardrail adalah konstanta kode** dengan nilai yang disetujui pemilik produk (2026-10-14): jendela konteks 12 pesan, panjang pesan 2.000 karakter, token keluaran 800, timeout permintaan 25 s, rate limit 20 pesan/jam/user. Dari env hanya koneksi & model (`AI_PROVIDER_BASE_URL`, `AI_PROVIDER_API_KEY`, `AI_PROVIDER_MODEL`) — model bukan batas. Pemakaian token per pesan tersimpan (`input_tokens`, `output_tokens`); laporan biaya bulanan dibaca langsung dari tabel (agregasi SQL), tanpa API laporan baru.
- **Rationale**: FR-10 menyatakan kenaikan batas mana pun butuh persetujuan pemilik — karena itu tidak satu pun batas boleh dapat diubah lewat env (yang bisa di-flip diam-diam tanpa jejak review); mengubahnya = perubahan kode yang direview. Versi awal plan menaruh batas token keluaran & timeout di env; pada `/speckit.clarify` teknis (TAN-204) ini dikoreksi menjadi konstanta agar FR-10 benar-benar ditegakkan. Pencatatan token memenuhi US6 tanpa membangun dashboard biaya yang tidak diminta spec.
- **Alternatives considered**: batas token/timeout dari env (ditolak — celah kenaikan batas tanpa persetujuan); API laporan biaya (ditolak — tidak ada FR untuk itu); rate limit di level gateway/ingress (ditolak — `RateLimiter.Allow` Redis existing sudah dipakai login, jadi nol infrastruktur baru).

## R-10 — Strategi pengujian

- **Decision**: backend memakai fakes `domain.LLMGateway` (respons deterministik, skenario tool-loop, kegagalan, timeout) + fakes repository; baris matriks baru di `authz_test.go` **plus baris per baca ber-cakupan R-11** (Chapter dalam cakupan ✓ / luar cakupan ✗ `ErrNotFound`); skenario privasi di `internal/transport/httpapi/security_test.go`; alur penuh (termasuk **retry idempoten**) di `httpapi/e2e_test.go`. Frontend memakai `MockedProvider` (pola `master-data.test.tsx`/`dashboard.test.tsx`). UAT manual mengikuti `quickstart.md` termasuk probe keamanan (dua Chapter lintas cakupan, prompt-injection, provider mati, Admin ditolak).
- **Rationale**: Technical III; konsistensi dengan harness existing membuat test baru murah dan deterministik (tanpa panggilan provider nyata di CI).
- **Alternatives considered**: test terhadap provider live di CI (ditolak — tidak deterministik & butuh kredensial; verifikasi provider cukup sekali manual pada prasyarat K0).

## R-11 — Baca ber-cakupan chapter untuk tool asisten (koreksi review 2026-10-14)

- **Decision**: tambahkan **tiga baca ber-cakupan** di lapisan usecase (gate `RequireRole(Chapter, Operation)`), **tanpa** query/mutation GraphQL baru: (1) daftar/pencarian karyawan ber-cakupan — reuse `EmployeeRepository.Search(ctx, filter, scopeChapterID *string, page)` yang sudah ada (scope `nil` untuk Operation); (2) karyawan perlu tindak lanjut ber-cakupan — `EmployeesNeedingFollowUp` + parameter scope (`jr.chapter_id`); (3) kontrak segera berakhir ber-cakupan — `ScopeChapterID *string` pada `domain.ContractFilter` + clause `jr.chapter_id` (baris kontrak menyimpan `job_role_id`; `contractSelect` sudah join job role/chapter). Kelengkapan data diri memakai pola (1).
- **Rationale**: review arsitektur menemukan klaim R-3/R-4 ("otorisasi diwarisi by construction") hanya benar untuk `EmployeeService.Get`. Fakta kode: `EmployeeService.List` = Admin+Operation; `ContractService.List/Get/Expiring/NeedingFollowUp` = Operation dan tanpa scope chapter; `Employee.contracts` (resolver) memakai `ContractService.List` → Chapter juga ditolak; `ChapterDashboard` tidak memuat angka karyawan/kontrak. Akibatnya 5 dari 6 tool gagal FORBIDDEN untuk Chapter — padahal Chapter persona MVP (US2 AC1, US4 AC1, US5, probe D1/D2 quickstart).
- **Batas yang dijaga**: baca ini **internal** (usecase/repository), tidak diekspos ke GraphQL — bila diekspos, Chapter akan memperoleh permukaan `employmentContracts`/`expiringContracts` milik Operation dan itu amandemen matriks RBAC. `ScopeChapterID` hanya diisi server dari identitas pemanggil; resolver `employmentContracts(filter:)` tidak memetakan nilai dari klien ke field itu.
- **Alternatives considered**: (a) melonggarkan gate `ContractService.List` menjadi Chapter+Operation (ditolak — mengubah otorisasi endpoint existing = amandemen matriks & membuka permukaan Operation-wide); (b) hanya memakai `AssignableTalents` + `Get` tanpa baca baru (ditolak — `AssignableTalents` hanya karyawan assignable, tidak bisa menjawab ringkasan kontrak US2/US5).
