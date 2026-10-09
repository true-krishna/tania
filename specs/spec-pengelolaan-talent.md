# Amandemen Spesifikasi 002 — Pengelolaan Talent (Data Diri, Kontrak Kerja, Siklus Kerja & Provisi Akun Entra)

**Feature**: `001-employee-digital-talent-management` (amandemen)
**Dibuat**: 2026-10-07 · **Status**: FINAL — disahkan pemilik produk 2026-10-07 (TAN-98) dan diterapkan ke `specs/001-employee-digital-talent-management/`
**Memperbarui**: `spec.md`, `data-model.md` (turunan FR-01, FR-04, FR-16, FR-17, FR-23, FR-29; penomoran FR berlanjut dari FR-32)
**Revisi**: 2026-10-08 — keputusan pemilik produk `employee_code` hanya disimpan di tabel kontrak (`employment_contracts.nomor_induk`) diterapkan (§2.1–2.2, §4 FR-33/FR-34, §6 butir 8); dokumen direstorasi ke repo sebagai `specs/spec-pengelolaan-talent.md` (TAN-141).
**Revisi**: 2026-10-09 — penambahan 3 field data diri talent ke tabel `employees`: `latest_education` (pendidikan terakhir), `institution_name` (nama institusi), `major` (jurusan) (arahan pemilik produk, TAN-145).

## 1. Ringkasan Perubahan

1. Tabel `employees` difokuskan menjadi **data diri karyawan** dan kini mencakup **nomor KTP (NIK)**.
2. Tabel baru **`employment_contracts` (Kontrak Kerja)** dengan atribut kontrak **selaras TMS**: email kantor, nomor induk karyawan, band_position, jobRole, jobTitle, jobLevel, work location — di atas nomor kontrak, jenis, unit, periode, status, alasan berakhir.
3. **Jejak log yang dapat ditelusuri**: setiap create, update, dan pengakhiran data karyawan/kontrak — termasuk perpanjangan kontrak — tercatat pada jejak audit (FR-41).
4. **Enkripsi & penyamaran**: nomor KTP terenkripsi at-rest dan tampil tersamar (FR-42).
5. Alur siklus kerja baru: **perpanjangan kontrak** (termasuk perpindahan unit/posisi saat perpanjangan), **resign**, **mutasi**, **pensiun** (US9–US13).
6. Turunan chapter & keter-assign-an (FR-23) berpindah basis: `kontrak aktif → jobRole → chapter pemilik`.
7. **Provisi akun Microsoft Entra**: auto-create saat create talent (opsi pada form), UI daftar talent belum-berakun-Entra, aturan domain `telkom.co.id` → invitation / lainnya → create account, UPN final `nama-depan.nama-belakang@digitaltelkom.id`, dan penonaktifan akun saat talent terminasi (US14, FR-43–FR-46).

## 2. Model Data (ringkasan DDL tingkat konsep)

### 2.1 `employees` — data diri

| Kolom | Keterangan |
| --- | --- |
| `id`, `full_name`, `email` (unik) | tetap |
| **`nik` (nomor KTP)** | **baru** — 16 digit, unik, wajib; **terenkripsi at-rest, tampil tersamar** (hanya 4 digit akhir pada daftar/detail) |
| `birth_date` | wajib — dasar perhitungan usia pensiun |
| `gender`, `phone`, `address` | field data diri tambahan |
| `latest_education`, `institution_name`, `major` | field data diri tambahan (2026-10-09) — pendidikan terakhir, nama institusi, jurusan |
| `status` | diperluas: `active` / `resigned` / `retired` / `inactive` |
| `joined_at` | tanggal masuk pertama (mulai kontrak pertama) |

**Dihapus dari `employees`**: `unit_id`, `job_role_id`, dan `employee_code` (identitas kepegawaian hanya pada `employment_contracts.nomor_induk` — keputusan 2026-10-08). `user_id` tetap (relasi 1:1 ke akun).

### 2.2 `employment_contracts` — kontrak kerja (atribut selaras TMS)

| Kolom | Pemetaan TMS | Keterangan |
| --- | --- | --- |
| `id`, `employee_id` | — | pemilik kontrak |
| `contract_no` | nomor SK/kontrak | unik |
| `contract_type` | jenis kontrak | `pkwt` (waktu tertentu) / `pkwtt` (tetap) |
| **`office_email`** | **email office** | email kantor selama kontrak berlaku; email kantor aktif diturunkan dari kontrak aktif |
| **`nomor_induk`** | **nomor induk karyawan** | wajib diisi Operation pada setiap kontrak (tidak otomatis dari data diri); berlaku sebagai employee ID selama kontrak tersebut; satu nomor induk hanya boleh aktif pada satu kontrak (partial unique index `uq_employment_contracts_nomor_induk_active`); snapshot historis per kontrak bila berubah antar-kontrak |
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

**Asumsi TMS**: daftar atribut pada arahan pemilik produk (07-10) diperlakukan sebagai atribut talent & kontrak TMS. Bila TMS masih memiliki atribut lain di luar tabel di atas, mohon dilengkapi sebelum implementasi.

**Aturan kunci**: maksimal **satu kontrak aktif** per karyawan (partial unique index, race-safe seperti pola FR-25). Turunan:

- **unit/posisi/email kantor/lokasi kerja aktif** = nilai pada kontrak dengan `status = 'active'`.
- **assignable** (selaras FR-23) = karyawan `active` **dan** kontrak aktif **dan** `job_role.chapter_id IS NOT NULL`.
- Kontrak berakhir otomatis (turunan dari tanggal) setelah `end_date` lewat — tanpa cron, mengikuti prinsip "status turunan tidak disimpan".

### 2.3 Akun Microsoft Entra

- Relasi `employees.user_id` (1:1) menjadi tautan karyawan ↔ akun; status provisi Entra (belum dibuat / invited / created / gagal) tercatat dan terlihat pada daftar FR-44.
- UPN akun hasil create: **`nama-depan.nama-belakang@digitaltelkom.id`**; bila nama depan + nama belakang identik dengan akun eksisting, ditambahkan angka di belakang nama belakang (mis. `budi.santoso2@digitaltelkom.id`).

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
4. **Given** kontrak berakhir tanpa perpanjangan, **When** dicek, **Then** kontrak berstatus berakhir (turunan tanggal), karyawan tidak muncul sebagai kandidat talent baru, dan karyawan muncul pada daftar "perlu tindak lanjut" — status kepegawaian menunggu aksi Operation (keputusan OQ-3).
5. **Given** perpanjangan diisi melewati/menabrak periode kontrak aktif lain karyawan yang sama, **When** submit, **Then** sistem menolak dengan pesan validasi.

### US11 — Resign (P1)

Sebagai **Operation**, saya dapat mencatat pengunduran diri karyawan sehingga status kepegawaian, kontrak, dan akses akunnya berakhir secara konsisten.

1. **Given** karyawan aktif dengan kontrak aktif, **When** Operation mencatat resign (tanggal efektif, alasan/keterangan), **Then** kontrak aktif diakhiri pada tanggal tersebut (`end_reason = resign`), status karyawan → `resigned`, dan akun user terkait ikut dinonaktifkan (termasuk akun Entra — FR-46).
2. **Given** karyawan masih memiliki assignment aktif atau IDP berjalan, **When** resign dicatat, **Then** sistem menampilkan peringatan dependensi sebelum konfirmasi.
3. **Given** resign tercatat, **When** daftar/pencarian kandidat talent untuk assignment/IDP baru dibuka, **Then** karyawan tersebut tidak lagi muncul.

### US12 — Mutasi / perpindahan unit di tengah kontrak (P1)

Sebagai **Operation**, saya dapat mencatat mutasi unit/posisi karyawan di tengah masa kontrak sehingga data penugasan mutakhir tanpa kehilangan riwayat.

1. **Given** karyawan dengan kontrak aktif, **When** Operation mencatat mutasi (unit/posisi baru, tanggal efektif), **Then** kontrak aktif diakhiri dini (`end_reason = mutation`) dan dibuat kontrak baru untuk penugasan baru yang efektif pada tanggal mutasi, terkait via `predecessor_contract_id` (keputusan OQ-1 — opsi B).
2. **Given** mutasi efektif, **When** turunan dihitung, **Then** chapter tanggung jawab & keter-assign-an mengikuti posisi baru mulai tanggal efektif (termasuk kasus Role baru tanpa chapter → karyawan menjadi non-assignable, konsisten FR-23(c)).
3. **Given** karyawan masih punya assignment aktif pada project unit lama, **When** mutasi efektif, **Then** sistem menampilkan peringatan; assignment berjalan tetap tampil sebagai riwayat.

### US13 — Pensiun (P2)

Sebagai **Operation**, saya dapat mencatat pensiun karyawan sehingga berakhirnya masa kerja karena usia terdokumentasi.

1. **Given** karyawan aktif, **When** Operation mencatat pensiun (tanggal efektif), **Then** kontrak aktif diakhiri (`end_reason = retirement`), status karyawan → `retired`, akun (termasuk Entra — FR-46) dinonaktifkan.
2. **Given** karyawan mendekati usia pensiun, **When** dashboard Operation dibuka, **Then** tampil indikator karyawan yang memasuki jendela pra-pensiun (usia pensiun 56 tahun, parametri; jendela peringatan H-90/H-30).

### US14 — Operation memprovision akun Entra talent (P1)

Sebagai **Operation**, saya dapat memilih pembuatan otomatis akun Microsoft Entra saat menambah karyawan dan membuatkan akun bagi talent yang belum memilikinya dari daftar khusus sehingga setiap talent memiliki akses akun yang tepat.

1. **Given** Operation menambah karyawan baru, **When** form diisi dengan pilihan **auto-create Entra** (default: aktif, dapat dimatikan per karyawan), **Then** provisioning dipicu saat data tersimpan.
2. **Given** pilihan auto tidak dipilih atau provisioning gagal, **When** Operation membuka UI daftar "belum ada Entra", **Then** talent tsb. tampil dan dapat dibuatkan akunnya dari fitur tersebut (termasuk provisioning ulang).
3. **Given** email karyawan berdomain `telkom.co.id`, **When** provisioning dijalankan, **Then** sistem mengirim **Entra invitation** (bukan create account); **Given** domain lain, **Then** sistem **create account** dengan UPN `nama-depan.nama-belakang@digitaltelkom.id` (sufiks angka bila bentrok).
4. **Given** talent terminasi (resign/pensiun), **When** status berubah, **Then** sistem menonaktifkan akun Entra yang dikelolanya (FR-46) dan mencatatnya di jejak audit.

## 4. FR Baru (berlanjut dari FR-32)

- **FR-33**: `employees` hanya menyimpan data diri: nama lengkap, **nomor KTP (NIK — unik, wajib, terenkripsi)**, email, tanggal lahir, jenis kelamin, telepon, alamat, pendidikan terakhir, nama institusi, jurusan, status kepegawaian (`active/resigned/retired/inactive`), tanggal masuk pertama. *(Memodifikasi FR-01; employee ID tidak lagi disimpan di `employees` — keputusan 2026-10-08.)*
- **FR-34**: Sistem menyediakan pengelolaan kontrak kerja terpisah per karyawan dengan atribut selaras TMS: nomor kontrak, jenis (`pkwt/pkwtt`), **email kantor, nomor induk karyawan, band_position, jobRole (Master Data Role), jobTitle, jobLevel, work location**, unit (Master Data Unit), tanggal mulai–selesai, status, alasan berakhir, keterkaitan perpanjangan. Nomor induk karyawan wajib diisi per kontrak dan unik antar kontrak aktif. Maksimal satu kontrak aktif per karyawan; validasi ditolak di server bila periode bertumpang tindih.
- **FR-35**: Unit dan posisi aktif karyawan **diturunkan dari kontrak aktif** — bukan kolom pada `employees`. Seluruh turunan FR-23 (chapter talent, keter-assign-an, cakupan Chapter) mengacu `kontrak aktif → jobRole → chapter pemilik`. *(Memodifikasi FR-01, FR-23.)*
- **FR-36**: Perpanjangan kontrak menghasilkan kontrak baru yang dimulai setelah kontrak lama berakhir dan terkait ke kontrak sebelumnya; riwayat kontrak lama tetap tersimpan. Perpanjangan dapat menyertakan perpindahan unit/posisi yang efektif pada kontrak baru. *(Implikasi: US4/CV "pengalaman kerja" tetap dari riwayat assignment — tidak berubah.)*
- **FR-37**: Resign mengakhiri kontrak aktif pada tanggal efektif, mengubah status karyawan menjadi `resigned`, dan menonaktifkan akun user terkait; dependensi (assignment aktif/IDP berjalan) diperingatkan sebelum konfirmasi.
- **FR-38**: Mutasi mengubah unit/posisi karyawan di tengah kontrak dengan mekanisme kontrak baru yang efektif pada tanggal mutasi (kontrak lama diakhiri `end_reason = mutation`); turunan chapter/keter-assign-an mengikuti posisi baru sejak tanggal efektif.
- **FR-39**: Pensiun mengakhiri kontrak aktif, mengubah status karyawan menjadi `retired`, dan menonaktifkan akun user terkait.
- **FR-40**: Dashboard Operation menampilkan indikator kontrak segera berakhir (jendela H-90/H-30) dan karyawan pra-pensiun; tidak ada notifikasi email (tetap out of scope). *(Memperluas FR-29/US8 skenario 3.)*
- **FR-41**: Setiap **pembuatan, perubahan, dan pengakhiran** data karyawan maupun kontrak — termasuk **perpanjangan kontrak**, resign, mutasi, pensiun — **tercatat pada jejak audit** (aktor, waktu, jenis aksi, nilai sebelum→sesudah) dan **dapat ditelusuri** per karyawan/kontrak. Riwayat perubahan ditampilkan pada detail karyawan/kontrak untuk Operation; jejak audit penuh tetap milik Admin (memperluas FR-17). Hard delete karyawan tidak disediakan (selaras semantik aplikasi eksisting) — pengakhiran dicatat sebagai aksi yang berlog.
- **FR-42**: Nomor KTP disimpan **terenkripsi at-rest**; pada daftar dan detail hanya ditampilkan **tersamar** (4 digit akhir); nilai penuh hanya melalui tampilan khusus berizin. Jejak audit menyimpan NIK dalam bentuk tersamar, tidak pernah plaintext.
- **FR-43**: Form penambahan karyawan menyediakan pilihan **auto-create akun Microsoft Entra**. Bila dipilih, sistem memicu pembuatan akun Entra saat data karyawan tersimpan; bila tidak, karyawan tersimpan tanpa akun Entra dan dapat dibuatkan kemudian. Karyawan yang sudah memiliki akun Entra terlink tidak diprovisi ulang. Default pilihan: **aktif**, dapat dimatikan per karyawan.
- **FR-44**: Sistem menyediakan UI khusus bagi Operation yang menampilkan seluruh talent yang belum memiliki akun Entra, dengan fitur untuk membuatkan akun Entra dari daftar tersebut (termasuk provisioning ulang atas kegagalan sebelumnya).
- **FR-45**: Pembuatan akun Entra mengikuti domain email karyawan (email pada data diri): domain `telkom.co.id` → dikirim **Entra invitation** (bukan create account Entra); selain `telkom.co.id` → **create account** di Entra dengan UPN berformat **`nama-depan.nama-belakang@digitaltelkom.id`** (dengan titik); bila nama depan + nama belakang identik dengan akun yang sudah ada, ditambahkan angka di belakang nama belakang (mis. `budi.santoso2@digitaltelkom.id`). Hasil provisioning (jenis aksi dan status berhasil/gagal) tercatat dan terlihat pada daftar FR-44.
- **FR-46**: Saat talent **terminasi — resign (FR-37) atau pensiun (FR-39)** — sistem **menonaktifkan akun Microsoft Entra** yang dikelolanya pada saat status berubah; penonaktifan tercatat pada jejak audit.

## 5. Dampak pada Artifact Eksisting

| Artifact | Dampak |
| --- | --- |
| `spec.md` FR-01/FR-04/FR-16/FR-23/FR-29 | revisi rumusan: unit/posisi via kontrak aktif; kandidat talent = kontrak aktif |
| `spec.md` US1–US8 | skenario yang menyebut "divisi/posisi" karyawan menyesuaikan sumber kebenaran baru |
| `data-model.md` §3.3 | `employees` dipangkas (+ kolom `nik` terenkripsi); tabel `employment_contracts` + indeks baru; view `employee_chapter_scope` diperbarui (join via kontrak aktif) |
| `contracts/schema.graphql` | tipe Employee (+nik, masking) & EmploymentContract baru + input/mutation lifecycle |
| Audit (FR-17) | diperluas FR-41: siklus hidup kontrak & kejadian resign/mutasi/pensiun/pengakhiran masuk cakupan audit; riwayat tampil per record |
| Keamanan (baru) | enkripsi at-rest + masking NIK (FR-42) — kebijakan cipher & key management mengikuti keputusan teknis implementasi |
| Identitas (baru) | integrasi Microsoft Entra (invitation vs create per domain email; UPN; disable saat terminasi) — FR-43–FR-46 |
| Karyawan nonaktif (edge case) | diperluas: resign/pensiun otomatis menonaktifkan akun (sudah selaras) |

## 6. Keputusan Final (disahkan pemilik produk, 2026-10-07)

| OQ | Keputusan final |
| --- | --- |
| 1. Mutasi di tengah kontrak | **Opsi B** — kontrak aktif diakhiri (`end_reason = mutation`) + kontrak baru efektif tanggal mutasi. Riwayat utuh per SK, selaras TMS, setiap perubahan otomatis berlog. |
| 2. Jenis kontrak | **PKWT dan PKWTT keduanya dicatat**; perpanjangan hanya relevan untuk PKWT. |
| 3. Kontrak habis tanpa perpanjangan | Otomatis **non-assignable** (turunan tanggal); status karyawan tetap `active` menunggu keputusan; tampil di daftar "perlu tindak lanjut"; setiap tindak lanjutan Operation tercatat log. |
| 4. Aktor | Seluruh alur kontrak & siklus kerja milik **Operation**; Operation melihat riwayat perubahan pada record; jejak audit penuh tetap Admin. |
| 5. Field data diri & parameter | Data diri: tanggal lahir, jenis kelamin, telepon, alamat **+ nomor KTP**. Parameter: usia pensiun **56 tahun** (parametri) & jendela peringatan **H-90/H-30**. |
| 6. Entra lifecycle | Akun Entra dibuat saat talent dibuat (auto, dapat dimatikan) dan **dinonaktifkan saat resign/pensiun** (FR-46). `telkom.co.id` → invitation; domain lain → create account. |
| 7. Format UPN | **`nama-depan.nama-belakang@digitaltelkom.id`** (dengan titik); nama depan + belakang identik dengan akun eksisting → angka ditambahkan di belakang nama belakang (mis. `budi.santoso2@digitaltelkom.id`). |
| 8. Identitas kepegawaian (2026-10-08) | **`employee_code` disimpan di tabel kontrak saja** (`employment_contracts.nomor_induk`) — tabel `employees` khusus data diri talent. Nomor induk wajib diisi Operation per kontrak, unik antar kontrak aktif, dan menjadi snapshot historis per kontrak. |
| 9. Field data diri talent (2026-10-09) | **`latest_education`** (pendidikan terakhir), **`institution_name`** (nama institusi), **`major`** (jurusan) ditambahkan ke tabel `employees` — field opsional (nullable text). |

Catatan arahan yang juga sudah diakomodasi: (1) keselarasan TMS → pemetaan atribut pada §2.2; (2) enkripsi → FR-42; (3) log telusur → FR-41; (4) tanpa hard delete karyawan — "delete" dipetakan ke pengakhiran/nonaktif yang tetap terlog (disetujui); (5) `work_location` isian terstruktur pada kontrak, bukan master data baru (disetujui); (6) `employee_code` → `nomor_induk` kontrak, tabel `employees` murni data diri (keputusan 2026-10-08).

## 7. Out of Scope

- Integrasi HRIS/payroll, dokumen digital tanda tangan (e-sign), upload file SK sebagai syarat validasi.
- Notifikasi email/reminder otomatis — indikator disajikan di dashboard/daftar.
- Perhitungan kompensasi/kenaikan gaji akibat perpanjangan atau mutasi.
- Master Data Work Location terpisah — `work_location` cukup isian terstruktur pada kontrak; promosi ke master data dapat menyusul bila dibutuhkan konsistensi.
- Integrasi langsung dengan TMS — atribut TMS dipetakan sebagai struktur data, bukan integrasi sistem.

## 8. Status Keputusan

Seluruh butir konfirmasi (ratifikasi OQ 1–5, pemetaan "delete" → pengakhiran berlog, `work_location` terstruktur, lifecycle Entra (A), format UPN dengan titik + sufiks angka) telah **disahkan pemilik produk pada 2026-10-07** dan diterapkan pada `spec.md` + `data-model.md`.

## 9. Eksekusi

1. ✅ Keputusan §6 diterapkan ke `spec.md` + `data-model.md` (commit `c3d3498`, `74650e2`, `27d489c`, dan commit finalisasi dokumen ini). *(Catatan 2026-10-08: commit-commit tersebut tidak lagi terlacak di repo — dokumen direstorasi dari lampiran TAN-98, lihat revisi di header.)*
2. ✅ Dokumen amandemen ini disimpan sebagai `specs/spec-pengelolaan-talent.md` (nama final 2026-10-08; sebelumnya `specs/002-pengelolaan-talent.md`).
3. ✅ Pecahan implementasi: **6 sub-issues** di bawah TAN-98 (backend skema & migrasi → API siklus → frontend data diri/kontrak & alur/dashboard, provisi Entra → penampil jejak audit), masing-masing 1–2 hari kerja, tersusun per stage; penugasan member menyusul konfirmasi pemilik produk.
