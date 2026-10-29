# Contract — Asisten Data (Chat) — GraphQL & Toolset

**Feature**: `005-asisten-data-chatbot` (TAN-203 · plan TAN-204) · **Date**: 2026-10-14

Kontrak **baru** yang ditambahkan plan ini ke `tania-backend/graph/schema.graphqls` (satu sumber kebenaran API; frontend codegen ditargetkan ke sini; fragment kontrak desain fitur didokumentasikan di bawah). Tidak ada tipe/query/mutation existing yang diubah.

## Tipe GraphQL (baru)

```graphql
enum ChatMessageRole { USER ASSISTANT }

type ChatConversation {
  id: ID!
  """Waktu percakapan dimulai."""
  startedAt: Time!
  """Waktu pesan terakhir — dasar urutan daftar percakapan."""
  lastMessageAt: Time!
  """Jumlah pesan dalam percakapan."""
  messageCount: Int!
  """Pesan percakapan, terbaru lebih dulu. Hanya milik pemanggil."""
  messages(first: Int = 50, after: String): ChatMessageConnection!
}

type ChatMessage {
  id: ID!
  role: ChatMessageRole!
  """Isi pesan. USER ≤ 2.000 karakter; ASSISTANT dihasilkan asisten (Bahasa Indonesia)."""
  content: String!
  """Pemakaian token sisi input — laporan biaya (FR-10); null untuk pesan USER."""
  inputTokens: Int
  """Pemakaian token sisi keluaran — laporan biaya (FR-10); null untuk pesan USER."""
  outputTokens: Int
  """ID kiriman klien (hanya pesan USER) — dipakai UI untuk mengulang kiriman yang gagal
     secara idempoten, termasuk setelah panel dimuat ulang."""
  clientRequestId: ID
  createdAt: Time!
}

# `sources` (jsonb: tool/params/rowCount/fetchedAt — data-model) TIDAK diekspos ke GraphQL:
# rujukan sumber ditampilkan dari teks jawaban (FR-05), jadi tidak ada permukaan baru bagi klien.
# **Revisi 2026-10-29 (TAN-369)**: baris rujukan itu disusun **server** dari `sources` yang tersimpan
# (`Sumber: <tool>, data per <fetchedAt> (<n> baris).`) dan ditambahkan pada `content` jawaban asisten,
# bukan diketik model — sitasi tidak lagi bergantung pada kepatuhan model dan tidak ikut diperiksa guardrail.

type ChatMessageEdge { node: ChatMessage!, cursor: String! }
type ChatMessageConnection { edges: [ChatMessageEdge!]!, pageInfo: PageInfo!, totalCount: Int! }
type ChatConversationEdge { node: ChatConversation!, cursor: String! }
type ChatConversationConnection { edges: [ChatConversationEdge!]!, pageInfo: PageInfo!, totalCount: Int! }
```

## Query (baru)

```graphql
type Query {
  """Percakapan asisten milik pemanggil (privat mutlak; FR-02)."""
  chatConversations(first: Int = 20, after: String): ChatConversationConnection!
  """Pesan satu percakapan milik pemanggil; percakapan orang lain → NOT_FOUND (anti-enumerasi)."""
  chatMessages(conversationId: ID!, first: Int = 50, after: String): ChatMessageConnection!
}
```

## Mutation (baru)

```graphql
type Mutation {
  """Mulai percakapan baru milik pemanggil."""
  createChatConversation: ChatConversation!
  """Kirim pesan user; sinkron; mengembalikan PESAN ASISTEN hasil grounding.
     Pesan USER tersimpan sebelum pemanggilan model; kirim ulang dengan
     clientRequestId yang sama bersifat idempoten (tidak menggandakan pesan)."""
  sendChatMessage(conversationId: ID!, content: String!, clientRequestId: ID!): ChatMessage!
}
```

### Idempotensi kirim (FR-14)

Tanpa ini, satu kegagalan provider + satu retry menghasilkan **dua pesan USER identik** di riwayat (dan di jendela konteks — `plan.md` D6). Kontraknya:

- Klien membuat `clientRequestId` (UUID) **sekali per kiriman user** dan memakai id yang sama saat "coba ulang" (bukan id baru per percobaan).
- Server: bila di percakapan itu **sudah ada** pesan USER dengan `clientRequestId` sama → pesan itu **dipakai ulang** (tidak insert baru), lalu pemrosesan jawaban dijalankan; bila belum ada → insert pesan USER baru, lalu proses. Unik parsial `(conversation_id, client_request_id)` menjaga ini di level DB.
- Efek yang diharapkan: retry tidak menambah pesan, tidak menggeser jendela konteks, dan tidak menambah biaya context; `clientRequestId` yang sama di percakapan lain = pesan yang berbeda (unik per percakapan).
- **Retry setelah panel dimuat ulang**: `ChatMessage.clientRequestId` diekspos ke klien, jadi pesan USER gagal (tersimpan tanpa balasan) tetap dapat diulang idempoten setelah reload — bukan hanya selama sesi berjalan. Bila klien tidak mengirim id (kiriman lama tanpa id), UI memperlakukannya sebagai pertanyaan baru biasa.

## Otorisasi (FR-01/FR-02/FR-06)

- **Seluruh operasi chat**: sel katalog `assistant` (`permAssistant`) — `ChatService.authorize` memanggil `RequirePermission(..., permAssistant)`, default `READ` untuk Chapter & Operation dan `NONE` untuk peran lain, sehingga **Admin & Talent ditolak pada MVP** (NC-03; FR-01). Dulu ditulis `RequireRole(identity, RoleChapter, RoleOperation)`; gelombang RBAC 002 (TAN-344) menggantinya dan keputusan pemilik pada TAN-369 menetapkan sel itu sebagai satu-satunya sumber ketersediaan — bubble, panel, dan server mengikuti sel yang sama.
- **Kepemilikan**: setiap baca/tulis percakapan difilter `WHERE user_id = pemanggil`; percakapan orang lain (termasuk milik Admin dibaca Chapter, dsb.) → `NOT_FOUND`, bukan `FORBIDDEN` (anti-enumerasi, pola `internal/usecase/scope.go`). **Tanpa pengecualian Admin** (FR-02 verbatim).
- **Kueri data oleh asisten**: tool memanggil usecase domain dengan `domain.Identity` penanya. Baca *single-record* ber-cakupan diwarisi apa adanya (`EmployeeService.Get`); baca *daftar* ber-cakupan chapter **ditambahkan** di lapisan usecase (gate sel katalog `assistant`) karena baca daftar existing yang dipakai tool (daftar karyawan, `ContractService.Expiring`) bersifat Operation/Admin-only — **005 tidak menambah permukaan GraphQL baru**, jadi 005 sendiri tidak mengamandemen matriks RBAC. Sel `assistant` **tidak** menambah hak data: peran yang selnya dibukakan tetap hanya menerima data yang boleh dibacanya (tool `ringkas_data` menolak `FORBIDDEN` bila peran itu tidak punya akses dashboard, dan jawabannya jujur per FR-11). UI guard (`CHAPTER/OPERATION`) hanya kenyamanan.
- Read-only: tidak ada tool/mutasi tulis data bisnis (FR-08). Satu-satunya penulisan adalah percakapan milik pemanggil.

## Kontrak error

| Kondisi | Perilaku server | Perilaku UI |
| --- | --- | --- |
| Peran Admin/Talent memanggil operasi chat | `FORBIDDEN` | Panel/bubble tidak dirender; akses langsung tetap ditolak server |
| `content` kosong / > 2.000 karakter (batas UI — `plan.md` D6) | Ditolak **sebelum** pemanggilan model (tidak memicu pemakaian token) | `maxLength` input + pesan "Maksimal 2.000 karakter."; tidak ada bubble baru |
| `conversationId` bukan milik pemanggil / tidak ada | `NOT_FOUND` | Toast error; panel tetap pada daftar percakapan miliknya |
| `AI_PROVIDER_*` belum dikonfigurasi | Kegagalan eksplisit "asisten belum dikonfigurasi" (`CHAT_NOT_CONFIGURED`) | Pesan gagal ramah di thread (FR-11) |
| Provider model gagal/timeout/anggaran jawaban habis | Pesan USER tetap tersimpan; idempoten lewat `clientRequestId`; tidak ada pesan ASSISTANT tersusun; error eksplisit "asisten gagal menjawab, coba lagi" (`CHAT_FAILED`; anggaran satu jawaban — `plan.md` D6/R2). **TAN-325**: setiap kegagalan membawa `extensions.reason` (kode stabil kategori kegagalan) dan kalimat yang menjelaskan *mengapa*: `PROVIDER_ERROR` (layanan model gagal/tidak dapat dihubungi), `TIMEOUT` (anggaran waktu jawaban habis), `EMPTY_RESPONSE` (model tidak mengembalikan apapun), `UNGROUNDED_ANSWER` (jawaban berisi klaim di luar hasil tool putaran ini, FR-04), `DATA_NOT_FETCHED` (model tidak memanggil tool sama sekali sehingga tidak ada data yang bisa dirujuk — pengguna diminta mengirim ulang, bukan disalahkan; TAN-369), `TOOL_ROUNDS_EXHAUSTED` (loop tool menghabiskan batas putaran). Detail teknis yang aman (mis. kode status provider, jumlah klaim ditolak) disertakan dalam pesan; tidak ada nama/NIK/isi pesan yang bocor (Keamanan III). | Bubble gagal + tombol coba ulang yang mengirim ulang `clientRequestId` **sama** → tidak ada pesan user ganda; toast menampilkan pesan server apa adanya (termasuk kode reason) |
| `clientRequestId` hilang/bukan UUID | Ditolak sebelum menyentuh model | — |
| Kuota per user terlampaui (**20 pesan/jam**, konstanta disetujui — `plan.md` D6) | Ditolak **sebelum** pemanggilan model — tidak ada token terpakai; kode `CHAT_RATE_LIMITED` + `extensions.retryAfterSeconds` (sisa jendela) | Pesan ramah "kuota asisten tercapai … Coba lagi dalam N menit." (pesan server ditampilkan apa adanya); tombol kirim nonaktif **dan** tombol "coba ulang" disembunyikan sampai jendela bergeser |
| **Seluruh hasil tool pada jawaban itu berisi 0 baris** — pada himpunan hasil tool yang **tidak kosong** (≥1 pemanggilan tool; FR-15, `plan.md` D10) | Jawaban **disusun server**, bukan oleh model: "Tidak ada data yang cocok dalam cakupan Anda." — tidak ada nama/angka dari luar hasil tool; pesan USER tetap tersimpan. **Prasyarat**: jawaban **tanpa** panggilan tool (sapaan, penolakan FR-12) tidak tersentuh baris ini (tetap kalimat model); tool yang **gagal** (tanpa `rowCount`) bukan hasil kosong dan mengikuti baris kegagalan provider (FR-11) | Ditampilkan sebagai jawaban biasa (bukan state gagal, tanpa tombol coba ulang) |
| Pertanyaan di luar domain Tania (FR-12) | Model diarahkan system prompt menolak sopan + menjelaskan cakupan | Ditampilkan sebagai jawaban biasa |

## Toolset data (read-only; diekspos ke model, bukan ke klien)

Semua tool berjalan dengan identitas penanya; hasil diproyeksikan ke DTO aman (NIK hanya `nikMasked`; tanpa field keamanan/akun; tanpa data domain di luar MVP — assignment/IDP/evaluasi/CV/master data/workload tidak diekspos pada MVP).

| Tool | Parameter | Sumber data (dengan identitas penanya) | Catatan |
| --- | --- | --- | --- |
| `ringkas_data` | — | angka dashboard existing (`DashboardService.For`) + agregat kontrak ber-cakupan | Snapshot agregat sesuai peran: jumlah karyawan aktif (cakupan), kontrak segera berakhir (≤90 hari), perlu tindak lanjut, distribusi per unit (Operation) — satu sumber angka untuk US2; angka yang sudah ada di dashboard diambil dari sana agar FR-29/FR-30 konsisten by construction |
| `cari_karyawan` | `search`, `unitId?`, `jobRoleId?`, `status?` | daftar/pencarian karyawan **ber-cakupan** (Chapter) / `EmployeeService.List` (Operation) | Hasil dibatasi (≤25 baris) + indikator ada-lagi |
| `detail_karyawan` | `employeeId` | `EmployeeService.Get` (sudah ber-cakupan) | `NOT_FOUND` untuk di luar cakupan (anti-enumerasi existing) |
| `kontrak_segera_berakhir` | `days?` (default 90, maks 180) | kontrak **ber-cakupan** (`ScopeChapterID`) untuk Chapter / `ContractService.Expiring` untuk Operation | Jendela FR-40 |
| `karyawan_perlu_tindak_lanjut` | — | `EmployeesNeedingFollowUp` + scope chapter untuk Chapter | Kontrak habis tanpa perpanjangan (US10 induk) |
| `karyawan_data_belum_lengkap` | — | baca baru ber-cakupan (NULL-check field opsional; lihat `data-model.md`) | Penambahan baca bersama dua lainnya |

**Batas yang dijaga (R-11)**: baca ber-cakupan chapter hidup di lapisan usecase/repository dan **tidak diekspos sebagai query/mutation GraphQL baru oleh 005**. `ScopeChapterID` hanya diisi server dari identitas pemanggil; resolver `employmentContracts(filter:)` tidak memetakan nilai dari klien ke field ini. Cakupan baca kontrak endpoint existing mengikuti matriks RBAC gelombang 002 (clarify 5): `ContractService.List`/`Get` Chapter-scoped (scope diisi server; di luar cakupan → `NOT_FOUND` lewat `CanAccessEmployee`, bukan `FORBIDDEN`), `ContractService.Expiring`/`NeedingFollowUp` tetap Operation/Admin-only, dan `ScopedExpiring`/`ScopedNeedingFollowUp` milik 005 tidak berubah — scope hanya diisi pada jalur tool asisten.

**Guardrail biaya (FR-10 — nilai disetujui pemilik 2026-10-14)**: seluruh batas adalah **konstanta kode, bukan env**, dan **nilainya satu sumber**: `plan.md` D6 (mesin: konstanta `tania-backend/internal/domain/chat.go`). Kontrak ini tidak mengulang daftar angkanya; nilai yang tampil pada tabel §Kontrak error (batas panjang pesan, kuota per jam, anggaran satu jawaban) menunjuk rujukan yang sama dan **tidak boleh berbeda nilai**. Kenaikan nilai mana pun = perubahan kode + persetujuan pemilik. Pemakaian token per pesan asisten tersimpan untuk laporan bulanan.

**Protokol loop** (diegakkan usecase, bukan harapan prompt): maksimum 5 putaran tool per jawaban; setiap hasil tool diberi label sumber + `fetchedAt`; jawaban final wajib berdasar hasil tool putaran ini, dan **baris sumber + waktu data disusun server** dari `sources` (FR-05, revisi 2026-10-29 TAN-369) sehingga tidak bergantung pada teks model; koreksi "ambil data dulu" dikirim **di dalam pertanyaan terakhir** (bukan sebagai pesan user kedua) agar tidak dibuang chat template; tool error → dilaporkan ke model sebagai kegagalan (jawaban jujur, bukan konjektur).

## System prompt (ringkasan kontrak perilaku)

- Bahasa Indonesia; identitas: asisten data Tania; cakupan: data karyawan & kontrak dalam hak akses penanya.
- Wajib berdasar pada hasil tool; melarang angka/nama di luar hasil tool; bila data tidak cukup → nyatakan jujur (FR-04, US5 skenario 3).
- Rekomendasi selalu: berdasar data yang dirujuk, berlabel eksplisit "rekomendasi/saran", mengarahkan ke modul terkait untuk aksi (FR-08/FR-09); bukan keputusan pejabat.
- Menolak sopan pertanyaan di luar cakupan (FR-12) dan permintaan menampilkan data tanpa hak akses (FR-06) — "Anda tidak memiliki akses…" bukan datanya (US4 skenario 2).
- Format keluaran: teks dengan bold `**…**` untuk angka penting, daftar sederhana, baris baru — subset yang didukung renderer frontend (R-8 research). Aturan sitasi yang berlaku sejak revisi 2026-10-29 (TAN-369): angka dan tanggal **disalin persis** dari hasil tool, sedangkan nama tool/waktu pengambilan **tidak** ditulis model (server yang menambahkan).

## Kontrak UI (panel & bubble)

- Panel asisten: akses dari dashboard + bubble melayang dari halaman lain; dirender mengikuti sel RBAC `assistant` (`useMenuEntryAccess("assistant")`) — sumber kebenaran yang sama dengan bubble dan server (T059).
- Daftar percakapan milik user + tombol "Percakapan baru"; memilih percakapan memuat riwayat (`chatMessages`).
- Chip pertanyaan contoh **per peran** (statis di frontend, dipetakan ke toolset yang benar-benar tersedia) — contoh Chapter & Operation berbeda sesuai cakupan.
- Input: `maxLength` 2.000 + penghitung; kirim dinonaktifkan saat menunggu balasan; state gagal ramah dengan coba ulang yang mengirim ulang `clientRequestId` yang sama (idempoten). `clientRequestId` dibuat di klien dengan `crypto.randomUUID()` — tanpa dependensi baru.
- **Bubble user dirender optimistis** dari input lokal saat dikirim (mutation gagal tidak mengembalikan apa pun, jadi bubble tidak boleh bergantung pada respons server); setelah riwayat dimuat ulang, pesan USER tanpa balasan ditandai "belum terjawab" dan menyediakan coba ulang memakai `clientRequestId`-nya.
- Seluruh teks UI Bahasa Indonesia; komponen memakai TANIA Pulse (`Card`, `Button`, `Input`, `DataState`, `Toast`); tombol buka asisten memakai peran aksen merah brand "AI actions" (`--tp-brand-red`).
- Aksesibilitas (design constitution §VI): panel & bubble sepenuhnya operable via keyboard — membuka panel memindahkan fokus ke input, `Escape` menutup panel kembali ke pemicunya, fokus selalu terlihat (token fokus `--tp-brand-red`), state memakai ARIA/teks bukan warna saja, dan animasi menghormati `prefers-reduced-motion`.
- Bentuk & responsif: panel = overlay di sisi kanan di atas app shell (bukan halaman terpisah — sesuai FR-01 "tertanam"); pada breakpoint lipat app shell ≤860px (Design §VIII) panel menjadi overlay selebar viewport. Renderer jawaban merender teks React (bold `**…**`, daftar, baris baru) — **tanpa raw HTML** dari keluaran model (keluaran model bukan teks tepercaya).

## Referensi

- SDL & resolver (setelah implementasi): `tania-backend/graph/schema.graphqls`, `graph/schema.resolvers.go`.
- Usecase & otorisasi: `internal/usecase/chat.go`, `internal/usecase/chat_tools.go`, `internal/usecase/authz_test.go`, `internal/usecase/scope.go`.
- Gateway: `internal/platform/llm/openai.go`; konfigurasi: `internal/config/config.go`.
- Usecase & baca ber-cakupan: `internal/usecase/employee.go`, `internal/usecase/contract.go`, `internal/usecase/dashboard.go`; perluasan filter internal `domain.ContractFilter.ScopeChapterID` di `internal/domain/contract.go`; repository `internal/repository/postgres/employee.go` (`Search` + `scopeChapterID`, `EmployeesNeedingFollowUp`) dan `internal/repository/postgres/contract.go`.
- Frontend: `src/features/assistant/`, codegen `src/generated/graphql/` (regenerasi wajib).
