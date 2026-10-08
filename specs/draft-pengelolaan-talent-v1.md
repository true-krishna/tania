# Draft Perubahan Spesifikasi — Pemisahan Data Karyawan & Kontrak Kerja + Alur Siklus Kerja

**Feature**: `001-employee-digital-talent-management` (amandemen)
**Dibuat**: 2026-10-07 · **Status**: DRAFT — menunggu klarifikasi & persetujuan pemilik produk
**Memperbarui**: `spec.md`, `data-model.md` (turunan FR-01, FR-04, FR-16, FR-17, FR-23, FR-29; penomoran FR berlanjut dari FR-32)

## 1. Ringkasan Perubahan

1. Tabel `employees` difokuskan menjadi **data diri karyawan** (identitas pribadi + status kepegawaian) — atribut penugasan (unit, posisi) keluar dari tabel ini.
2. Tabel baru **`employment_contracts` (Kontrak Kerja)** — satu karyawan punya riwayat kontrak berurutan; unit & posisi aktif karyawan **diturunkan dari kontrak aktif**, bukan disimpan di `employees`.
3. Alur siklus kerja baru: **perpanjangan kontrak**, **resign**, **mutasi** (perpindahan unit/posisi di tengah kontrak), **pensiun**, serta **perpindahan unit saat perpanjangan kontrak**.
4. Turunan chapter & keter-assign-an (FR-23) berpindah basis: `kontrak aktif → job_role → chapter pemilik`.

## 2. Model Data (draft DDL tingkat konsep)

### 2.1 `employees` — data diri

| Kolom | Keterangan |
| --- | --- |
| `id`, `full_name`, `employee_code` (unik), `email` (unik) | tetap |
| `birth_date` | wajib — dasar perhitungan usia pensiun |
| `gender`, `phone`, `address` | usulan field data diri tambahan (asumsi — dikonfirmasi) |
| `status` | diperluas: `active` / `resigned` / `retired` / `inactive` |
| `joined_at` | tanggal masuk pertama (mulai kontrak pertama) |

**Dihapus dari `employees`**: `unit_id`, `job_role_id` (pindah ke kontrak). `user_id` tetap (relasi 1:1 ke akun).

### 2.2 `employment_contracts` — kontrak kerja

| Kolom | Keterangan |
| --- | --- |
| `id`, `employee_id` | pemilik kontrak |
| `contract_no` | unik, nomor kontrak/SK |
| `contract_type` | `pkwt` (waktu tertentu) / `pkwtt` (tetap) — asumsi, dikonfirmasi |
| `unit_id`, `job_role_id` | unit & posisi selama kontrak berlaku (RESTRICT ke master data) |
| `start_date`, `end_date` | `end_date` NULL untuk PKWTT |
| `status` | `active` / `ended` (habis masa) / `terminated` (dihentikan dini: resign/pensiun/mutasi—sesuai keputusan Q1) |
| `end_reason` | nullable: `expiry` / `resign` / `retirement` / `mutation` |
| `predecessor_contract_id` | nullable — mengaitkan perpanjangan ke kontrak sebelumnya (riwayat perpanjangan terekam) |
| `notes`, `created_by`, timestamp | audit mengikuti FR-17 |

**Aturan kunci**: maksimal **satu kontrak aktif** per karyawan (partial unique index, race-safe seperti pola FR-25). Turunan baru:

- **unit/posisi aktif** = `unit_id`/`job_role_id` pada kontrak dengan `status = 'active'`.
- **assignable** (selaras FR-23) = karyawan `active` **dan** kontrak aktif **dan** `job_role.chapter_id IS NOT NULL`.
- Kontrak berakhir otomatis (turunan dari tanggal) setelah `end_date` lewat — tanpa cron, mengikuti prinsip "status turunan tidak disimpan".

## 3. User Story Baru

### US9 — Operation mengelola kontrak kerja (P1)

Sebagai **Operation**, saya dapat mencatat kontrak kerja karyawan pada tabel terpisah sehingga riwayat penugasan kontrak terdokumentasi dan data diri tidak tercampur data kepegawaian.

1. **Given** karyawan terdaftar tanpa kontrak aktif, **When** Operation menambahkan kontrak (no, jenis, unit, posisi, tanggal), **Then** kontrak tersimpan dan menjadi kontrak aktif karyawan.
2. **Given** karyawan sudah memiliki kontrak aktif, **When** Operation membuat kontrak aktif kedua yang periodenya tumpang tindih, **Then** sistem menolak dengan pesan validasi.
3. **Given** daftar kontrak, **When** Operation mencari/memfilter (unit, posisi, jenis, status, segera berakhir), **Then** hanya hasil yang sesuai yang tampil.
4. **Given** detail karyawan, **When** dibuka, **Then** tampil data diri dan riwayat kontrak berurutan (kontrak lama tetap terbaca).

### US10 — Perpanjangan kontrak, termasuk perpindahan unit (P1)

Sebagai **Operation**, saya dapat memperpanjang kontrak karyawan — termasuk ketika karyawan berpindah unit/posisi pada saat perpanjangan — sehingga kesinambungan kerja dan perpindahan penugasan tercatat.

1. **Given** kontrak PKWT akan berakhir dalam ≤ 90 hari, **When** Operation membuka daftar "segera berakhir" (atau widget dashboard), **Then** karyawan tersebut muncul sebagai kandidat perpanjangan.
2. **Given** kontrak mendekati/di akhir masa, **When** Operation membuat perpanjangan, **Then** sistem membuat **kontrak baru** yang mulai setelah kontrak lama berakhir, terkait via `predecessor_contract_id`; kontrak lama menjadi riwayat.
3. **Given** perpanjangan disertai **perpindahan unit/posisi**, **When** Operation mengisi unit/posisi baru pada kontrak perpanjangan, **Then** sejak tanggal efektif turunan (unit, posisi, chapter tanggung jawab, keter-assign-an) mengikuti kontrak baru.
4. **Given** kontrak berakhir tanpa perpanjangan, **When** dicek, **Then** kontrak berstatus berakhir (turunan tanggal) dan karyawan tidak muncul sebagai kandidat talent baru — status kepegawaian menunggu aksi Operation (sesuai jawaban Q3).
5. **Given** perpanjangan diisi melewati/menabrak periode kontrak aktif lain karyawan yang sama, **When** submit, **Then** sistem menolak dengan pesan validasi.

### US11 — Resign (P1)

Sebagai **Operation**, saya dapat mencatat pengunduran diri karyawan sehingga status kepegawaian, kontrak, dan akses akunnya berakhir secara konsisten.

1. **Given** karyawan aktif dengan kontrak aktif, **When** Operation mencatat resign (tanggal efektif, alasan/keterangan), **Then** kontrak aktif diakhiri pada tanggal tersebut (`end_reason = resign`), status karyawan → `resigned`, dan akun user terkait ikut dinonaktifkan (selaras edge case eksisting).
2. **Given** karyawan masih memiliki assignment aktif atau IDP berjalan, **When** resign dicatat, **Then** sistem menampilkan peringatan dependensi sebelum konfirmasi (selaras edge case eksisting "peringatan sebelum nonaktif").
3. **Given** resign tercatat, **When** daftar/pencarian kandidat talent untuk assignment/IDP baru dibuka, **Then** karyawan tersebut tidak lagi muncul.

### US12 — Mutasi / perpindahan unit di tengah kontrak (P1)

Sebagai **Operation**, saya dapat mencatat mutasi unit/posisi karyawan di tengah masa kontrak sehingga data penugasan mutakhir tanpa kehilangan riwayat.

1. **Given** karyawan dengan kontrak aktif, **When** Operation mencatat mutasi (unit/posisi baru, tanggal efektif), **Then** penugasan pada kontrak berubah ke nilai baru sesuai mekanisme hasil keputusan Q1 (revisi kontrak aktif dengan riwayat versi **atau** akhiri kontrak + kontrak baru), dan perubahan tersimpan pada tanggal efektif.
2. **Given** mutasi efektif, **When** turunan dihitung, **Then** chapter tanggung jawab & keter-assign-an mengikuti posisi baru mulai tanggal efektif (termasuk kasus Role baru tanpa chapter → karyawan menjadi non-assignable, konsisten FR-23(c)).
3. **Given** karyawan masih punya assignment aktif pada project unit lama, **When** mutasi efektif, **Then** sistem menampilkan peringatan; assignment berjalan tetap tampil sebagai riwayat.

### US13 — Pensiun (P2)

Sebagai **Operation**, saya dapat mencatat pensiun karyawan sehingga berakhirnya masa kerja karena usia terdokumentasi.

1. **Given** karyawan aktif, **When** Operation mencatat pensiun (tanggal efektif), **Then** kontrak aktif diakhiri (`end_reason = retirement`), status karyawan → `retired`, akun dinonaktifkan.
2. **Given** karyawan mendekati usia pensiun, **When** dashboard Operation dibuka, **Then** tampil indikator karyawan yang memasuki jendela pra-pensiun (asumsi usia pensiun & jendela — dikonfirmasi).

## 4. FR Baru (berlanjut dari FR-32)

- **FR-33**: `employees` hanya menyimpan data diri: nama lengkap, employee ID, email, tanggal lahir, jenis kelamin, telepon, alamat, status kepegawaian (`active/resigned/retired/inactive`), tanggal masuk pertama. *(Memodifikasi FR-01.)*
- **FR-34**: Sistem menyediakan pengelolaan kontrak kerja terpisah per karyawan: nomor kontrak, jenis (`pkwt/pkwtt`), unit (Master Data Unit), posisi (Master Data Role), tanggal mulai–selesai, status, alasan berakhir, keterkaitan perpanjangan. Maksimal satu kontrak aktif per karyawan; validasi ditolak di server bila periode bertumpang tindih.
- **FR-35**: Unit dan posisi aktif karyawan **diturunkan dari kontrak aktif** — bukan kolom pada `employees`. Seluruh turunan FR-23 (chapter talent, keter-assign-an, cakupan Chapter) mengacu `kontrak aktif → job_role → chapter pemilik`. *(Memodifikasi FR-01, FR-23.)*
- **FR-36**: Perpanjangan kontrak menghasilkan kontrak baru yang dimulai setelah kontrak lama berakhir dan terkait ke kontrak sebelumnya; riwayat kontrak lama tetap tersimpan. Perpanjangan dapat menyertakan perpindahan unit/posisi yang efektif pada kontrak baru. *(Implikasi: US4/CV "pengalaman kerja" tetap dari riwayat assignment — tidak berubah.)*
- **FR-37**: Resign mengakhiri kontrak aktif pada tanggal efektif, mengubah status karyawan menjadi `resigned`, dan menonaktifkan akun user terkait; dependensi (assignment aktif/IDP berjalan) diperingatkan sebelum konfirmasi.
- **FR-38**: Mutasi mengubah unit/posisi karyawan di tengah kontrak pada tanggal efektif sesuai mekanisme yang diputuskan (Q1); turunan chapter/keter-assign-an mengikuti posisi baru sejak tanggal efektif.
- **FR-39**: Pensiun mengakhiri kontrak aktif, mengubah status karyawan menjadi `retired`, dan menonaktifkan akun user terkait.
- **FR-40**: Dashboard Operation menampilkan indikator kontrak segera berakhir (jendela H-90/H-30 — dikonfirmasi) dan karyawan pra-pensiun; tidak ada notifikasi email (tetap out of scope). *(Memperluas FR-29/US8 skenario 3.)*

## 5. Dampak pada Artifact Eksisting

| Artifact | Dampak |
| --- | --- |
| `spec.md` FR-01/FR-04/FR-16/FR-23/FR-29 | revisi rumusan: unit/posisi via kontrak aktif; kandidat talent = kontrak aktif |
| `spec.md` US1–US8 | skenario yang menyebut "divisi/posisi" karyawan menyesuaikan sumber kebenaran baru |
| `data-model.md` §3.3 | `employees` dipangkas; tabel `employment_contracts` + indeks baru; view `employee_chapter_scope` diperbarui (join via kontrak aktif) |
| `contracts/schema.graphql` | tipe Employee & EmploymentContract baru + input/mutation lifecycle |
| Audit (FR-17) | mutasi kontrak & kejadian resign/mutasi/pensiun masuk cakupan audit |
| Karyawan nonaktif (edge case) | diperluas: resign/pensiun otomatis menonaktifkan akun (sudah selaras) |

## 6. Pertanyaan Klarifikasi (mengubah scope — perlu keputusan)

1. **Mutasi di tengah kontrak**: (A) revisi kontrak aktif dengan riwayat versi (kontrak berlanjut), atau (B) kontrak aktif diakhiri dini dan dibuat kontrak baru untuk unit baru?
2. **Jenis kontrak**: apakah PKWTT (karyawan tetap, tanpa tanggal akhir) ikut dicatat, atau hanya PKWT? Alur perpanjangan hanya relevan untuk PKWT.
3. **Kontrak PKWT habis tanpa perpanjangan**: apakah otomatis membuat karyawan non-assignable dengan status kepegawaian tetap `active` (menunggu keputusan), atau wajib ada aksi Operation (mis. mengakhiri kerja/resign tercatat)?
4. **Aktor**: apakah seluruh alur (kontrak, perpanjangan, resign, mutasi, pensiun) dimiliki Operation, atau ada keterlibatan Admin/HR lain?
5. **Data diri & parameter**: field data diri minimal yang dibutuhkan (usulan: tanggal lahir, jenis kelamin, telepon, alamat) serta usia pensiun & jendela peringatan (H-90/H-30, pra-pensiun 1 tahun) — apakah sesuai?

## 7. Out of Scope (usulan, konsisten spesifikasi eksisting)

- Integrasi HRIS/payroll, dokumen digital tanda tangan (e-sign), upload file SK sebagai syarat validasi.
- Notifikasi email/reminder otomatis — indikator disajikan di dashboard/daftar.
- Perhitungan kompensasi/kenaikan gaji akibat perpanjangan atau mutasi.

## 8. Langkah Berikutnya (setelah persetujuan)

1. Terapkan jawaban klarifikasi → finalisasi draft ini.
2. Update `spec.md` + `data-model.md` di repo (amandemen tercatat sebagai revisi baru).
3. Pecah menjadi sub-issues implementasi (backend skema+migrasi → API lifecycle → frontend form/daftar/dashboard) dengan estimasi 1–2 hari per sub-tugas.
