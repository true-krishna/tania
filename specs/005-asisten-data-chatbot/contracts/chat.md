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

Tanpa ini, satu kegagalan provider + satu retry menghasilkan **dua pesan USER identik** di riwayat (dan di jendela konteks 12 pesan). Kontraknya:

- Klien membuat `clientRequestId` (UUID) **sekali per kiriman user** dan memakai id yang sama saat "coba ulang" (bukan id baru per percobaan).
- Server: bila di percakapan itu **sudah ada** pesan USER dengan `clientRequestId` sama → pesan itu **dipakai ulang** (tidak insert baru), lalu pemrosesan jawaban dijalankan; bila belum ada → insert pesan USER baru, lalu proses. Unik parsial `(conversation_id, client_request_id)` menjaga ini di level DB.
- Efek yang diharapkan: retry tidak menambah pesan, tidak menggeser jendela konteks, dan tidak menambah biaya context; `clientRequestId` yang sama di percakapan lain = pesan yang berbeda (unik per percakapan).
- **Retry setelah panel dimuat ulang**: `ChatMessage.clientRequestId` diekspos ke klien, jadi pesan USER gagal (tersimpan tanpa balasan) tetap dapat diulang idempoten setelah reload — bukan hanya selama sesi berjalan. Bila klien tidak mengirim id (kiriman lama tanpa id), UI memperlakukannya sebagai pertanyaan baru biasa.

## Otorisasi (FR-01/FR-02/FR-06)

- **Seluruh operasi chat**: `RequireRole(identity, RoleChapter, RoleOperation)` — **Admin & Talent ditolak pada MVP** (NC-03; FR-01: panel tidak tersedia bagi peran lain).
- **Kepemilikan**: setiap baca/tulis percakapan difilter `WHERE user_id = pemanggil`; percakapan orang lain (termasuk milik Admin dibaca Chapter, dsb.) → `NOT_FOUND`, bukan `FORBIDDEN` (anti-enumerasi, pola `internal/usecase/scope.go`). **Tanpa pengecualian Admin** (FR-02 verbatim).
- **Kueri data oleh asisten**: tool memanggil usecase domain dengan `domain.Identity` penanya. Baca *single-record* ber-cakupan diwarisi apa adanya (`EmployeeService.Get`); baca *daftar* ber-cakupan chapter **ditambahkan** di lapisan usecase (gate `RequireRole(Chapter, Operation)`) karena baca daftar existing bersifat Operation/Admin-only — **matriks RBAC tanpa amandemen** karena tidak ada permukaan GraphQL baru. UI guard (`CHAPTER/OPERATION`) hanya kenyamanan.
- Read-only: tidak ada tool/mutasi tulis data bisnis (FR-08). Satu-satunya penulisan adalah percakapan milik pemanggil.

## Kontrak error

| Kondisi | Perilaku server | Perilaku UI |
| --- | --- | --- |
| Peran Admin/Talent memanggil operasi chat | `FORBIDDEN` | Panel/bubble tidak dirender; akses langsung tetap ditolak server |
| `content` kosong / > 2.000 karakter | Ditolak **sebelum** pemanggilan model (tidak memicu pemakaian token) | `maxLength` input + pesan "Maksimal 2.000 karakter."; tidak ada bubble baru |
| `conversationId` bukan milik pemanggil / tidak ada | `NOT_FOUND` | Toast error; panel tetap pada daftar percakapan miliknya |
| `AI_PROVIDER_*` belum dikonfigurasi | Kegagalan eksplisit "asisten belum dikonfigurasi" | Pesan gagal ramah di thread (FR-11) |
| Provider model gagal/timeout/putaran tool habis | Pesan USER tetap tersimpan; idempoten lewat `clientRequestId`; tidak ada pesan ASSISTANT tersusun; error eksplisit "asisten gagal menjawab, coba lagi" (FR-11) | Bubble gagal + tombol coba ulang yang mengirim ulang `clientRequestId` **sama** → tidak ada pesan user ganda; tidak ada angka yang ditampilkan |
| `clientRequestId` hilang/bukan UUID | Ditolak sebelum menyentuh model | — |
| Kuota per user terlampaui (**20 pesan/jam**, konstanta disetujui) | Ditolak **sebelum** pemanggilan model — tidak ada token terpakai | Pesan ramah "batas pesan per jam tercapai"; tombol kirim nonaktif sampai jendela bergeser |
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

**Batas yang dijaga (R-11)**: baca ber-cakupan chapter hidup di lapisan usecase/repository dan **tidak** diekspos sebagai query/mutation GraphQL. Bila diekspos, Chapter akan memperoleh permukaan `employmentContracts`/`expiringContracts` milik Operation — itu amandemen matriks RBAC. `ScopeChapterID` hanya diisi server dari identitas pemanggil; resolver `employmentContracts(filter:)` tidak memetakan nilai dari klien ke field ini. Resolver existing juga tetap memanggil repositori dengan scope `nil` (Operation-wide) — perilaku query existing **tidak berubah**; scope hanya diisi pada jalur tool asisten.

**Guardrail biaya (FR-10 — nilai disetujui pemilik 2026-10-14, semuanya konstanta kode, bukan env)**: jendela konteks **12 pesan**; panjang pesan **2.000 karakter**; token keluaran **800**; timeout permintaan **25 s**; rate limit **20 pesan/jam/user** memakai `RateLimiter.Allow` Redis existing. Kenaikan nilai mana pun = perubahan kode + persetujuan pemilik. Pemakaian token per pesan asisten tersimpan untuk laporan bulanan.

**Protokol loop** (diegakkan usecase, bukan harapan prompt): maksimum 5 putaran tool per jawaban; setiap hasil tool diberi label sumber + `fetchedAt` (dasar FR-05); jawaban final wajib memuat sumber & waktu data; tool error → dilaporkan ke model sebagai kegagalan (jawaban jujur, bukan konjektur).

## System prompt (ringkasan kontrak perilaku)

- Bahasa Indonesia; identitas: asisten data Tania; cakupan: data karyawan & kontrak dalam hak akses penanya.
- Wajib berdasar pada hasil tool; melarang angka/nama di luar hasil tool; bila data tidak cukup → nyatakan jujur (FR-04, US5 skenario 3).
- Rekomendasi selalu: berdasar data yang dirujuk, berlabel eksplisit "rekomendasi/saran", mengarahkan ke modul terkait untuk aksi (FR-08/FR-09); bukan keputusan pejabat.
- Menolak sopan pertanyaan di luar cakupan (FR-12) dan permintaan menampilkan data tanpa hak akses (FR-06) — "Anda tidak memiliki akses…" bukan datanya (US4 skenario 2).
- Format keluaran: teks dengan bold `**…**` untuk angka penting, daftar sederhana, baris baru — subset yang didukung renderer frontend (R-8 research).

## Kontrak UI (panel & bubble)

- Panel asisten: akses dari dashboard + bubble melayang dari halaman lain; hanya dirender untuk `CHAPTER`/`OPERATION`.
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
