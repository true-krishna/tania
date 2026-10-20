# Quickstart — Masuk SSO Microsoft Entra ID

**Feature**: `006-entra-sso-login` (TAN-267 · plan TAN-269) · **Date**: 2026-10-20

Tiga bagian: **A. menjalankan & menguji secara lokal** (tanpa kredensial tenant), **B. UAT ke tenant Telkom** (butuh kredensial + akun sungguhan — dijalankan pemilik produk/Admin Entra), **C. cara mengukur SC-001…SC-005**.

> ⚠️ Tidak ada nilai rahasia di dokumen ini. `ENTRA_CLIENT_SECRET` hanya hidup di `.env` lokal / secret store lingkungan, tidak pernah di-commit, tidak pernah di-log, tidak pernah ditempel ke issue atau MR.

## A. Lokal — tanpa kredensial Entra (SSO nonaktif)

Membuktikan jalur fallback email + kata sandi **tidak tersentuh** (FR-002/SC-003): perilaku sistem yang harus tetap benar saat SSO belum/tidak dikonfigurasi.

```bash
# tania-backend
make migrate up && make run          # tanpa ENTRA_REDIRECT_URI: SSO nonaktif + peringatan terstruktur (bukan gagal start)

# tania-dashboard
pnpm install && pnpm dev
```

1. Buka `http://localhost:3000/login`.
2. **Harapan**: form email + kata sandi tampil langsung — **tidak ada** pengalihan ke Microsoft (karena `entraSsoStart.enabled = false`), tidak ada tombol SSO yang menggantung.
3. Masuk dengan akun lokal → masuk ke `/dashboard` seperti biasa.
4. Buka `http://localhost:3000/login/callback` langsung (tanpa parameter) → **harapan**: pesan Bahasa Indonesia yang jelas ("Sesi masuk tidak valid atau sudah kedaluwarsa. Silakan coba lagi."), bukan halaman kosong atau error mentah.
5. Buka `http://localhost:3000/login?sso=cancelled` → **harapan**: form tampil, **tidak** ada pengalihan otomatis (pintu fallback berfungsi).

Verifikasi backend ikut hidup tanpa Entra: `curl -s localhost:8080/healthz`, lalu jalankan mutation `login` seperti biasa.

## A2. Lokal — dengan kredensial Entra (uji alur penuh)

```bash
# tania-backend/.env (jangan di-commit)
ENTRA_TENANT_ID=<guid tenant>
ENTRA_CLIENT_ID=<guid aplikasi>
ENTRA_CLIENT_SECRET=<rahasia>
ENTRA_REDIRECT_URI=http://localhost:3000/login/callback
```

1. Daftarkan `http://localhost:3000/login/callback` sebagai **Redirect URI** pada aplikasi Entra (tipe Web) bersama URI produksi — hanya sekali, oleh admin Entra.
2. `make run` (backend) + `pnpm dev` (frontend).
3. Buka `http://localhost:3000/login` → **harapan**: langsung berpindah ke halaman masuk Microsoft.
4. Setelah masuk, kembali ke `/login/callback`, lalu ke `/dashboard` dengan sesi Tania.

Periksa di database bahwa jalur SSO benar-benar tercatat:

```sql
-- keterkaitan terbentuk & metode sesi tercatat
SELECT id, email, entra_object_id, auth_provider, last_login_at FROM users WHERE email = '<email uji>';
SELECT id, user_id, auth_method, expires_at, revoked_at FROM refresh_tokens ORDER BY created_at DESC LIMIT 5;
-- jalur pemetaan yang terpakai: jalur 2 butuh baris provisi yang mencatat object_id
SELECT ep.employee_id, ep.action, ep.upn, ep.object_id, ep.status, u.email
  FROM entra_provisions ep
  JOIN employees e ON e.id = ep.employee_id
  LEFT JOIN users u ON u.id = e.user_id
 WHERE ep.object_id = '<oid uji>' OR ep.upn = '<upn uji>';
-- jejak audit: 100% upaya memuat method (SC-004)
SELECT occurred_at, action, after FROM audit_logs WHERE action = 'LOGIN' ORDER BY occurred_at DESC LIMIT 20;
```

5. Panggil `refreshSession` dengan refresh token hasil SSO → **harapan**: token baru terbit dan `refresh_tokens.auth_method` baris baru tetap `entra_sso` (pewarisan metode — kalau berubah menjadi `local`, SC-005 salah hitung).
6. Tekan pintu fallback ("Masuk dengan email & kata sandi") → **harapan**: form tampil, tidak ada pengalihan, masuk lokal berhasil, dan sesi lokal tercatat `auth_method='local'`.
7. Uji **opsi A**: masuk dengan akun korporat yang **belum** tertaut ke akun Tania → kembali ke `/login` dengan pesan "belum tertaut" dan tautan "Masuk dengan email & kata sandi" yang menonjol (tautan ini juga terlihat sebelum ada kegagalan). Tutup tab, buka `/login` lagi di browser yang sama → **harapan**: form email tampil **langsung**, tanpa memutar ulang pengalihan ke Microsoft (penanda 7 hari). Untuk mengulang dari awal, hapus kunci `tania:sso:unlinked` dari Local Storage.

## B. UAT ke tenant Telkom (butuh akun sungguhan)

| # | Skenario | Harapan | Spec |
| --- | --- | --- | --- |
| U1 | Akun korporat yang **terhubung** ke akun Tania | Masuk, sampai `/dashboard`, sesi normal | US1, FR-004 |
| U2 | `US1` diulang setelah email korporat diubah di Entra | Tetap masuk (keterkaitan ikut `oid`, bukan alamat) | Edge case spec |
| U3 | Akun korporat **tanpa** akun Tania | Ditolak dengan pesan generik + arahan ke Admin; **tidak ada akun baru** di DB | US3 AC3, NC-02 |
| U4 | Akun Microsoft **personal** / tenant lain | Ditolak (pesan generik) | FR-005, NC-01 |
| U5 | Akun Tania dalam keadaan **tidak aktif** | Ditolak | FR-011 |
| U6 | Alur dibatalkan di halaman Microsoft | Kembali ke `/login` dengan form tampil + pesan jelas; **tidak** ada lingkaran pengalihan | FR-001/FR-002 |
| U7 | Jalur email + kata sandi dipakai saat SSO aktif | Berhasil masuk seperti sebelumnya | FR-002, SC-003 |
| U8 | Peran tidak berubah: masuk SSO sebagai akun Chapter lalu buka menu Admin | Ditolak backend (403/FORBIDDEN), bukan karena klaim Microsoft | FR-006 |
| U9 | Akun korporat hasil provisi **CREATE** (UPN turunan nama, mis. `rina.kusuma@digitaltelkom.id`) milik karyawan yang akun Tania-nya beralamat lain | **Masuk** — lewat keterkaitan provisi, bukan lewat kesamaan email | FR-004 jalur (2) |
| U10 | Akun korporat yang **sudah ada sebelum Tania** dan belum punya baris provisi, dengan email akun Tania = alamat masuk korporatnya | **Masuk** — lewat kesamaan email, lalu keterkaitan terisi sekali | FR-004 jalur (3) |

Prasyarat U1: akun Tania sudah ada dan **salah satu** jalur pemetaan cocok — emailnya = alamat masuk korporatnya (jalur 3), keterkaitannya sudah terisi (jalur 1), atau karyawannya punya baris `entra_provisions` yang mencatat `object_id` (jalur 2, lihat U9 & query pemeriksaan di §A2). Ketiganya sudah tercakup FR-004 hasil revisi 2026-10-20 — tidak ada lagi kasus data yang menggantung.

Cara cepat menyiapkan U1 (lingkungan non-produksi saja):

```sql
UPDATE users SET email = '<work email korporat>' WHERE id = '<id akun uji>';   -- atau
UPDATE users SET entra_object_id = NULL, auth_provider = 'local' WHERE id = '<id akun uji>';  -- ulangi first-link
```

## C. Gerbang mutu & cara mengukur SC

```bash
# tania-backend
make vet && make lint && make test          # termasuk authz_test, security_test, e2e_test baru
# tania-dashboard
pnpm lint && pnpm typecheck && pnpm test && pnpm generate:check   # generate:check wajib hijau setelah codegen
pnpm test:e2e                                # regresi jalur lokal (SC-003)
```

| SC | Cara mengukur |
| --- | --- |
| **SC-001** — ≤3 interaksi, <30 detik | Ukur manual di U1 (klik tautan → masuk Microsoft → selesai) dan catat durasi dari `/login` sampai `/dashboard`; hitung layar yang dihadapi pengguna |
| **SC-002** — akun yang tepat, 0 kesalahan pemetaan | Jalankan U1+U3+U4+U5 untuk seluruh akun uji; bandingkan `users.entra_object_id` dengan `oid` yang sebenarnya; tidak boleh ada akun terhubung ke identitas yang salah |
| **SC-003** — jalur email 100% utuh | `pnpm test:e2e` + U7 |
| **SC-004** — 100% upaya memuat metode | `SELECT count(*) FILTER (WHERE after->>'method' IS NULL) FROM audit_logs WHERE action='LOGIN';` → **0** |
| **SC-005** — ≥80% masuk via SSO dalam 1 bulan, dibatasi pada pengguna yang sudah memiliki akun korporat (SC-005 hasil revisi 2026-10-20) | `SELECT after->>'method' AS method, count(*) FROM audit_logs WHERE action='LOGIN' AND after->>'outcome'='success' AND occurred_at >= now() - interval '30 days' GROUP BY 1;` → `entra_sso` ÷ total ≥ 0,8. Batasi penyebutnya ke akun yang memang punya akun korporat (`users.entra_object_id IS NOT NULL` atau ada baris `entra_provisions.object_id` untuk karyawannya) — kalau tidak, pengguna tanpa akses korporat menekan rasio dan membuat target tampak tak tercapai |
