# Feature Specification: Manajemen Assignment Talent

**Feature Branch**: `feat/TAN-97-talent-assignment-spec`

**Created**: 2026-10-07

**Revisi**: 2026-10-07 (clarify 1) — Klarifikasi hasil review: US 1 kini menyatakan secara eksplisit bahwa Chapter meng-assign satu talent spesifik dengan memilihnya dari daftar kandidat (karyawan aktif dan assignable dalam tanggung jawab chapter-nya, selaras FR-03) — sebelumnya form pembuatan tampak hanya menjabarkan pilihan project dan peran, sementara kewajiban mengisi talent baru tersirat pada daftar field FR-01. Skenario penerimaan 1 US1 diselaraskan.

**Status**: Draft

**Input**: User description: "speckit.specify create plan spec.md for feature talent assignment based on specs/001-employee-digital-talent-management"

> Spesifikasi ini diturunkan dari `specs/001-employee-digital-talent-management/spec.md` — User Story 2 (Chapter mengelola data assignment, P1) beserta persyaratannya (FR-05–FR-07) dan konstraint lintas fitur yang mengikatnya (FR-15–FR-17, FR-19–FR-24). Konteks bersama — RBAC empat peran akses (Admin, Operation, Chapter, Talent), model chapter-as-data, dan master data — didefinisikan pada spesifikasi induk dan tidak diulang di sini; pemetaan rujukan ada di bagian Rujukan Silang.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chapter membuat assignment talent (Priority: P1)

Sebagai **Chapter**, saya dapat membuat assignment dengan meng-assign satu talent spesifik — memilihnya dari daftar kandidat karyawan aktif dan assignable dalam tanggung jawab chapter-nya (FR-03) — lalu mengisi project dari Master Data Project, peran dari Master Data Role, dan periode, sehingga penempatan setiap talent dalam tanggung jawab chapter-nya terdokumentasi sejak hari pertama.

**Why this priority**: Pencatatan assignment adalah inti nilai fitur — tanpa pembuatan assignment, tidak ada riwayat penempatan yang dapat dikelola, dilihat, maupun dipakai fitur lain (CV, evaluasi, dashboard pada spesifikasi induk).

**Independent Test**: Dapat diuji penuh dengan login sebagai Chapter, membuat satu assignment untuk talent aktif dalam chapter-nya, dan memastikan assignment tersimpan serta muncul pada riwayat talent tersebut.

**Acceptance Scenarios**:

1. **Given** Chapter sudah login dan talent aktif dalam chapter-nya tersedia, **When** membuat assignment dengan memilih satu talent spesifik dari daftar kandidat (karyawan aktif dan assignable), project dari Master Data Project, peran dari Master Data Role, dan periode, **Then** assignment tersimpan untuk talent tersebut dan muncul pada riwayat talent.
2. **Given** Chapter membuka form assignment, **When** memilih talent, **Then** pilihan talent hanya memuat karyawan aktif dan assignable dalam tanggung jawab chapter-nya (diturunkan dari posisi → Role → chapter pemilik).
3. **Given** Chapter mengisi form assignment, **When** memilih project dan peran, **Then** pilihan hanya berasal dari Master Data Project dan Master Data Role yang aktif — tidak ada isian bebas.
4. **Given** Chapter mengisi tanggal mulai dan (opsional) tanggal selesai rencana, **When** tanggal selesai lebih awal dari tanggal mulai, **Then** sistem menolak dengan pesan validasi yang jelas.
5. **Given** Chapter mencoba membuat assignment untuk talent di luar tanggung jawab chapter-nya, **When** permintaan dikirim, **Then** sistem menolak di sisi server dengan penjelasan.

---

### User Story 2 - Chapter mengubah dan mengakhiri assignment (Priority: P1)

Sebagai **Chapter**, saya dapat mengubah detail assignment yang sedang berjalan atau mengakhirinya dengan mengisi tanggal selesai, sehingga riwayat penempatan selalu memperlihatkan kondisi terkini tanpa menghapus history.

**Why this priority**: Assignment adalah data hidup — tanpa kemampuan koreksi dan pengakhiran, riwayat cepat kedaluwarsa dan nilai dokumentasinya hilang; pengakhiran juga menjadi pemicu data historis untuk fitur lain (pengalaman kerja CV pada spesifikasi induk).

**Independent Test**: Dapat diuji penuh dengan mengubah detail satu assignment berjalan lalu menyimpannya (versi terbaru tampil), kemudian mengakhirinya dengan mengisi tanggal selesai dan memastikan status menjadi selesai tanpa entri riwayat yang hilang.

**Acceptance Scenarios**:

1. **Given** assignment aktif berjalan, **When** Chapter mengubah atau mengakhirinya (isi tanggal selesai), **Then** riwayat assignment memperlihatkan versi terbaru tanpa menghapus history.
2. **Given** Chapter mengubah detail assignment (project, peran, atau periode), **When** menyimpan, **Then** perubahan tersimpan dan tampil pada riwayat per talent maupun daftar per project.
3. **Given** Chapter mengakhiri assignment dengan mengisi tanggal selesai, **When** disimpan, **Then** status assignment menjadi selesai dan assignment tersebut tetap tampil pada riwayat (termasuk riwayat talent dan sumber pengalaman kerja CV pada spesifikasi induk).
4. **Given** Chapter mengisi tanggal selesai yang lebih awal dari tanggal mulai assignment, **When** menyimpan, **Then** sistem menolak dengan pesan validasi yang jelas.

---

### User Story 3 - Chapter melihat riwayat assignment per talent (Priority: P1)

Sebagai **Chapter**, saya dapat melihat seluruh assignment seorang talent dalam tanggung jawab chapter-nya beserta periodenya, sehingga lintasan penempatan tiap talent dapat ditinjau kapan pun.

**Why this priority**: Riwayat per talent adalah wujud nilai utama fitur ("penempatan tiap talent terdokumentasi") dan menjadi sumber data pengalaman kerja pada CV talent di spesifikasi induk.

**Independent Test**: Dapat diuji penuh dengan membuka detail seorang talent dalam chapter-nya dan memverifikasi seluruh assignment beserta periodenya tampil — termasuk yang sudah diakhiri.

**Acceptance Scenarios**:

1. **Given** Chapter membuka detail seorang talent, **When** melihat daftar assignment, **Then** terlihat semua assignment talent tersebut beserta periodenya.
2. **Given** seorang talent memiliki assignment yang sudah diakhiri, **When** Chapter membuka riwayatnya, **Then** assignment yang sudah diakhiri tetap tampil sebagai data historis.
3. **Given** Chapter mencoba membuka riwayat assignment talent di luar tanggung jawab chapter-nya, **When** permintaan dikirim, **Then** sistem menolak di sisi server.

---

### User Story 4 - Chapter melihat daftar assignment per project (Priority: P1)

Sebagai **Chapter**, saya dapat melihat daftar talent yang ter-assign pada sebuah project beserta perannya, sehingga komposisi tim pada tiap project dalam cakupan chapter-nya terpantau.

**Why this priority**: Sudut pandang per project melengkapi sudut pandang per talent untuk keputusan penempatan dan rotasi; keduanya dibutuhkan agar dokumentasi assignment berguna bagi Chapter.

**Independent Test**: Dapat diuji penuh dengan memilih satu project dari Master Data Project dan memverifikasi daftar talent dalam cakupan chapter-nya yang ter-assign pada project itu beserta perannya.

**Acceptance Scenarios**:

1. **Given** Chapter membuka daftar assignment per project, **When** memilih project, **Then** terlihat semua talent dalam cakupan chapter-nya yang ter-assign pada project tersebut beserta perannya.
2. **Given** project yang dipilih tidak memiliki assignment talent dari cakupan chapter-nya, **When** daftar dibuka, **Then** tampil keadaan kosong yang jelas (bukan error).
3. **Given** terdapat assignment pada project tersebut untuk talent di luar cakupan chapter Chapter yang login, **When** daftar dibuka, **Then** talent tersebut tidak tampil — daftar terbatas pada talent dalam tanggung jawab chapter-nya.

---

### User Story 5 - Talent melihat riwayat assignment miliknya (Priority: P2)

Sebagai **Talent**, saya dapat melihat riwayat assignment milik saya sendiri (hanya baca) sehingga penempatan saya transparan dan menjadi sumber data pengalaman kerja pada profil CV saya.

**Why this priority**: Membuka akses baca ke pemilik data melengkapi transparansi dengan biaya kecil; bersifat hanya-baca sehingga tidak memengaruhi alur kerja Chapter — namun tetap sekunder terhadap kemampuan Chapter mengelola assignment.

**Independent Test**: Dapat diuji penuh dengan login sebagai Talent, membuka riwayat assignment miliknya, memverifikasi seluruh assignment (termasuk yang diakhiri) tampil hanya-baca, dan memastikan Talent lain tidak dapat melihatnya.

**Acceptance Scenarios**:

1. **Given** Talent memiliki riwayat assignment, **When** membuka riwayatnya, **Then** seluruh assignment miliknya (project, peran, periode) tampil secara hanya-baca, termasuk assignment yang sudah diakhiri.
2. **Given** Talent belum memiliki assignment, **When** membuka riwayatnya, **Then** tampil keadaan kosong dengan penjelasan singkat (bukan error).
3. **Given** Talent lain mencoba mengakses riwayat assignment milik Talent A, **When** permintaan dikirim, **Then** sistem menolak di sisi server.

---

### Edge Cases

- Tanggal selesai lebih awal dari tanggal mulai (saat membuat maupun saat mengakhiri) → ditolak dengan pesan validasi yang jelas.
- Assignment yang sudah berstatus selesai diakhiri kembali → tidak tersedia; pengakhiran hanya berlaku untuk assignment berstatus berjalan.
- Master Data Project atau Master Data Role dinonaktifkan Admin → assignment yang sudah ada tetap tampil utuh pada riwayat; data master yang nonaktif tidak lagi menjadi pilihan pada assignment baru.
- Talent (karyawan) dinonaktifkan sementara masih memiliki assignment aktif → pada fitur data karyawan (spesifikasi induk) sistem memberi peringatan sebelum penonaktifan; pada sisi assignment, riwayat assignment aktif tersebut tetap tampil sebagai data historis dan talent nonaktif tidak menjadi kandidat assignment baru.
- Admin mengubah kepemilikan chapter pada sebuah Master Data Role → seluruh talent pemakai Role tersebut (beserta assignment berjalannya) otomatis berpindah tanggung jawab chapter: Chapter lama tidak lagi melihat talent itu, Chapter baru mulai melihatnya — tanpa migrasi data manual.
- Chapter mencoba mengakses atau membuat assignment untuk talent di luar cakupan chapter-nya → ditolak di sisi server (bukan hanya disembunyikan di UI).
- Daftar assignment kosong (talent tanpa assignment, project tanpa talent dari cakupan chapter) → keadaan kosong yang jelas dengan penjelasan singkat, bukan error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01**: Chapter harus dapat membuat assignment berisi: talent, project, peran, periode (mulai–selesai), dan status (berjalan/selesai). Tanggal selesai boleh kosong saat pembuatan; mengisi tanggal selesai dan mengubah status menjadi selesai adalah cara mengakhiri assignment.
- **FR-02**: Pilihan project pada assignment hanya berasal dari Master Data Project; pilihan peran wajib merujuk Master Data Role — tidak ada isian bebas untuk keduanya.
- **FR-03**: Kandidat talent pada form assignment hanya karyawan aktif dan assignable (posisinya merujuk Role yang dimiliki sebuah chapter) dalam tanggung jawab chapter Chapter yang login; karyawan dengan Role tanpa chapter tidak dapat di-assign.
- **FR-04**: Chapter hanya dapat membuat, mengubah, dan melihat assignment untuk talent dalam tanggung jawab chapter-nya; cakupan diturunkan otomatis dari posisi → Role → chapter pemilik dan penegakannya dilakukan di sisi server.
- **FR-05**: Chapter harus dapat mengubah detail assignment yang berjalan (project, peran, periode); penyimpanan memperlihatkan versi terbaru tanpa menghapus entri mana pun dari riwayat assignment.
- **FR-06**: Chapter harus dapat mengakhiri assignment berjalan dengan mengisi tanggal selesai sehingga statusnya menjadi selesai; assignment yang sudah diakhiri tetap tersimpan dan tampil pada seluruh tampilan riwayat.
- **FR-07**: Sistem harus menyediakan daftar assignment per talent (semua assignment talent tersebut beserta periodenya) dan daftar assignment per project (seluruh talent dalam cakupan chapter yang ter-assign pada project itu beserta perannya) — keduanya hanya untuk Chapter dan terbatas pada talent dalam tanggung jawab chapter-nya.
- **FR-08**: Talent harus dapat melihat riwayat assignment miliknya sendiri (hanya baca), termasuk assignment yang sudah diakhiri; Talent lain tidak dapat melihatnya. Riwayat ini menjadi sumber data pengalaman kerja pada CV talent (integrasi CV di luar cakupan fitur ini).
- **FR-09**: Tanggal selesai assignment, bila diisi (saat membuat, mengubah, atau mengakhiri), harus tidak lebih awal dari tanggal mulai.
- **FR-10**: Setiap perubahan assignment (membuat, mengubah, mengakhiri) harus tercatat jejak auditnya; jejak audit hanya dapat dilihat Admin.

### Key Entities *(include if feature involves data)*

- **Assignment**: penempatan seorang talent pada sebuah project untuk periode tertentu dengan peran tertentu — talent (karyawan aktif), project (dari Master Data Project), peran (dari Master Data Role), periode (mulai–selesai; selesai kosong selama berjalan), status (berjalan/selesai). Riwayat assignment tidak pernah dihapus — hanya diubah atau diakhiri.
- **Talent (Employee)**: karyawan aktif yang menjadi subjek assignment; keter-assign-an dan chapter tanggung jawabnya diturunkan dari posisi → Role → chapter pemilik (spesifikasi induk FR-22–FR-23).
- **Project (master data)**: satu-satunya sumber pilihan project pada assignment; wajib merujuk satu Unit (dikelola Admin pada spesifikasi induk).
- **Role (master data)**: sumber pilihan peran pada assignment — peran jabatan/fungsional standar perusahaan, bukan peran akses aplikasi (dikelola Admin pada spesifikasi induk).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Chapter dapat membuat satu assignment lengkap dalam waktu kurang dari 2 menit.
- **SC-002**: 100% percobaan membuat, mengubah, atau melihat assignment untuk talent di luar cakupan chapter (dan oleh peran yang tidak berwenang) ditolak di sisi server.
- **SC-003**: Setiap perubahan dan pengakhiran assignment tercermin pada riwayat per talent dan daftar per project tanpa langkah sinkronisasi manual (100% kasus uji).
- **SC-004**: 100% assignment yang sudah dibuat tetap tampil pada riwayat setelah diubah atau diakhiri (tidak ada entri riwayat yang hilang).
- **SC-005**: Daftar assignment per talent dan per project tetap responsif hingga ±5.000 karyawan.

## Assumptions

- Fitur ini adalah User Story 2 dari `specs/001-employee-digital-talent-management/spec.md`; seluruh keputusan yang sudah diselesaikan pada spesifikasi induk (klarifikasi 1–11) berlaku dan tidak dibuka kembali di sini.
- "Versi terbaru tanpa menghapus history" berarti penyuntingan assignment memperbarui data assignment tersebut (tampil versi terbaru), sementara daftar riwayat assignment talent tidak pernah menghapus entri lama — selaras keputusan data spesifikasi induk: assignment yang diakhiri hanya mengisi tanggal selesai & status, tanpa snapshot revisi per perubahan (snapshot revisi hanya ada pada IDP dan evaluasi performa).
- Satu talent dapat memiliki lebih dari satu assignment aktif pada periode yang sama (mis. lintas project) — tidak ada larangan tumpang tindih periode untuk assignment (berbeda dari periode evaluasi pada spesifikasi induk).
- Assignment dibuat dengan status berjalan; status selesai hanya dicapai melalui pengakhiran (pengisian tanggal selesai).
- Nama tampilan status menggunakan bahasa Indonesia (berjalan/selesai) sesuai antarmuka berbahasa Indonesia pada spesifikasi induk.
- Scale dan NFR mengikuti spesifikasi induk: aplikasi web responsif (desktop-first), daftar tetap responsif hingga ±5.000 karyawan.

## Out of Scope

- Pengelolaan master data (Unit, Project, Role, Chapter) — fitur Admin pada spesifikasi induk (US6).
- Pengelolaan data karyawan/talent — fitur Operation pada spesifikasi induk (US1).
- Integrasi pengalaman kerja pada profil CV — fitur CV pada spesifikasi induk (US4); fitur ini hanya menyimpan data riwayat yang menjadi sumbernya.
- Operasi hapus assignment — riwayat hanya dapat diubah atau diakhiri, tidak dihapus.
- Login, kerangka RBAC, dan jejak audit sebagai mekanisme (kerangka bersama spesifikasi induk) — fitur ini hanya mengonsumsinya.
- IDP, evaluasi performa, dan dashboard — fitur terpisah pada spesifikasi induk yang mengonsumsi data assignment.

## Dependencies

- **Master Data Project** tersedia dan terisi (dikelola Admin — spesifikasi induk US6/FR-19): satu-satunya sumber pilihan project pada assignment.
- **Master Data Role** dengan kepemilikan chapter tersedia (dikelola Admin — spesifikasi induk US6/FR-20, FR-22): sumber pilihan peran dan dasar penurunan cakupan chapter.
- **Data karyawan aktif dan assignable** tersedia (dikelola Operation — spesifikasi induk US1/FR-01, FR-23): menentukan kandidat talent pada form assignment.
- **Akun user ber-peran Chapter dengan cakupan chapter terdefinisi** (dikelola Admin — spesifikasi induk US6/FR-15, FR-16): posisi Employee yang terhubung ke akun harus merujuk Role yang dimiliki sebuah chapter.

## Rujukan Silang ke Spesifikasi Induk

| Spesifikasi ini | Spesifikasi induk (`specs/001-employee-digital-talent-management/spec.md`) |
| --- | --- |
| User Story 1–4 | User Story 2 (skenario penerimaan 1–4) |
| User Story 5 | FR-07 (kalimat kedua) |
| FR-01–FR-03 | FR-05 |
| FR-04 | FR-16, FR-22, FR-23 |
| FR-05–FR-06 | FR-06 |
| FR-07 | FR-07 (kalimat pertama) |
| FR-08 | FR-07 (kalimat kedua), FR-12 |
| FR-09 | keputusan data spesifikasi induk (`data-model.md` §3.4, `period_end` nullable + validasi periode) |
| FR-10 | FR-17 |
| Edge case perubahan kepemilikan chapter | Edge case spesifikasi induk, FR-23–FR-24 |

## Review & Acceptance Checklist

- [x] Setiap requirement spesifik dan dapat diuji.
- [x] Success criteria terukur dan bebas detail teknologi.
- [x] Edge case diidentifikasi.
- [x] Scope dibatasi jelas (Out of Scope) dan dependensi dirinci.
- [ ] Out of scope disepakati bersama stakeholder — menunggu konfirmasi pemilik produk (mewarisi butir terbuka yang sama dari spesifikasi induk).
