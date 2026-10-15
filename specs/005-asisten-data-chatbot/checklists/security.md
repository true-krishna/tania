# Security Checklist: Asisten Data Chatbot (005)

**Purpose**: Mencatat jejak pemeriksaan keamanan & kepatuhan data pribadi sebelum gerbang rilis
**Created**: 2026-10-15 (TAN-208, K4 `/speckit.implement`)
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [data-model.md](../data-model.md)
**Status**: terisi dan diperiksa terhadap kode yang sudah mendarat; **belum ditandatangani** — tanda tangan pemilik produk dilakukan pada gerbang rilis K3 (T030–T034).

Rujukan prinsip: Konstitusi Security I–IV, Konstitusi API, plan D6 (guardrail) dan Open Item 3 (DAMP).

## Klasifikasi & dasar pemrosesan

- [x] Klasifikasi data tercatat: `chat_conversations` dan `chat_messages.content` = **data pribadi umum**; NIK hanya bentuk tersamar (`nikMasked`), NIK penuh tidak pernah masuk tabel ini — `data-model.md` §Klasifikasi & kepatuhan data pribadi
- [x] Lawful basis tercatat: **kepentingan sah — fungsi kepegawaian internal**, dengan purpose limitation (tidak untuk pelatihan model/profil) — `data-model.md` §Klasifikasi
- [x] Minimisasi field pada jalur ke provider: hanya pertanyaan + hasil tool, dan hasil tool memakai DTO aman (tanpa NIK penuh) — `data-model.md` §Klasifikasi; tool `internal/usecase/chat_tools.go`
- [x] Provider berada di perimeter internal (NC-04) dan endpoint bersifat OpenAI-compatible milik organisasi — `plan.md` R-4/R-10

## Otorisasi & akses

- [x] Gerbang peran server-side di setiap operasi chat (`Chapter`, `Operation`; `Admin`/`Talent` ditolak) — `internal/usecase/chat.go` `authorize` + `RequireRole`
- [x] Isolasi antar pemilik: setiap baca/tulis difilter `user_id`; percakapan milik orang lain → `NOT_FOUND`, bukan `FORBIDDEN` (anti-enumerasi) — `internal/repository/postgres/chat.go`
- [x] Baca ber-cakupan untuk Chapter hanya lewat usecase ber-scope (`scope.go`), **tidak** diekspos sebagai query GraphQL baru (R-11) — SDL chat tidak menambah permukaan baca ber-scope
- [x] Tidak ada jalur `Admin` istimewa ke isi percakapan orang lain

## Retensi & hak subjek data

- [x] Retensi **90 hari sejak pesan terakhir → hard delete** (cascade ke pesan), disetujui pemilik 2026-10-14; setiap run tercatat di audit trail — `internal/usecase/chat.go` `RunRetention`, migrasi `0013_chat_conversations.sql`
- [x] Hak subjek: akses/lihat = panel riwayat milik sendiri; penghapusan dipenuhi retensi otomatis ≤90 hari; tidak ada penyaluran ke pihak luar organisasi — `data-model.md` §Klasifikasi
- [x] Retensi bukan anonimisasi (berbeda dari retensi karyawan) dan tidak menyisakan salinan di tabel lain

## Log & observabilitas

- [x] Log modul chat hanya memuat ID percakapan, ID user (penanda teknis), jumlah putaran tool, jumlah token, durasi, dan kode error — tanpa isi pesan, nama, atau NIK — `internal/usecase/chat.go`
- [x] Kegagalan provider dicatat sebagai kode (`GATEWAY_FAILED`, `CHAT_RATE_LIMITED`, `NOT_CONFIGURED`, …) tanpa teks sensitif — `internal/usecase/chat.go` `chatErrorCode`
- [x] Kuota 20 pertanyaan/jam/pengguna ditegakkan **sebelum** panggilan model, sehingga penolakan tidak membelanjakan token — `internal/usecase/chat.go` `Send`

## Rahasia & dependensi

- [x] API key provider hanya dari env/secret store; tidak pernah di-commit, tidak pernah di-log, tidak pernah dikirim ke frontend (`AI_PROVIDER_API_KEY` tidak ada di `tania-dashboard`) — `.env.example`, `docker-compose.yml`
- [x] Aplikasi tetap hidup (fitur aditif) saat `AI_PROVIDER_*` tidak lengkap: panel menampilkan state belum dikonfigurasi, bukan kegagalan total (FR-11)
- [x] Tanpa dependensi baru pada kedua repo (batasan pemilik)

## Jalur breach & penanganan insiden

- [x] Jalur eskalasi tercatat: insiden kebocoran isi percakapan/API key → eskalasi ke pemilik produk + tim platform, pencabutan/rotasi key, penonaktifan sementara modul chat lewat konfigurasi `AI_PROVIDER_*` (tanpa rollback skema)
- [x] Dampak minimalisasi: tanpa NIK penuh di tabel chat dan tanpa retensi panjang, sehingga dampak insiden terbatas pada isi pertanyaan/jawaban dalam cakupan pemiliknya

## Ditunda ke gerbang rilis (disetujui, tercatat)

- [ ] **DAMP**: checklist DAMP konkret dijalankan pada gerbang rilis (plan Open Item 3; `data-model.md` §DAMP). Penilaian awal: risiko rendah–sedang (provider internal, minimisasi field, retensi pendek)
- [ ] **Uji beban/kuota**: pembuktian perilaku kuota pada stack hidup (T025/T028) menunggu K0 (kredensial provider) dan K3
- [ ] **Tanda tangan**: persetujuan pemilik produk atas checklist ini sebelum gerbang rilis K3

## Catatan

- Checklist ini menggantikan temuan F-10 `/speckit.analyze` (K4 T044): sebelumnya jejak checklist tidak ada meski isinya tersebar di `data-model.md` §Klasifikasi.
- Butir yang masih terbuka **tidak** boleh dibaca sebagai lulus; gerbang rilis menunggu DAMP, uji kuota pada stack hidup, dan tanda tangan pemilik.
