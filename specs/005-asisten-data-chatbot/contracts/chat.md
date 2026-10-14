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
  createdAt: Time!
}

# pagination: ChatConversationConnection / ChatMessageConnection mengikuti pola *Connection existing
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
     Pesan USER tersimpan otomatis sebelum pemanggilan model."""
  sendChatMessage(conversationId: ID!, content: String!): ChatMessage!
}
```

## Otorisasi (FR-01/FR-02/FR-06)

- **Seluruh operasi chat**: `RequireRole(identity, RoleChapter, RoleOperation)` — **Admin & Talent ditolak pada MVP** (NC-03; FR-01: panel tidak tersedia bagi peran lain).
- **Kepemilikan**: setiap baca/tulis percakapan difilter `WHERE user_id = pemanggil`; percakapan orang lain (termasuk milik Admin dibaca Chapter, dsb.) → `NOT_FOUND`, bukan `FORBIDDEN` (anti-enumerasi, pola `internal/usecase/scope.go`). **Tanpa pengecualian Admin** (FR-02 verbatim).
- **Kueri data oleh asisten**: tool memanggil usecase domain existing dengan `domain.Identity` penanya — otorisasi & cakupan chapter-as-data diwariskan, **matriks RBAC tanpa amandemen**. UI guard (`CHAPTER/OPERATION`) hanya kenyamanan.
- Read-only: tidak ada tool/mutasi tulis data bisnis (FR-08). Satu-satunya penulisan adalah percakapan milik pemanggil.

## Kontrak error

| Kondisi | Perilaku server | Perilaku UI |
| --- | --- | --- |
| Peran Admin/Talent memanggil operasi chat | `FORBIDDEN` | Panel/bubble tidak dirender; akses langsung tetap ditolak server |
| `content` kosong / > 2.000 karakter | Ditolak **sebelum** pemanggilan model (tidak memicu pemakaian token) | `maxLength` input + pesan "Maksimal 2.000 karakter."; tidak ada bubble baru |
| `conversationId` bukan milik pemanggil / tidak ada | `NOT_FOUND` | Toast error; panel tetap pada daftar percakapan miliknya |
| `AI_PROVIDER_*` belum dikonfigurasi | Kegagalan eksplisit "asisten belum dikonfigurasi" | Pesan gagal ramah di thread (FR-11) |
| Provider model gagal/timeout/putaran tool habis | Tidak ada pesan ASSISTANT tersusun; error eksplisit "asisten gagal menjawab, coba lagi" (FR-11) | Bubble gagal + tombol coba ulang; tidak ada angka yang ditampilkan |
| Pertanyaan di luar domain Tania (FR-12) | Model diarahkan system prompt menolak sopan + menjelaskan cakupan | Ditampilkan sebagai jawaban biasa |

## Toolset data (read-only; diekspos ke model, bukan ke klien)

Semua tool berjalan dengan identitas penanya; hasil diproyeksikan ke DTO aman (NIK hanya `nikMasked`; tanpa field keamanan/akun; tanpa data domain di luar MVP — assignment/IDP/evaluasi/CV/master data/workload tidak diekspos pada MVP).

| Tool | Parameter | Mengadaptasi (existing) | Catatan |
| --- | --- | --- | --- |
| `ringkas_data` | — | komposisi `EmployeeService.List` + `ContractService.Expiring/NeedingFollowUp` | Snapshot agregat sesuai peran: jumlah karyawan aktif (cakupan), kontrak segera berakhir (≤90 hari), perlu tindak lanjut, distribusi per unit (Operation) — satu sumber angka untuk US2 |
| `cari_karyawan` | `search`, `unitId?`, `jobRoleId?`, `status?` | `EmployeeService.List` | Hasil dibatasi (≤25 baris) + indikator ada-lagi |
| `detail_karyawan` | `employeeId` | `EmployeeService.Get` | `NOT_FOUND` untuk di luar cakupan (anti-enumerasi existing) |
| `kontrak_segera_berakhir` | `days?` (default 90, maks 180) | `ContractService.Expiring` | Jendela FR-40 |
| `karyawan_perlu_tindak_lanjut` | — | `ContractService.NeedingFollowUp` | Kontrak habis tanpa perpanjangan (US10 induk) |
| `karyawan_data_belum_lengkap` | — | metode baca baru (NULL-check field opsional; lihat `data-model.md`) | Satu-satunya penambahan baca |

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
- Input: `maxLength` 2.000 + penghitung; kirim dinonaktifkan saat menunggu balasan; state gagal ramah dengan coba ulang.
- Seluruh teks UI Bahasa Indonesia; komponen memakai TANIA Pulse (`Card`, `Button`, `Input`, `DataState`, `Toast`); tombol buka asisten memakai peran aksen merah brand "AI actions" (`--tp-brand-red`).

## Referensi

- SDL & resolver (setelah implementasi): `tania-backend/graph/schema.graphqls`, `graph/schema.resolvers.go`.
- Usecase & otorisasi: `internal/usecase/chat.go`, `internal/usecase/chat_tools.go`, `internal/usecase/authz_test.go`, `internal/usecase/scope.go`.
- Gateway: `internal/platform/llm/openai.go`; konfigurasi: `internal/config/config.go`.
- Usecase yang diadaptasi: `internal/usecase/employee.go`, `internal/usecase/contract.go`, `internal/usecase/dashboard.go`.
- Frontend: `src/features/assistant/`, codegen `src/generated/graphql/` (regenerasi wajib).
