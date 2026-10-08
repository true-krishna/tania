# Draft Amandemen Spesifikasi v2 — Pemisahan Data Karyawan & Kontrak Kerja + Alur Siklus Kerja

**Feature**: `001-employee-digital-talent-management` (amandemen)
**Dibuat**: 2026-10-07 · **Status**: DRAFT v2 — merevisi draft v1 (lampiran komentar 02:13) setelah arahan pemilik produk; menunggu ratifikasi sebelum diterapkan ke repo
**Memperbarui**: `spec.md`, `data-model.md` (turunan FR-01, FR-04, FR-16, FR-17, FR-23, FR-29; penomoran FR berlanjut dari FR-32)

## 1. Ringkasan Perubahan (v2)

1. Tabel `employees` difokuskan menjadi **data diri karyawan** dan kini mencakup **nomor KTP (NIK)**.
2. Tabel baru **`employment_contracts` (Kontrak Kerja)** dengan atribut kontrak **selaras TMS**: email kantor, nomor induk karyawan, band_position, jobRole, jobTitle, jobLevel, work location — di atas nomor kontrak, jenis, unit, periode, status, alasan berakhir.
3. **Jejak log yang dapat ditelusuri**: setiap create, update, dan pengakhiran data karyawan/kontrak — termasuk perpanjangan kontrak — tercatat pada jejak audit (FR-41).
4. **Enkripsi & penyamaran**: nomor KTP terenkripsi at-rest dan tampil tersamar (FR-42).
5. Alur siklus kerja baru: **perpanjangan kontrak** (termasuk perpindahan unit/posisi saat perpanjangan), **resign**, **mutasi**, **pensiun** (US9–US13).
6. Turunan chapter & keter-assign-an (FR-23) berpindah basis: `kontrak aktif → jobRole → chapter pemilik`.

## 2. Model Data (draft DDL tingkat konsep)

### 2.1 `employees` — data diri

| Kolom | Keterangan |
| --- | --- |
| `id`, `full_name`, `employee_code` (unik), `email` (unik) | tetap |
| **`nik` (nomor KTP)** | **baru** — 16 digit, unik, wajib; **terenkripsi at-rest, tampil tersamar** (hanya 4 digit akhir pada daftar/detail) |
| `birth_date` | wajib — dasar perhitungan usia pensiun |
| `gender`, `phone`, `address` | field data diri tambahan (usulan v1 dipertahankan) |
| `status` | diperluas: `active` / `resigned` / `retired` / `inactive` |
| `joined_at` | tanggal masuk pertama (mulai kontrak pertama) |

**Dihapus dari `employees`**: `unit_id`, `job_role_id` (pindah ke kontrak). `user_id` tetap (relasi 1:1 ke akun).

### 2.2 `employment_contracts` — kontrak kerja (atribut selaras TMS)

| Kolom | Pemetaan TMS | Keterangan |
| --- | --- | --- |
| `id`, `employee_id` | — | pemilik kontrak |
| `contract_no` | nomor SK/kontrak | unik |
| `contract_type` | jenis kontrak | `pkwt` (waktu tertentu) / `pkwtt` (tetap) |
| **`office_email`** | **email office** | email kantor selama kontrak berlaku; email kantor aktif diturunkan dari kontrak aktif |
| **`nomor_induk`** | **nomor induk karyawan** | snapshot NIK perusahaan yang berlaku pada kontrak; otomatis terisi dari `employee_code` saat kontrak dibuat dan tetap historis bila berubah antar-kontrak |
| **`band_position`** | **band_position** | band jabatan (mis. Band III/IV/V) |
| `job_role_id` | **jobRole** | merujuk Master Data Role — dasar turunan chapter & keter-assign-an (FR-23) |
| **`job_title`** | **jobTitle** | jabatan tertulis pada SK |
| **`job_level`** | **jobLevel** | level jabatan |
| **`work_location`** | **work location** | lokasi kerja (kota/kantor); isian terstruktur pada kontrak |
| `unit_id` | unit/divisi | tetap merujuk Master Data Unit — dasar filter & ringkasan divisi yang sudah ada |
| `start_date`, `end_date` | periode | `end_date` NULL untuk PKWTT |
| `status` | status | `active` / `ended` (habis masa) / `terminated` (dihentikan dini: resign/pensiun/mutasi) |
| `end_reason` | alasan berakhir | nullable: `expiry` / `resign` / `retirement` / `mutation` |
| `predecessor_contract_id` | riwayat perpanjangan | nullable — mengaitkan perpanjangan/mutasi ke kontrak sebelumnya |
| `notes`, `created_by`, timestamp | — | audit mengikuti FR-17/FR-41 |

**Asumsi TMS**: daftar atribut pada arahan pemilik produk (07-10) diperlakukan sebagai atribut talent & kontrak TMS. Bila TMS masih memiliki atribut lain di luar tabel di atas, mohon dilengkapi sebelum finalisasi.

**Aturan kunci**: maksimal **satu kontrak aktif** per karyawan (partial unique index, race-safe seperti pola FR-25). Turunan:

- **unit/posisi/email kantor/lokasi kerja aktif** = nilai pada kontrak dengan `status = 'active'`.
- **assignable** (selaras FR-23) = karyawan `active` **dan** kontrak aktif **dan** `job_role.chapter_id IS NOT NULL`.
- Kontrak berakhir otomatis (turunan dari tanggal) setelah `end_date` lewat — tanpa cron, mengikuti prinsip "status turunan tidak disimpan".

## 3. User Story Baru

### US9 — Operation mengelola kontrak kerja (P1)

Sebagai **Operation**, saya dapat mencatat kontrak kerja karyawan pada tabel terpisah sehingga riwayat penugasan kontrak terdokumentasi dan data diri tidak tercampur data kepegawaian.

1. **Given** karyawan terdaftar tanpa kontrak aktif, **When** Operation menambahkan kontrak (no, jenis, unit, posisi, atribut TMS, tanggal), **Then** kontrak tersimpan dan menjadi kontrak aktif karyawan.
2. **Given** karyawan sudah memiliki kontrak aktif, **When** Operation membuat kontrak aktif kedua yang periodenya tumpang tindih, **Then** sistem menolak dengan pesan validasi.
3. **Given** daftar kontrak, **When** Operation mencari/memfilter (unit, posisi, jenis, status, segera berakhir), **Then** hanya hasil yang sesuai yang tampil.
4. **Given** detail karyawan, **When** dibuka, **Then** tampil data diri (termasuk NIK tersamar) dan riwayat kontrak berurutan (kontrak lama tetap terbaca).
5. **Given** Operation membuat/mengubah/mengakhiri data karyawan atau kontrak, **When** aksi tersimpan, **Then** jejak log (siapa, kapan, jenis aksi, nilai sebelum→sesudah) tercatat dan dapat ditelusuri pada riwayat data tersebut.

### US10 — Perpanjangan kontrak, termasuk perpindahan unit (P1)

Sebagai **Operation**, saya dapat memperpanjang kontrak karyawan — termasuk ketika karyawan berpindah unit/posisi pada saat perpanjangan — sehingga kesinambungan kerja dan perpindahan penugasan tercatat.

1. **Given** kontrak PKWT akan berakhir dalam ≤ 90 hari, **When** Operation membuka daftar "segera berakhir" (atau widget dashboard), **Then** karyawan tersebut muncul sebagai kandidat perpanjangan.
2. **Given** kontrak mendekati/di akhir masa, **When** Operation membuat perpanjangan, **Then** sistem membuat **kontrak baru** yang mulai setelah kontrak lama berakhir, terkait via `predecessor_contract_id`; kontrak lama menjadi riwayat.
3. **Given** perpanjangan disertai **perpindahan unit/posisi**, **When** Operation mengisi unit/posisi baru pada kontrak perpanjangan, **Then** sejak tanggal efektif turunan (unit, posisi, chapter tanggung jawab, keter-assign-an) mengikuti kontrak baru.
4. **Given** kontrak berakhir tanpa perpanjangan, **When** dicek, **Then** kontrak berstatus berakhir (turunan tanggal), karyawan tidak muncul sebagai kandidat talent baru, dan karyawan muncul pada daftar "perlu tindak lanjut" — status kepegawaian menunggu aksi Operation (sesuai keputusan OQ-3).
5. **Given** perpanjangan diisi melewati/menabrak periode kontrak aktif lain karyawan yang sama, **When** submit, **Then** sistem menolak dengan pesan validasi.

### US11 — Resign (P1)

Sebagai **Operation**, saya dapat mencatat pengunduran diri karyawan sehingga status kepegawaian, kontrak, dan akses akunnya berakhir secara konsisten.

1. **Given** karyawan aktif dengan kontrak aktif, **When** Operation mencatat resign (tanggal efektif, alasan/keterangan), **Then** kontrak aktif diakhiri pada tanggal tersebut (`end_reason = resign`), status karyawan → `resigned`, dan akun user terkait ikut dinonaktifkan (selaras edge case eksisting).
2. **Given** karyawan masih memiliki assignment aktif atau IDP berjalan, **When** resign dicatat, **Then** sistem menampilkan peringatan dependensi sebelum konfirmasi (selaras edge case eksisting "peringatan sebelum nonaktif").
3. **Given** resign tercatat, **When** daftar/pencarian kandidat talent untuk assignment/IDP baru dibuka, **Then** karyawan tersebut tidak lagi muncul.

### US12 — Mutasi / perpindahan unit di tengah kontrak (P1)

Sebagai **Operation**, saya dapat mencatat mutasi unit/posisi karyawan di tengah masa kontrak sehingga data penugasan mutakhir tanpa kehilangan riwayat.

1. **Given** karyawan dengan kontrak aktif, **When** Operation mencatat mutasi (unit/posisi baru, tanggal efektif), **Then** kontrak aktif diakhiri dini (`end_reason = mutation`) dan dibuat kontrak baru untuk penugasan baru yang efektif pada tanggal mutasi, terkait via `predecessor_contract_id` (keputusan OQ-1 — opsi B).
2. **Given** mutasi efektif, **When** turunan dihitung, **Then** chapter tanggung jawab & keter-assign-an mengikuti posisi baru mulai tanggal efektif (termasuk kasus Role baru tanpa chapter → karyawan menjadi non-assignable, konsisten FR-23(c)).
3. **Given** karyawan masih punya assignment aktif pada project unit lama, **When** mutasi efektif, **Then** sistem menampilkan peringatan; assignment berjalan tetap tampil sebagai riwayat.

### US13 — Pensiun (P2)

Sebagai **Operation**, saya dapat mencatat pensiun karyawan sehingga berakhirnya masa kerja karena usia terdokumentasi.

1. **Given** karyawan aktif, **When** Operation mencatat pensiun (tanggal efektif), **Then** kontrak aktif diakhiri (`end_reason = retirement`), status karyawan → `retired`, akun dinonaktifkan.
2. **Given** karyawan mendekati usia pensiun, **When** dashboard Operation dibuka, **Then** tampil indikator karyawan yang memasuki jendela pra-pensiun (parameter usia pensiun & jendela — nilai menunggu konfirmasi, lihat §6).

## 4. FR Baru (berlanjut dari FR-32)

- **FR-33**: `employees` hanya menyimpan data diri: nama lengkap, employee ID, **nomor KTP (NIK — unik, wajib, terenkripsi)**, email, tanggal lahir, jenis kelamin, telepon, alamat, status kepegawaian (`active/resigned/retired/inactive`), tanggal masuk pertama. *(Memodifikasi FR-01.)*
- **FR-34**: Sistem menyediakan pengelolaan kontrak kerja terpisah per karyawan dengan atribut selaras TMS: nomor kontrak, jenis (`pkwt/pkwtt`), **email kantor, nomor induk karyawan, band_position, jobRole (Master Data Role), jobTitle, jobLevel, work location**, unit (Master Data Unit), tanggal mulai–selesai, status, alasan berakhir, keterkaitan perpanjangan. Maksimal satu kontrak aktif per karyawan; validasi ditolak di server bila periode bertumpang tindih.
- **FR-35**: Unit dan posisi aktif karyawan **diturunkan dari kontrak aktif** — bukan kolom pada `employees`. Seluruh turunan FR-23 (chapter talent, keter-assign-an, cakupan Chapter) mengacu `kontrak aktif → jobRole → chapter pemilik`. *(Memodifikasi FR-01, FR-23.)*
- **FR-36**: Perpanjangan kontrak menghasilkan kontrak baru yang dimulai setelah kontrak lama berakhir dan terkait ke kontrak sebelumnya; riwayat kontrak lama tetap tersimpan. Perpanjangan dapat menyertakan perpindahan unit/posisi yang efektif pada kontrak baru. *(Implikasi: US4/CV "pengalaman kerja" tetap dari riwayat assignment — tidak berubah.)*
- **FR-37**: Resign mengakhiri kontrak aktif pada tanggal efektif, mengubah status karyawan menjadi `resigned`, dan menonaktifkan akun user terkait; dependensi (assignment aktif/IDP berjalan) diperingatkan sebelum konfirmasi.
- **FR-38**: Mutasi mengubah unit/posisi karyawan di tengah kontrak dengan mekanisme kontrak baru yang efektif pada tanggal mutasi (kontrak lama diakhiri `end_reason = mutation`); turunan chapter/keter-assign-an mengikuti posisi baru sejak tanggal efektif.
- **FR-39**: Pensiun mengakhiri kontrak aktif, mengubah status karyawan menjadi `retired`, dan menonaktifkan akun user terkait.
- **FR-40**: Dashboard Operation menampilkan indikator kontrak segera berakhir (jendela H-90/H-30) dan karyawan pra-pensiun; tidak ada notifikasi email (tetap out of scope). *(Memperluas FR-29/US8 skenario 3.)*
- **FR-41 (baru)**: Setiap **pembuatan, perubahan, dan pengakhiran** data karyawan maupun kontrak — termasuk **perpanjangan kontrak**, resign, mutasi, pensiun — **tercatat pada jejak audit** (aktor, waktu, jenis aksi, nilai sebelum→sesudah) dan **dapat ditelusuri** per karyawan/kontrak. Riwayat perubahan ditampilkan pada detail karyawan/kontrak untuk Operation; jejak audit penuh tetap milik Admin (memperluas FR-17). Hard delete karyawan tidak disediakan (selaras semantik aplikasi eksisting) — pengakhiran dicatat sebagai aksi yang berlog.
- **FR-42 (baru)**: Nomor KTP disimpan **terenkripsi at-rest**; pada daftar dan detail hanya ditampilkan **tersamar** (4 digit akhir); nilai penuh hanya melalui tampilan khusus berizin. Jejak audit menyimpan NIK dalam bentuk tersamar, tidak pernah plaintext.

## 5. Dampak pada Artifact Eksisting

| Artifact | Dampak |
| --- | --- |
| `spec.md` FR-01/FR-04/FR-16/FR-23/FR-29 | revisi rumusan: unit/posisi via kontrak aktif; kandidat talent = kontrak aktif |
| `spec.md` US1–US8 | skenario yang menyebut "divisi/posisi" karyawan menyesuaikan sumber kebenaran baru |
| `data-model.md` §3.3 | `employees` dipangkas (+ kolom `nik` terenkripsi); tabel `employment_contracts` + indeks baru; view `employee_chapter_scope` diperbarui (join via kontrak aktif) |
| `contracts/schema.graphql` | tipe Employee (+nik, masking) & EmploymentContract baru + input/mutation lifecycle |
| Audit (FR-17) | diperluas FR-41: siklus hidup kontrak & kejadian resign/mutasi/pensiun/pengakhiran masuk cakupan audit; riwayat tampil per record |
| Keamanan (baru) | enkripsi at-rest + masking NIK (FR-42) — kebijakan cipher & key management mengikuti keputusan teknis implementasi |
| Karyawan nonaktif (edge case) | diperluas: resign/pensiun otomatis menonaktifkan akun (sudah selaras) |

## 6. Keputusan atas OQ (jawaban usulan final — menunggu ratifikasi)

| OQ | Keputusan (usulan) |
| --- | --- |
| 1. Mutasi di tengah kontrak | **Opsi B** — kontrak aktif diakhiri (`end_reason = mutation`) + kontrak baru efektif tanggal mutasi. Riwayat utuh per SK, selaras TMS (perubahan penugasan = record kontrak baru), dan setiap perubahan otomatis berlog. |
| 2. Jenis kontrak | **PKWT dan PKWTT keduanya dicatat**; perpanjangan hanya relevan untuk PKWT. |
| 3. Kontrak habis tanpa perpanjangan | Otomatis **non-assignable** (turunan tanggal); status karyawan tetap `active` menunggu keputusan; tampil di daftar "perlu tindak lanjut"; setiap tindak lanjutan Operation tercatat log. |
| 4. Aktor | Seluruh alur kontrak & siklus kerja milik **Operation**; Operation melihat riwayat perubahan pada record; jejak audit penuh tetap Admin. |
| 5. Field data diri & parameter | Data diri: usulan v1 (tanggal lahir, jenis kelamin, telepon, alamat) **+ nomor KTP** per arahan. Parameter: usia pensiun **56 tahun** (parametri, dapat diubah tanpa deploy) & jendela H-90/H-30 — **nilai mohon konfirmasi**. |

Catatan arahan sebelumnya juga sudah diakomodasi: (1) keselarasan TMS → pemetaan atribut pada §2.2; (2) enkripsi → FR-42; (3) log telusur → FR-41.

## 7. Out of Scope (usulan, konsisten spesifikasi eksisting)

- Integrasi HRIS/payroll, dokumen digital tanda tangan (e-sign), upload file SK sebagai syarat validasi.
- Notifikasi email/reminder otomatis — indikator disajikan di dashboard/daftar.
- Perhitungan kompensasi/kenaikan gaji akibat perpanjangan atau mutasi.
- Master Data Work Location terpisah — `work_location` cukup isian terstruktur pada kontrak; promosi ke master data dapat menyusul bila dibutuhkan konsistensi.

## 8. Konfirmasi Tersisa (3 butir)

1. **Ratifikasi keputusan OQ 1–5** pada §6 — khususnya nilai usia pensiun (usulan 56) dan jendela H-90/H-30.
2. **Pemetaan "delete talent"**: aplikasi tidak menyediakan hard delete (selaras semantik eksisting); "hapus" dipetakan ke pengakhiran/nonaktif yang tetap terlog. Sesuai?
3. **`work_location`** sebagai isian terstruktur pada kontrak (bukan master data baru). Sesuai?

## 9. Langkah Berikutnya (setelah ratifikasi)

1. Terapkan keputusan §6 → finalisasi draft.
2. Update `spec.md` + `data-model.md` di repo (amandemen tercatat sebagai revisi baru).
3. Pecah menjadi sub-issues implementasi (backend skema+migrasi → API lifecycle → frontend form/daftar/dashboard) dengan estimasi 1–2 hari per sub-tugas — dikonfirmasi dulu sebelum bulk creation.
