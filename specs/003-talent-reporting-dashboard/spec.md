# Feature Specification: Dashboard Laporan Talent

**Feature Branch**: `003-talent-reporting-dashboard` *(dinomori ulang dari `002-...` — nomor 002 telah terpakai oleh amandemen pengelolaan talent, TAN-98)*
**Created**: 2026-10-09
**Revisi**: 2026-10-09 (analyze/alignment TAN-98) — Sumber data laporan dialihkan seluruhnya ke model **kontrak kerja terpisah** dari Amandemen Spesifikasi 002 (`specs/002-pengelolaan-talent.md`, TAN-98, status FINAL): distribusi role/lokasi kerja diturunkan dari kontrak berjalan, churn & new talent dihitung dari kejadian kontrak dengan alasan berakhir, US1 lama (pelengkapan data) dihapus karena sudah di-cover TAN-98, dan CL-1/CL-2 dinyatakan tuntas.
**Revisi**: 2026-10-09 (clarify) — **A-1 s.d. A-4 disahkan pemilik produk.** CL-3 tuntas: distribusi usia ditetapkan sebagai **distribusi generasi** (Baby Boomer / Generasi X / Milenial / Generasi Z) berdasarkan tahun lahir, menggantikan bucket angka usia.
**Revisi**: 2026-10-09 (clarify 2) — Rekomendasi **bentuk grafik** disahkan pemilik produk: bagian **Bentuk Visual** ditambahkan dan menjadi acuan FR-16.
**Revisi**: 2026-10-19 (amandemen populasi Operation — keputusan pemilik produk, remediasi dashboard) — Populasi laporan untuk **Operation menjadi org-wide**: seluruh karyawan dengan kontrak berjalan, **termasuk** yang job role-nya tidak dimiliki chapter mana pun — tanpa bucket/kategori "Tanpa chapter" maupun istilah internal "non-assignable" di UI; FR-03 dan asumsi "Talent" direvisi. Untuk **Chapter**, cakupan tetap talent kontrak-berjalan milik chapter-nya (syarat kepemilikan chapter tetap berlaku bersama parameter cakupan chapter). Efek samping positif: populasi Snapshot, Churn, dan NewTalent kini konsisten untuk kedua peran. Sumber keputusan: diskusi PM 2026-10-19 (remediasi dashboard Operation & Chapter) + prototype dashboard v2.
**Status**: Clarified — seluruh butir klarifikasi tuntas; siap masuk fase `/speckit.plan` setelah persetujuan pemilik produk
**Referensi**:
- `specs/001-employee-digital-talent-management/spec.md` (TAN-64) — RBAC empat peran, profil CV, dan kerangka cakupan chapter.
- `specs/002-pengelolaan-talent.md` (TAN-98, FINAL) — **sumber model data mutakhir**: `employees` data diri (FR-33), `employment_contracts` (FR-34), turunan unit/posisi/lokasi kerja dari kontrak aktif (FR-35), perpanjangan/resign/mutasi/pensiun (FR-36–FR-39).
**Input**: /speckit.specify Perlu ada dashboard laporan menampilkan data berikut: jumlah Talent berdasarkan role; jumlah Talent berdasarkan usia; jumlah Talent berdasarkan jenjang pendidikan; jumlah Talent berdasarkan lokasi kerja; jumlah Talent yang churn berdasarkan akhir kontrak dan new talent yang baru masuk berdasarkan tanggal mulai kontrak. Gambar grafik dapat diunduh dalam bentuk PNG. Scope User: Ops & Chapters. Filter waktu berdasarkan bulan dan tahun (range dari bulan pertama tahun paling belakang sampai bulan terakhir tahun berjalan).

## Ringkasan

Halaman **Dashboard Laporan Talent** pada aplikasi Employee (Digital Talent) Management yang menampilkan lima visual agregat: distribusi talent berdasarkan role, generasi usia, jenjang pendidikan, dan lokasi kerja, serta tren bulanan churn (talent berhenti) vs new talent (talent baru masuk). Halaman hanya dapat diakses peran Operation (seluruh talent) dan Chapter (talent dalam tanggung jawab chapter-nya, diturunkan via kontrak aktif → jobRole → chapter pemilik — FR-35 TAN-98). Laporan **tidak memperkenalkan field maupun entitas data baru**: seluruh metrik diturunkan dari `employment_contracts` (role, lokasi kerja, kejadian masuk/keluar), `employees.birth_date` (generasi usia), dan profil CV (pendidikan). Semua visual tunduk pada satu filter rentang bulan–tahun yang pilihannya membentang dari Januari tahun ter earliest yang memiliki data sampai Desember tahun berjalan, dan setiap grafik dapat diunduh sebagai gambar PNG. Laporan sepenuhnya merupakan tampilan agregat turunan — tidak menyimpan data baru dan tidak mengubah modul apa pun pada spek 001 maupun amandemen TAN-98.

## Keputusan Alignment dengan TAN-98 *(disahkan pemilik produk, 2026-10-09)*

- **A-1 — Churn tidak termasuk mutasi.** Churn = kontrak berakhir yang mengakhiri masa kerja talent: `end_reason = resign`, `end_reason = retirement`, atau `expiry` (habis masa) **tanpa kontrak lanjutan**. Kontrak yang diakhiri karena **mutasi** (`end_reason = mutation`) tidak dihitung churn — talent tetap berada di perusahaan, hanya berpindah unit/posisi; ia berhenti terhitung pada cakupan chapter lama dan mulai terhitung pada chapter baru sejak tanggal efektif mutasi. Kontrak yang berakhir lalu **diperpanjang** juga bukan churn.
- **A-2 — New talent = kontrak pertama.** Talent dihitung sebagai "baru masuk" pada bulan dimulainya **kontrak pertamanya** (tanpa `predecessor_contract_id`), selaras `joined_at` = mulai kontrak pertama (FR-33 TAN-98). Perpanjangan dan kontrak hasil mutasi bukan new talent.
- **A-3 — Keaktifan snapshot = kontrak berjalan.** Talent dihitung pada distribusi untuk tanggal T hanya bila memiliki **kontrak berjalan pada T** (mulai ≤ T, selesai kosong atau ≥ T). Talent dengan kontrak PKWT habis tanpa perpanjangan (status menunggu keputusan Operation, OQ-3 TAN-98 — otomatis non-assignable) tidak dihitung sampai diperpanjang.
- **A-4 — Penomoran branch.** Spek ini bernomor `003-talent-reporting-dashboard` karena `002-pengelolaan-talent` telah dipakai amandemen TAN-98.

## Keputusan Klarifikasi (CL-3, disahkan 2026-10-09)

- **CL-1 — Definisi churn & perpanjangan kontrak**: TUNTAS melalui TAN-98 (perpanjangan = kontrak baru dengan `predecessor_contract_id`; riwayat utuh) + A-1.
- **CL-2 — Bentuk data lokasi kerja**: TUNTAS melalui TAN-98 — `work_location` isian terstruktur pada kontrak, bukan master data baru.
- **CL-3 — Distribusi usia = distribusi generasi.** Sesuai arahan manajemen, grafik kedua menampilkan distribusi talent per **generasi usia** — bukan bucket angka usia. Klasifikasi mengikuti tahun lahir (mengacu batas generasi Pew Research, bersifat **parametrik** — dapat disesuaikan tanpa perubahan kode, selaras pola parameter usia pensiun pada TAN-98):
  - **Baby Boomer** — tahun lahir ≤ 1964
  - **Generasi X** — 1965–1980
  - **Milenial (Generasi Y)** — 1981–1996
  - **Generasi Z** — ≥ 1997

  Klasifikasi berbasis **tahun lahir** (bukan umur pada tanggal snapshot) sehingga generasi seorang talent tetap dan tidak berubah antar periode; seluruh rentang tahun lahir tercakup tanpa celah, sehingga tidak ada kategori "di luar klasifikasi".

## Bentuk Visual (disahkan pemilik produk, 2026-10-09)

| # | Visual | Bentuk | Aturan tampil |
| --- | --- | --- | --- |
| V-1 | Talent per role | Bar mendatar | Urut dari nilai terbesar |
| V-2 | Talent per generasi | Kolom vertikal | Urut Baby Boomer → Generasi X → Milenial → Generasi Z (urutan intrinsik, bukan nilai) |
| V-3 | Talent per jenjang pendidikan | Kolom vertikal | Urut SMA/SMK → D3 → S1 → S2 → S3 |
| V-4 | Talent per lokasi kerja | Bar mendatar | Urut dari nilai terbesar; bila >10 lokasi → Top 10 + kategori "Lainnya" |
| V-5 | Tren churn vs new talent | Line chart dua seri | Sumbu bulan mengikuti rentang terpilih; bulan tanpa kejadian bernilai nol. Untuk rentang ≤12 bulan, alternatif yang disetujui: bar berkelompok atau bar divergen (new talent di atas nol, churn di bawah nol); line tetap default |

**Aturan lintas-grafik:**

- Kategori tak berurut (role, lokasi kerja) diurutkan dari nilai terbesar; kategori ordinal (generasi, jenjang pendidikan) mengikuti urutan intrinsiknya.
- Kategori **"belum diisi" selalu ditempatkan paling akhir dengan warna abu-abu** — berbeda visual dari data sah, sehingga kelengkapan data ikut terpantau.
- Setiap grafik mencantumkan **total (n = …)** pada subjudul.
- Semantika warna konsisten di seluruh laporan: warna netral untuk distribusi, **hijau untuk new talent, merah untuk churn**.
- Pie/donut bukan pilihan utama; donut dapat dipertimbangkan untuk grafik role hanya bila jumlah role ≤5 dan penekanan pada porsi komposisi.

## User Scenarios & Testing

### User Story 1 — Melihat distribusi talent (role, generasi usia, pendidikan, lokasi kerja) (Priority: P1)

Sebagai **Operation** atau **Chapter**, saya dapat melihat distribusi jumlah talent berdasarkan role, generasi usia, jenjang pendidikan, dan lokasi kerja sehingga komposisi talent terpantau tanpa rekap manual.

**Acceptance Scenarios:**

1. **Given** Operation login, **When** membuka halaman Laporan Talent, **Then** tampil empat grafik distribusi yang menghitung seluruh talent sesuai definisi unit hitung (FR-03).
2. **Given** Chapter login, **When** membuka halaman yang sama, **Then** keempat grafik hanya menghitung talent dalam tanggung jawab chapter-nya (turunan kontrak aktif → jobRole → chapter pemilik, FR-35 TAN-98).
3. **Given** sebagian talent belum mengisi pendidikan pada profil CV atau kontraknya tidak mencantumkan lokasi kerja, **When** grafik terkait dirender, **Then** talent tersebut masuk kategori "belum diisi" — tidak hilang dari total.
4. **Given** talent melakukan mutasi unit/posisi di tengah periode, **When** distribusi dihitung pada tanggal setelah mutasi efektif, **Then** talent terhitung pada role, lokasi kerja, dan chapter barunya (dari kontrak hasil mutasi).
5. **Given** dua talent lahir pada tahun 1990 dan 1972, **When** grafik generasi dirender untuk periode berapa pun, **Then** keduanya terhitung konsisten pada Milenial dan Generasi X (klasifikasi tahun lahir, tidak berubah antar periode).
6. **Given** Talent atau Admin mencoba mengakses halaman laporan, **When** permintaan dikirim, **Then** akses ditolak di sisi server.
7. **Given** filter waktu terpilih, **When** grafik distribusi dirender, **Then** angka mengikuti semantika snapshot FR-04.

### User Story 2 — Melihat tren churn & new talent per bulan (Priority: P1)

Sebagai **Operation** atau **Chapter**, saya dapat melihat jumlah talent yang berhenti (churn) dan talent baru yang masuk per bulan sehingga pergerakan masuk–keluar talent terpantau dari waktu ke waktu.

**Acceptance Scenarios:**

1. **Given** rentang waktu terpilih, **When** grafik tren dirender, **Then** tampil satu grafik dua seri: jumlah churn dan jumlah new talent untuk setiap bulan dalam rentang tersebut.
2. **Given** seorang talent mengundurkan diri (resign) dengan tanggal efektif pada bulan M, **When** laporan dihitung, **Then** talent dihitung churn bulan M.
3. **Given** seorang talent pensiun pada bulan M, **When** laporan dihitung, **Then** talent dihitung churn bulan M.
4. **Given** kontrak PKWT seorang talent berakhir pada bulan M dan tidak diperpanjang, **When** laporan dihitung, **Then** talent dihitung churn bulan M.
5. **Given** kontrak PKWT seorang talent berakhir pada bulan M dan diperpanjang (kontrak baru mulai setelahnya), **When** laporan dihitung, **Then** talent tidak dihitung churn bulan M.
6. **Given** seorang talent bermutasi unit/posisi pada bulan M (kontrak lama diakhiri `mutation` + kontrak baru), **When** laporan dihitung, **Then** talent tidak dihitung churn maupun new talent bulan M.
7. **Given** seorang talent memulai kontrak pertamanya pada bulan M, **When** laporan dihitung, **Then** talent dihitung new talent bulan M; perpanjangan dan kontrak mutasi tidak dihitung new talent.
8. **Given** Chapter login, **When** melihat grafik tren, **Then** hanya kejadian (churn/new) talent dalam cakupan chapter-nya yang dihitung, mengikuti turunan chapter pada masing-masing kontrak.
9. **Given** suatu bulan dalam rentang tidak memiliki churn maupun new talent, **When** grafik dirender, **Then** bulan tersebut tetap tampil dengan nilai nol (bukan dilewati).

### User Story 3 — Filter rentang waktu bulan & tahun (Priority: P1)

Sebagai pengguna laporan, saya dapat memilih rentang bulan dan tahun sehingga laporan menampilkan periode yang saya butuhkan.

**Acceptance Scenarios:**

1. **Given** halaman laporan dibuka, **When** filter waktu dimuat, **Then** rentang yang dapat dipilih membentang dari bulan pertama (Januari) tahun ter earliest yang memiliki data (kontrak pertama ter earliest / `joined_at` ter earliest) sampai bulan terakhir (Desember) tahun berjalan.
2. **Given** belum ada pilihan eksplisit, **When** halaman dimuat, **Then** digunakan nilai default berupa keseluruhan rentang yang tersedia.
3. **Given** rentang dipilih dan diterapkan, **When** laporan dihitung ulang, **Then** kelima grafik diperbarui konsisten terhadap periode yang sama dalam satu aksi.
4. **Given** rentang terpilih memuat bulan tanpa data, **When** grafik dirender, **Then** bulan-bulan tersebut tetap menjadi bagian tren dengan nilai nol, dan distribusi mengikuti semantika snapshot FR-04.

### User Story 4 — Mengunduh grafik sebagai PNG (Priority: P2)

Sebagai pengguna laporan, saya dapat mengunduh setiap grafik sebagai gambar PNG sehingga hasilnya dapat dilampirkan pada laporan atau presentasi.

**Acceptance Scenarios:**

1. **Given** sebuah grafik tampil, **When** menekan tombol unduh pada grafik tersebut, **Then** file PNG terunduh dan mereproduksi grafik yang tampil secara identik (data, kategori, label, judul, dan rentang waktu terpilih).
2. **Given** unduhan terjadi, **Then** nama file bersifat deskriptif dan memuat nama grafik beserta rentang waktu terpilih (mis. `talent-per-role-2025-01-2026-10.png`).
3. **Given** lima grafik tampil, **When** mengunduh, **Then** masing-masing grafik dapat diunduh secara terpisah satu per satu.

## Edge Cases

- Talent dengan kontrak PKWT habis tanpa perpanjangan (menunggu keputusan Operation, OQ-3) → tidak dihitung pada distribusi dan tren selama belum ada kontrak lanjutan; muncul kembali otomatis setelah diperpanjang.
- Mutasi di tengah periode → talent berpindah kategori role/lokasi/chapter sejak tanggal efektif mutasi, dan tidak dihitung churn maupun new talent (A-1, A-2).
- Resign/pensiun dengan tanggal efektif mundur (backdated) → kejadian dihitung pada bulan tanggal efektif kontrak berakhir, bukan bulan pencatatan.
- Tahun lahir di luar batas generasi yang lazim (mis. lahir sebelum 1946) → tetap terklasifikasi karena Baby Boomer menampung ≤ 1964 dan Generasi Z menampung ≥ 1997; tidak ada talent yang gugur dari klasifikasi.
- Talent tanpa data pendidikan pada CV atau tanpa `work_location` pada kontraknya → masuk kategori "belum diisi" pada grafik terkait, tetap terhitung dalam total.
- Karyawan tanpa kontrak berjalan atau berstatus `resigned/retired/inactive` → tidak masuk seluruh visual laporan (FR-03). Karyawan dengan Role tanpa chapter: pada cakupan **Operation** tetap dihitung dan tampil sebagai baris role biasa — tanpa bucket/kategori "Tanpa chapter" maupun label "non-assignable"; pada cakupan **Chapter** tidak dihitung karena syarat kepemilikan chapter tetap berlaku (FR-03, amandemen 2026-10-19).
- Seluruh data kosong pada periode terpilih → tampil keadaan kosong yang jelas dengan petunjuk memilih rentang lain, bukan error.
- Chapter dengan talent sangat sedikit (1–2 orang) → grafik tetap tampil; catatan privasi agregat lihat NFR.
- Kontrak PKWTT tanpa tanggal akhir → berjalan terus sampai diakhiri melalui resign/pensiun/mutasi; tidak pernah dihitung churn karena `expiry`.

## Requirements

### Functional Requirements

**Akses & cakupan**

- **FR-01**: Sistem harus menyediakan halaman Dashboard Laporan Talent yang hanya dapat diakses peran Operation dan Chapter. Operation melihat seluruh talent; Chapter hanya talent dalam tanggung jawab chapter-nya sesuai turunan FR-35 TAN-98 (kontrak aktif → jobRole → chapter pemilik). Peran lain (Admin, Talent) ditolak di sisi server.
- **FR-02**: Laporan harus menurunkan seluruh atribut dari model data eksisting tanpa menambah field/entitas baru: role dan lokasi kerja dari `employment_contracts` (FR-34/FR-35 TAN-98), generasi usia dari `employees.birth_date` (FR-33 TAN-98), jenjang pendidikan dari profil CV (FR-12 spek 001), dan kejadian masuk/keluar dari siklus kontrak (FR-36–FR-39 TAN-98).
- **FR-03**: Definisi unit hitung: **Talent** = karyawan dengan kontrak berjalan pada tanggal snapshot. Untuk **Operation**, seluruh karyawan kontrak-berjalan dihitung — **termasuk yang `job_role`-nya tidak dimiliki chapter mana pun** (amandemen 2026-10-19); untuk **Chapter**, hanya yang `job_role`-nya dimiliki chapter tanggung jawabnya (syarat kepemilikan chapter tetap berlaku bersama parameter cakupan — selaras FR-23 spek 001 sebagaimana diubah FR-35 TAN-98). Karyawan tanpa kontrak berjalan atau berstatus `resigned/retired/inactive` tidak dihitung. Tidak ada kategori/bucket khusus "Tanpa chapter" — role tanpa chapter tampil sebagai baris biasa pada distribusi role.
- **FR-04**: Semantika periode: distribusi dihitung terhadap tanggal **akhir bulan terakhir dalam rentang terpilih** (snapshot); talent dihitung bila memiliki kontrak berjalan pada tanggal tersebut. Tren churn/new dihitung dari kejadian per bulan dalam rentang terpilih.

**Distribusi talent**

- **FR-05**: Sistem harus menampilkan distribusi jumlah talent berdasarkan **role** — `job_role_id` pada kontrak berjalan (Master Data Role spek 001) — dengan label jumlah per kategori.
- **FR-06**: Sistem harus menampilkan distribusi jumlah talent berdasarkan **generasi usia**, diklasifikasikan dari **tahun lahir** pada `employees.birth_date` dengan batas parametrik: Baby Boomer (≤1964), Generasi X (1965–1980), Milenial (1981–1996), Generasi Z (≥1997). Klasifikasi tidak bergantung pada tanggal snapshot; batas tahun dapat disesuaikan sebagai parameter konfigurasi tanpa perubahan kode.
- **FR-07**: Sistem harus menampilkan distribusi jumlah talent berdasarkan **jenjang pendidikan tertinggi** dari data pendidikan pada profil CV talent (SMA/SMK, D3, S1, S2, S3); talent tanpa data pendidikan masuk kategori "belum diisi".
- **FR-08**: Sistem harus menampilkan distribusi jumlah talent berdasarkan **lokasi kerja** (`work_location` pada kontrak berjalan — isian terstruktur selaras TMS, bukan master data); talent tanpa lokasi kerja pada kontraknya masuk kategori "belum diisi".

**Tren churn & new talent**

- **FR-09**: Sistem harus menampilkan tren bulanan dua seri untuk setiap bulan dalam rentang terpilih, dengan definisi: **churn** = kontrak berakhir pada bulan tersebut dengan `end_reason = resign`, `end_reason = retirement`, atau `expiry` tanpa kontrak lanjutan (A-1); **new talent** = kontrak pertama karyawan dimulai pada bulan tersebut (A-2). Bulan tanpa kejadian tampil bernilai nol.
- **FR-10**: Kontrak yang diakhiri karena **mutasi** (`end_reason = mutation`) dan kontrak yang berakhir namun **diperpanjang** tidak boleh dihitung sebagai churn; kontrak perpanjangan dan kontrak hasil mutasi tidak boleh dihitung sebagai new talent.

**Filter waktu**

- **FR-11**: Sistem harus menyediakan filter rentang bulan–tahun dengan batas bawah = Januari tahun ter earliest yang memiliki data (kontrak pertama/`joined_at` ter earliest) dan batas atas = Desember tahun berjalan; nilai default = keseluruhan rentang.
- **FR-12**: Penerapan filter harus memperbarui kelima visual secara konsisten terhadap periode yang sama dalam satu aksi.

**Ekspor PNG**

- **FR-13**: Setiap grafik harus dapat diunduh sebagai gambar PNG yang mereproduksi persis grafik yang tampil — data, kategori, label, judul, dan rentang waktu terpilih.
- **FR-14**: Nama file unduhan harus deskriptif dan memuat nama grafik serta rentang terpilih (pola: `<nama-grafik>-<mulai>-<akhir>.png`).

**Konsistensi**

- **FR-15**: Angka laporan harus konsisten dengan data terbaru tanpa langkah sinkronisasi manual (selaras FR-30 spek 001); laporan adalah tampilan agregat turunan dan tidak menyimpan data baru.

**Bentuk visual**

- **FR-16**: Kelima visual harus ditampilkan sesuai bagian **Bentuk Visual** (disahkan 2026-10-09) — mencakup orientasi grafik, urutan kategori, perlakuan kategori "belum diisi" dan "Lainnya", total (n = …) pada subjudul, serta semantika warna.

### Non-Functional Requirements

- Aplikasi berbasis web, desktop-first dan responsif, antarmuka berbahasa Indonesia (selaras spek 001).
- Laporan hanya menampilkan **agregat jumlah** — tidak mengungkap identitas maupun data individual talent, dan **tidak pernah menampilkan NIK** (selaras FR-42 TAN-98); kontrol akses peran ditegakkan di server. Untuk kategori berjumlah sangat kecil (mis. 1–2 talent dalam satu chapter), penyamaran kategori dievaluasi pada fase `/speckit.plan` demi mencegah de-anonimisasi.
- Agregasi dihitung server-side dan tetap responsif hingga ±5.000 karyawan (selaras NFR spek 001).
- PNG hasil unduhan beresolusi minimal 2× ukuran tampil agar layak dicetak/ditempel pada slide.

### Key Entities

- **EmploymentContract** (TAN-98, FR-34): sumber utama laporan — jobRole (role), work_location (lokasi kerja), periode (kejadian churn/new), `end_reason`, dan `predecessor_contract_id` (pembeda perpanjangan/mutasi dari kejadian keluar-masuk).
- **Employee** (TAN-98, FR-33): sumber tahun lahir (`birth_date`, wajib — dasar klasifikasi generasi) dan status kepegawaian; laporan tidak menambah field apa pun.
- **CVProfile** (spek 001, FR-12): sumber jenjang pendidikan tertinggi.
- **TalentReport (Dashboard Laporan Talent)**: tampilan agregat turunan penuh — tidak menyimpan data baru; cakupannya mengikuti peran (Operation: semua; Chapter: turunan kontrak aktif → jobRole → chapter pemilik).
- **Definisi generasi & kategori pendidikan**: konfigurasi tampilan laporan (bukan data tersimpan).

## Success Criteria

- **SC-01**: Operation/Chapter membuka halaman laporan dan melihat kelima visual terisi dari data eksisting tanpa menyusun rekap manual.
- **SC-02**: Angka laporan konsisten dengan data kontrak, data diri, dan profil CV terbaru pada 100% kasus uji, tanpa langkah sinkronisasi.
- **SC-03**: File PNG hasil unduhan mereproduksi grafik yang tampil secara identik pada 100% kasus uji, dengan resolusi minimal 2× tampilan.
- **SC-04**: Satu perubahan filter rentang memperbarui kelima grafik sekaligus (tanpa mengatur ulang per grafik) pada 100% kasus uji.
- **SC-05**: Chapter tidak pernah melihat angka talent di luar tanggung jawab chapter-nya (100% isolasi cakupan pada kasus uji).
- **SC-06**: Pada 100% kasus uji: resign/pensiun/kontrak habis tanpa perpanjangan terhitung churn pada bulan tanggal efektifnya; mutasi dan perpanjangan tidak terhitung churn maupun new talent; kontrak pertama terhitung new talent pada bulan mulainya.
- **SC-07**: Setiap talent terklasifikasi pada tepat satu generasi berdasarkan tahun lahirnya pada 100% kasus uji (tidak ada talent tanpa klasifikasi generasi).

## Assumptions

- Model data mengikuti Amandemen Spesifikasi 002 (TAN-98, FINAL): kontrak kerja terpisah dari data diri, maksimal satu kontrak aktif per karyawan, kontrak berakhir otomatis turunan tanggal, turunan chapter via kontrak aktif.
- "Talent" pada laporan mengikuti FR-03 (amandemen 2026-10-19): Operation menghitung **seluruh** karyawan kontrak-berjalan (termasuk Role tanpa chapter, tampil sebagai baris role biasa); Chapter menghitung talent kontrak-berjalan milik chapter-nya. Kategori terpisah "Tanpa chapter" **tidak digunakan** — keputusan pemilik produk: istilah internal tidak ditampilkan di UI.
- Batas generasi mengacu klasifikasi Pew Research (Baby Boomer ≤1964, Gen X 1965–1980, Milenial 1981–1996, Gen Z ≥1997) sebagai default yang telah disahkan; bila manajemen memakai batas berbeda di kemudian hari, perubahan bersifat konfigurasi parametrik (FR-06).
- Jenjang pendidikan diambil dari jenjang tertinggi pada data pendidikan CV (inputan talent); laporan tidak memvalidasi dokumen pendidikan.
- Data yang belum diisi (pendidikan, lokasi kerja pada kontrak) tampil sebagai kategori "belum diisi", bukan dikecualikan, agar total tetap terjelaskan; `birth_date` bersifat wajib (FR-33 TAN-98) sehingga tidak ada kategori "belum diisi" pada grafik generasi.
- Kualitas metrik laporan bergantung pada kelengkapan pencatatan kontrak oleh Operation (TAN-98 US9–US13): resign/mutasi/pensiun yang belum dicatat akan menyebabkan kejadian churn/new tidak terdeteksi — laporan tidak menarik data dari sistem lain (TMS) di luar aplikasi.
- Ekspor PNG dilakukan dari render grafik di sisi klien; mekanisme final (library charting) ditetapkan pada fase `/speckit.plan`.
- Spek 001 tetap sumber kebenaran RBAC empat peran dan profil CV; spek ini tidak mengubah modul assignment, IDP, evaluasi performa, master data, maupun alur kontrak TAN-98.

## Out of Scope

- Ekspor laporan dalam bentuk lain (PDF/Excel/CSV) — MVP hanya ekspor PNG per grafik.
- Akses laporan untuk peran Admin dan Talent (scope user: Ops & Chapters saja).
- Drill-down daftar individu talent per kategori grafik (kandidat iterasi berikutnya).
- Rincian churn per alasan berakhir (breakdown per `end_reason`: expiry/resign/retirement) — kandidat iterasi berikutnya; MVP menampilkan satu seri churn total.
- Distribusi angka usia per tahun/bucket selain tampilan generasi — kandidat iterasi berikutnya bila manajemen membutuhkan.
- Visualisasi pergerakan internal (mutasi antar unit/posisi) — di luar lima visual yang diminta.
- Visual laporan lain (IDP, evaluasi performa, kompetensi, dsb.).
- Prediksi/forecast churn maupun rekomendasi otomatis.
- Import data dari file eksternal (Excel/CSV) dan integrasi langsung TMS.
- Perubahan pada model data, modul assignment/IDP/evaluasi performa/master data spek 001, maupun alur kontrak & siklus kerja TAN-98.

## Dependencies

- **TAN-98 (specs/002-pengelolaan-talent.md)**: metrik role, lokasi kerja, churn, dan new talent membutuhkan tabel `employment_contracts` beserta alur US9–US13 (pencatatan kontrak, perpanjangan, resign, mutasi, pensiun). Implementasi laporan disarankan mengantre setelah sub-issues backend TAN-98 selesai; view turunan cakupan (`employee_chapter_scope`, join via kontrak aktif) dapat dipakai ulang.
- **Spek 001**: profil CV (pendidikan) dan RBAC/cakupan chapter.
- Pilihan library charting dan endpoint agregasi ditetapkan pada fase `/speckit.plan`.

## Review & Acceptance Checklist

- [x] Keputusan Alignment A-1 s.d. A-4 dikonfirmasi pemilik produk (2026-10-09).
- [x] CL-3 (distribusi generasi usia) terselesaikan (2026-10-09).
- [x] Bentuk visual (rekomendasi grafik) disahkan pemilik produk (2026-10-09).
- [x] Semua butir NEEDS CLARIFICATION tuntas — tidak ada butir terbuka.
- [x] Amandemen populasi Operation 2026-10-19 tercermin konsisten pada FR-01/FR-03, Asumsi "Talent", dan Edge Cases (Role tanpa chapter = baris role biasa untuk Operation, tetap tidak dihitung untuk Chapter); mirror `specs/003` (spec.md) byte-identik di kedua repo (TAN-241).
- [ ] Setiap requirement spesifik dan dapat diuji. *(diverifikasi pada fase `/speckit.plan`)*
- [ ] Success criteria terukur. *(diverifikasi pada fase `/speckit.plan`)*
- [ ] Out of scope disepakati bersama stakeholder.
