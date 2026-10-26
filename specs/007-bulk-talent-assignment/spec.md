# Feature Specification: Manajemen Assignment Talent Massal (Bulk)

**Feature Branch**: `feat/TAN-337-bulk-assignment`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "/speckit.specify: adding feature bulk assignment (add/edit/delete)." (TAN-337)

> Spesifikasi ini menurunkan dan memperluas `specs/001-us2-talent-assignment/spec.md` (fitur
> assignment tunggal): seluruh aturan data assignment — kandidat talent (aktif & assignable dalam
> cakupan chapter), project hanya dari Master Data Project aktif, validasi periode, larangan
> duplikat assignment aktif per talent+project, jejak audit — berlaku apa adanya pada operasi
> massal; tidak ada pengecualian aturan. Konteks bersama (RBAC empat peran akses, model
> chapter-as-data, master data) didefinisikan pada spesifikasi induk
> (`specs/001-employee-digital-talent-management/spec.md`) dan tidak diulang di sini.

**Revisi**: 2026-10-26 — Operasi hapus (delete) masuk scope atas permintaan pemilik produk pada
TAN-337. Keputusan sebelumnya (TAN-133, 2026-10-08) menempatkan "operasi hapus assignment" di
luar scope ("riwayat hanya dapat diubah atau diakhiri") — keputusan itu dibuka kembali secara
eksplisit oleh permintaan ini. Guardrail tetap dijaga: penghapusan hanya untuk assignment
berstatus berjalan; assignment berstatus selesai adalah catatan historis yang tidak dapat
dihapus (melindungi riwayat penempatan dan turunan pengalaman kerja CV). Keputusan guardrail
ini tercatat sebagai Open Item O1 pada plan untuk konfirmasi akhir pemilik produk.

**Revisi**: 2026-10-26 (keputusan pemilik produk pada thread TAN-337) — **Bulk create beralih ke
unggah berkas Excel.** Pemilihan talent multi-select pada form bulk create dibuang total: daftar
talent kini diambil dari berkas templat Excel yang diunggah (kolom `nomor_induk`), sementara
project dan periode tetap dipilih pada form. Templat resmi disediakan untuk diunduh dari
aplikasi (FR-12). Nomor induk pada berkas dipetakan ke kandidat talent assignable; baris yang
tidak dapat dipetakan dilaporkan per baris beserta alasannya. Kontrak GraphQL
(`bulkCreateAssignments` dengan `employeeIds`) dan backend tidak berubah akibat penyesuaian ini.
Impor berkas untuk bulk edit/hapus tetap di luar scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chapter membuat assignment massal untuk banyak talent (Priority: P1)

Sebagai **Chapter**, saya dapat membuat assignment untuk banyak talent sekaligus dalam satu aksi
— mengunggah berkas templat Excel berisi daftar nomor induk talent (karyawan aktif dan
assignable dalam tanggung jawab chapter-nya), lalu memilih satu project dari Master Data Project
dan satu periode — sehingga penempatan sekumpulan talent ke sebuah project terdokumentasi tanpa
mengulang form per talent.

**Why this priority**: Pembuatan massal adalah nilai utama fitur — penempatan tim ke project
adalah kegiatan berulang dan saat ini menuntut pengisian form berulang per talent; inilah yang
menjadi inti permintaan "bulk assignment".

**Independent Test**: Dapat diuji penuh dengan login sebagai Chapter, mengunggah berkas templat
berisi 3 nomor induk talent dalam chapter-nya, memilih satu project aktif dan periode, lalu
menyimpan — assignment tersimpan dan muncul pada riwayat masing-masing talent.

**Acceptance Scenarios**:

1. **Given** Chapter sudah login dan terdapat beberapa talent aktif assignable dalam chapter-nya, **When** membuat assignment massal dengan mengunggah berkas templat berisi nomor induk mereka, satu project dari Master Data Project, dan satu periode, **Then** assignment tersimpan untuk setiap talent pada berkas yang sah dan muncul pada riwayat masing-masing talent.
2. **Given** salah satu talent yang dipilih sudah memiliki assignment aktif pada project yang sama, **When** operasi massal dieksekusi, **Then** talent lain tetap berhasil dibuat dan baris yang gagal dilaporkan beserta alasannya — kegagalan satu baris tidak menggagalkan baris lain.
3. **Given** Chapter memilih talent di luar tanggung jawab chapter-nya (atau talent nonaktif), **When** permintaan dikirim, **Then** baris tersebut ditolak di sisi server dengan penjelasan, tanpa memengaruhi baris lain yang sah.

---

### User Story 2 - Chapter mengubah banyak assignment aktif sekaligus (Priority: P1)

Sebagai **Chapter**, saya dapat memilih beberapa assignment berjalan lalu menerapkan satu
perubahan yang sama — project dan/atau periode — kepada semuanya dalam satu aksi, sehingga
koreksi penempatan massal (mis. seluruh tim pindah project atau periode disesuaikan) tidak perlu
dilakukan satu per satu.

**Why this priority**: Koreksi massal melengkapi pembuatan massal — tanpa itu, kesalahan pada
pembuatan massal harus dikoreksi satu per satu dan sebagian besar nilai fitur hilang.

**Independent Test**: Dapat diuji penuh dengan memilih 2 assignment berjalan, menerapkan satu
perubahan periode, lalu memverifikasi keduanya menampilkan versi terbaru pada riwayat tanpa
entri riwayat yang hilang.

**Acceptance Scenarios**:

1. **Given** terdapat beberapa assignment berjalan dalam cakupan chapter, **When** Chapter memilih beberapa di antaranya dan menerapkan satu perubahan (project dan/atau periode), **Then** semua baris yang sah menampilkan versi terbaru pada riwayat per talent maupun daftar per project, tanpa menghapus history.
2. **Given** salah satu assignment yang dipilih ternyata sudah berstatus selesai, **When** operasi dieksekusi, **Then** baris itu gagal dengan alasan yang jelas dan baris berjalan lainnya tetap berubah.
3. **Given** perubahan project menyebabkan salah satu talent memiliki assignment aktif kedua pada project yang sama, **When** operasi dieksekusi, **Then** baris itu ditolak dengan alasan duplikat aktif dan baris lain tetap berubah.

---

### User Story 3 - Chapter menghapus assignment aktif secara massal (Priority: P1)

Sebagai **Chapter**, saya dapat menghapus beberapa assignment berjalan sekaligus — misalnya
merapikan pembuatan massal yang keliru — dengan konfirmasi eksplisit sebelum eksekusi, sehingga
data yang salah tidak menumpuk di riwayat; assignment yang sudah selesai tetap tidak dapat
dihapus karena merupakan catatan historis.

**Why this priority**: Masuk scope atas permintaan pemilik produk (TAN-337); pembuatan dan
pengubahan massal menghasilkan lebih banyak entri sekaligus sehingga kebutuhan merapikan secara
massal mengikuti secara alami.

**Independent Test**: Dapat diuji penuh dengan memilih 2 assignment berjalan, menghapusnya
dengan konfirmasi, lalu memverifikasi keduanya hilang dari daftar berjalan, riwayat talent, dan
daftar per project — sementara assignment berstatus selesai tidak menawarkan aksi hapus.

**Acceptance Scenarios**:

1. **Given** terdapat assignment berjalan dalam cakupan chapter, **When** Chapter memilih beberapa assignment, memilih hapus, dan mengonfirmasi, **Then** assignment terpilih terhapus dari seluruh tampilan (daftar, riwayat talent, daftar per project) dan hasilnya dilaporkan.
2. **Given** salah satu assignment terpilih sudah berstatus selesai, **When** operasi dieksekusi, **Then** baris itu ditolak dengan alasan yang jelas — data historis tidak pernah terhapus.
3. **Given** salah satu assignment terpilih masih dirujuk data lain milik talent (mis. aktivitas kerja personal yang terhubung assignment itu), **When** operasi dieksekusi, **Then** baris itu ditolak dengan alasan yang jelas dan baris lain tetap terhapus.
4. **Given** Chapter memilih aksi hapus massal, **When** konfirmasi diminta, **Then** tampil ringkasan jumlah assignment yang akan dihapus dan eksekusi hanya berjalan setelah konfirmasi eksplisit.

---

### Edge Cases

- Jumlah talent/assignment pada satu operasi melebihi batas maksimum (100 baris) → seluruh permintaan ditolak utuh dengan pesan yang jelas; tidak ada baris yang dieksekusi sebagian.
- Batch berisi talent yang sama lebih dari sekali → baris kedua gagal dengan alasan duplikat assignment aktif (setelah baris pertama berhasil); hasil per baris tetap konsisten dan dapat dijelaskan.
- Semua baris gagal → tidak ada perubahan data; hasil menjelaskan alasan tiap baris, plus alasan umum bila berlaku (mis. project dinonaktifkan).
- Project yang dipilih dinonaktifkan di antara pemilihan dan eksekusi → baris gagal dengan alasan project tidak aktif.
- Talent dinonaktifkan di antara pemilihan dan eksekusi → baris gagal dengan alasan talent tidak lagi assignable.
- Operasi massal mencakup talent/assignment di luar cakupan chapter → baris terkait ditolak di sisi server (bukan hanya disembunyikan di UI).
- Duplikat aktif lintas project tetap diperbolehkan — aturan yang berlaku adalah satu assignment aktif per talent per project (selaras spec induk), bukan larangan tumpang tindih periode.
- Setelah penghapusan, turunan data (pengalaman kerja CV, angka dashboard) berubah konsisten tanpa langkah sinkronisasi manual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01**: Pengelola assignment (Chapter dalam cakupan chapter-nya; Admin selaras aturan pengelolaan assignment berjalan saat ini — TAN-212 clarify 4) harus dapat membuat assignment massal dalam satu aksi: daftar talent diambil dari berkas templat Excel yang diunggah — setiap baris memuat nomor induk seorang talent yang harus aktif dan assignable dalam cakupan — disertai satu project dari Master Data Project aktif dan satu periode (mulai wajib; selesai opsional).
- **FR-02**: Hasil operasi massal harus dilaporkan per baris: baris yang berhasil (beserta assignment hasilnya) dan baris yang gagal (beserta alasan yang jelas dan dapat ditindaklanjuti); kegagalan satu baris tidak boleh menggagalkan baris lain yang sah.
- **FR-03**: Pengelola assignment harus dapat memilih banyak assignment berjalan sekaligus dan menerapkan satu perubahan (project dan/atau periode) kepada semuanya dalam satu aksi; per baris berlaku aturan pengubahan assignment yang ada — hanya assignment berstatus berjalan, talent tidak berganti, larangan duplikat aktif per talent+project.
- **FR-04**: Pengelola assignment harus dapat menghapus banyak assignment sekaligus; hanya assignment berstatus berjalan yang dapat dihapus — assignment berstatus selesai tidak pernah dapat dihapus (catatan historis tetap utuh, termasuk sebagai sumber pengalaman kerja CV).
- **FR-05**: Penghapusan assignment yang masih dirujuk data lain (mis. aktivitas kerja personal talent) harus ditolak per baris dengan alasan yang jelas, bukan gagal diam-diam.
- **FR-06**: Aksi penghapusan massal harus selalu didahului konfirmasi eksplisit yang menampilkan ringkasan jumlah assignment yang akan dihapus.
- **FR-07**: Satu operasi massal maksimum memuat 100 baris; permintaan yang melebihi batas ditolak utuh dengan pesan yang jelas.
- **FR-08**: Seluruh penegakan otorisasi dan cakupan chapter pada operasi massal dilakukan di sisi server: peran yang tidak berwenang ditolak; Chapter terbatas pada talent dan assignment dalam tanggung jawab chapter-nya.
- **FR-09**: Setiap assignment yang dibuat, diubah, atau dihapus melalui operasi massal harus tercatat jejak auditnya per assignment (bukan satu catatan untuk seluruh batch); jejak audit hanya dapat dilihat Admin.
- **FR-10**: Operasi massal wajib mengikuti seluruh aturan data assignment tunggal yang berlaku: project hanya dari Master Data Project aktif; talent hanya karyawan aktif dan assignable dalam cakupan; tanggal selesai (bila diisi) tidak lebih awal dari tanggal mulai; satu talent maksimum satu assignment aktif per project.
- **FR-11**: Perubahan periode pada operasi massal tidak mengosongkan tanggal selesai yang sudah terisi; pengakhiran assignment tetap melalui alur akhiri assignment yang ada.
- **FR-12**: Aplikasi menyediakan templat Excel resmi yang dapat diunduh untuk bulk create; berkas yang diunggah divalidasi sebelum eksekusi (format .xlsx, kolom `nomor_induk` pada baris pertama, batas 100 baris) dan setiap baris yang nomor induknya tidak dapat dipetakan ke kandidat assignable dilaporkan per baris beserta alasannya, tanpa memengaruhi baris lain yang sah.

### Key Entities *(include if feature involves data)*

- **Assignment**: seperti pada spec induk `001-us2-talent-assignment` — penempatan seorang talent pada sebuah project untuk periode tertentu (talent, project, periode mulai–selesai, status berjalan/selesai). Operasi massal tidak mengubah model data; ia mengoperasikan kumpulan Assignment dengan aturan yang sama.
- **Hasil Operasi Massal**: keluaran setiap operasi massal — daftar baris berhasil (beserta assignment hasilnya bila ada) dan daftar baris gagal (beserta alasan per baris); bukan data yang tersimpan, melainkan laporan eksekusi.
- **Talent (Employee)**, **Project (master data)**, **Role (master data)**: definisi tetap mengikuti spec induk `001-us2-talent-assignment`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Chapter dapat membuat assignment untuk 50 talent dalam satu aksi dalam waktu kurang dari 2 menit (termasuk memilih talent dan meninjau hasil).
- **SC-002**: 100% percobaan operasi massal oleh peran yang tidak berwenang atau di luar cakupan chapter ditolak di sisi server.
- **SC-003**: 100% kegagalan baris dilaporkan dengan alasan yang dapat dipahami Chapter; baris yang berhasil tidak pernah tergulung balik oleh kegagalan baris lain (100% kasus uji).
- **SC-004**: 100% assignment yang dibuat, diubah, atau dihapus melalui operasi massal memiliki jejak audit per assignment.
- **SC-005**: Operasi massal 100 baris selesai dalam waktu kurang dari 10 detik pada kondisi normal; daftar assignment tetap responsif hingga ±5.000 karyawan (selaras induk).

## Assumptions

- "Bulk assignment (add/edit/delete)" pada permintaan TAN-337 dimaknai sebagai tiga operasi massal pada assignment: tambah (banyak talent → satu project+periode), ubah (banyak assignment aktif → satu perubahan), hapus (banyak assignment berjalan). Pengakhiran assignment tetap melalui alur akhiri yang sudah ada.
- Membatasi hapus pada assignment berstatus berjalan adalah guardrail yang dipilih untuk melindungi riwayat historis dan turunan CV; keputusan final dikonfirmasi ke pemilik produk (Open Item O1 pada plan).
- Batas batch 100 baris cukup untuk skala chapter (jumlah talent per chapter jauh di bawah batas ini); batas dapat ditinjau bila muncul kebutuhan nyata.
- Antarmuka berbahasa Indonesia, desktop-first, dan skala data mengikuti spesifikasi induk (±5.000 karyawan).
- Operasi massal tersedia pada UI pengelolaan assignment eksisting (tidak ada aplikasi atau modul terpisah).

## Out of Scope

- Impor assignment dengan project dan/atau periode yang berbeda per baris, serta impor berkas untuk bulk edit/hapus — bulk create menerima unggah templat Excel berisi daftar talent (FR-01, FR-12); seleksi baris tetap menjadi cara untuk bulk edit/hapus.
- Template atau pola assignment berulang/rotasi otomatis antar periode.
- Perubahan aturan assignment tunggal atau model data assignment — fitur ini melapisi operasi massal di atas aturan yang berlaku.
- Operasi massal pada IDP, evaluasi performa, atau entitas lain di luar assignment.
- Pengelolaan master data dan data karyawan — fitur lain pada spesifikasi induk.
- Login, kerangka RBAC, dan mekanisme jejak audit — kerangka bersama yang dikonsumsi.

## Dependencies

- **Fitur assignment tunggal** (`specs/001-us2-talent-assignment/spec.md`) sudah terimplementasi di kedua repo: operasi massal memakai aturan, validasi, dan jejak audit yang sama.
- **Master Data Project aktif** tersedia (Admin — spesifikasi induk US6): satu-satunya sumber pilihan project.
- **Kandidat talent aktif dan assignable** tersedia (Operation — spesifikasi induk US1): menentukan pilihan talent massal.
- **Kerangka audit** berjalan (spesifikasi induk FR-17): setiap perubahan massal tercatat per assignment.
- **Akun pengelola assignment** dengan cakupan chapter terdefinisi (Admin — spesifikasi induk US6/FR-15, FR-16).

## Rujukan Silang ke Spec Induk Assignment

| Spesifikasi ini | `specs/001-us2-talent-assignment/spec.md` |
| --- | --- |
| US1 (tambah massal) | US1 (membuat assignment) — aturan kandidat, project, dan periode sama |
| US2 (ubah massal) | US2 (mengubah/mengakhiri) — FR-05 |
| US3 (hapus massal) | Out of Scope lama "operasi hapus" (keputusan TAN-133) — dibuka kembali oleh TAN-337 dengan guardrail FR-04 |
| FR-03, FR-08, FR-10 | FR-03, FR-04 (kandidat & cakupan), FR-01, FR-02 (project & periode), FR-09 (validasi tanggal) |
| FR-09 (audit) | FR-10 (jejak audit) |
| Edge case rujukan aktivitas kerja | Modul aktivitas kerja talent pada spesifikasi induk (assignment tidak boleh hilang bila masih dirujuk) |

## Review & Acceptance Checklist

- [ ] Setiap requirement spesifik dan dapat diuji.
- [ ] Success criteria terukur dan bebas detail teknologi.
- [ ] Edge case diidentifikasi.
- [ ] Scope dibatasi jelas (Out of Scope) dan dependensi dirinci.
- [ ] Keputusan guardrail hapus (FR-04) dikonfirmasi pemilik produk (Open Item O1 pada plan).
