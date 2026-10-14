# Phase 1 — Data Model: Asisten Data & Rekomendasi (Chatbot)

**Feature**: `005-asisten-data-chatbot` (TAN-203 · plan TAN-204) · **Date**: 2026-10-14

Dua entitas baru (**ChatConversation**, **ChatMessage**) + satu **penambahan baca** pada data karyawan. Entitas bisnis existing (karyawan, kontrak, assignment, IDP, evaluasi, CV, master data, user/audit) **tidak diubah** — asisten hanya membaca melalui usecase ber-otorisasi (kontrak spec, Out of Scope: "Perubahan matriks RBAC atau skema entitas bisnis yang ada").

## ChatConversation — percakapan asisten

| Field | Tipe (Go / SQL) | Aturan |
| --- | --- | --- |
| `id` | UUID / `uuid PK` | Dibuat server (pola UUID existing) |
| `userID` | UUID / `user_id FK → users` | **Pemilik tunggal**; seluruh akses baca/tulis selalu ter-filter `WHERE user_id = pemanggil` (FR-02 — termasuk terhadap Admin); FK `ON DELETE CASCADE` mengikuti akun |
| `startedAt` | time / `timestamptz` | Diisi saat dibuat |
| `lastMessageAt` | time / `timestamptz` | Diperbarui tiap pesan; dipakai urutan daftar percakapan |
| `messageCount` | int (derived) | Turunan hitung pesan — disajikan di daftar percakapan, tidak disimpan terpisah |

- Tidak ada status alur kerja (bukan entitas proses); "percakapan baru" = record baru (US1 skenario 3); tidak ada operasi edit/hapus oleh user pada MVP (penghapusan hanya oleh job retensi — di bawah).

## ChatMessage — pesan dalam percakapan

| Field | Tipe (Go / SQL) | Aturan |
| --- | --- | --- |
| `id` | UUID / `uuid PK` | Dibuat server |
| `conversationID` | UUID / `conversation_id FK → chat_conversations` | Kepemilikan diwarisi lewat percakapan induk; akses lintas user ditolak `ErrNotFound` |
| `role` | enum / `text CHECK` | `USER` atau `ASSISTANT` (enum GraphQL `ChatMessageRole`) |
| `content` | text | Isi pesan. Pesan `USER` **maks 2.000 karakter** (FR-03/FR-10 — ditolak sebelum menyentuh model); pesan `ASSISTANT` terikat `AI_MAX_OUTPUT_TOKENS` |
| `inputTokens` / `outputTokens` | int / `int NOT NULL DEFAULT 0` | Pemakaian token per pesan asisten (FR-10/US6) — bahan laporan biaya; 0 untuk pesan user |
| `sources` | jsonb / `jsonb` | Rujukan sumber jawaban asisten: daftar `{tool, params, rowCount, fetchedAt}` — audit kualitas jawaban (US5 skenario 4); **tidak** menambah permukaan baca bagi peran lain (hanya pemilik, lewat percakapannya) |
| `createdAt` | time / `timestamptz` | Waktu pesan |

Indeks: `(conversation_id, created_at)` untuk thread; `(user_id, last_message_at)` untuk daftar percakapan; `created_at` untuk job retensi.

## Klasifikasi & kepatuhan data pribadi (konstitusi Prinsip I–IV — deklarasi wajib)

| Butir | Deklarasi |
| --- | --- |
| Klasifikasi | `chat_messages.content` (kedua arah) dan `chat_conversations` = **data pribadi umum** dengan kandungan potensial: nama karyawan, unit/chapter, tanggal kontrak, NIK **hanya bentuk tersamar** (`nikMasked`, FR-07) — NIK penuh tidak pernah memasuki tabel ini karena tidak pernah keluar dari lapisan domain (R-5 research). `user_id` = penanda teknis pemilik |
| Lawful basis (Prinsip I) | **Kepentingan sah — pelaksanaan fungsi kepegawaian internal** (pengelolaan data talent oleh Chapter/Operation). Tujuan: menyusun jawaban asisten atas data dalam cakupan pemanggil. Tidak dipakai untuk pelatihan model, profil, atau tujuan lain (purpose limitation) |
| Pemrosesan oleh provider (Prinsip I/III) | Konten pertanyaan + hasil tool **dikirim ke provider model milik organisasi** (NC-04 — di dalam perimeter internal) untuk menghasilkan balasan; API key dari secret store/env, tidak pernah di-commit/di-log (FR-10). Tidak ada provider pihak ketiga eksternal pada MVP |
| Retensi (Prinsip IV) | **Proposal: 90 hari sejak pesan terakhir, lalu hapus permanen** percakapan + pesan via job scheduled (pola `runRetentionJob`); setiap run tercatat di audit trail. ⚠️ Angka ini **proposal plan** — perlu persetujuan pemilik produk (Open Item 1 plan) |
| Log (Prinsip II/IX) | Log modul chat hanya memuat: ID percakapan, ID user (penanda teknis), jumlah putaran tool, jumlah token, durasi, dan kode error. **Tanpa isi pesan, tanpa nama/NIK/konten tool result** |
| Hak subjek data (Prinsip IV) | Isi percakapan adalah data pribadi milik user yang bersangkutan: permintaan penghapusan dipenuhi oleh retensi otomatis ≤90 hari; akses/lihat = panel riwayat miliknya sendiri; tidak ada penyaluran ke pihak luar organisasi |
| DAMP | Pemrosesan dinilai risiko rendah–sedang (provider internal, minimisasi field, retensi pendek); checklist DAMP dijalankan konkret pada gerbang rilis (Open Item 3 plan) |

## Penambahan baca: karyawan dengan data diri belum lengkap

Contoh pendorong spec ("karyawan siapa yang data dirinya belum lengkap?") belum memiliki kueri existing. Ditambahkan **satu metode baca** di lapisan repository/usecase karyawan (read-only, tanpa perubahan skema/tabel): daftar karyawan (ter-filter cakupan identitas pemanggil) yang memiliki field opsional data diri kosong — kelompok field mengikuti form data diri existing (data pribadi opsional: tanggal lahir, jenis kelamin, telepon, alamat, pendidikan terakhir, institusi, jurusan). Keluaran memakai DTO aman yang sama dengan tool lain. Ini satu-satunya penambahan kemampuan baca; semua tool lain mengadaptasi metode existing.

## Relasi & antarmuka

```text
users 1 ──── * chat_conversations 1 ──── * chat_messages
                                   └─ (read-only, via usecase existing, identitas penanya)
karyawan / kontrak / dashboard ────────┘
domain.LLMGateway ◄── platform/llm/openai.go   (OpenAI-compatible endpoint organisasi)
```

- `domain.ChatRepository` (interface baru): `CreateConversation`, `ListConversations(userID, page)`, `GetConversation(userID, id)` → `ErrNotFound` bila bukan milik pemanggil, `AppendMessage`, `ListMessages(conversationID, page)`, `DeleteOlderThan(ctx, cutoff) → count` (untuk retensi).
- `domain.LLMGateway` (interface baru): `Complete(ctx, ChatRequest) (ChatResponse, error)` — request memuat system prompt, riwayat terpotong 12 pesan, definisi toolset, dan hasil tool; response memuat teks jawaban, pemakaian token, dan tool-calls bila ada.
- Transisi status: tidak ada (lihat di atas). Validasi: panjang pesan, kepemilikan, peran — rinci di `contracts/chat.md`.

## Yang sengaja TIDAK ada

- Tidak ada kolom/rating/feedback jawaban (tidak diminta spec).
- Tidak ada penyimpanan riwayat model mentah (prompt/response JSON penuh) — hanya hasil akhir + token + sumber (minimisasi, Prinsip II).
- Tidak ada embedding/vektor/index pencarian semantik — toolset deterministik cukup untuk 2 domain MVP; kandidat fase lanjutan bila cakupan domain diperluas.
- Tidak ada tabel "biaya harian" — laporan biaya dihitung agregat dari `chat_messages`.
