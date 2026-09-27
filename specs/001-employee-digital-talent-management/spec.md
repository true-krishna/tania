# Feature Specification: Aplikasi Employee (Digital Talent) Management

**Feature Branch**: `001-employee-digital-talent-management`
**Created**: 2026-09-25
**Revisi**: 2026-09-27 — Seluruh spesifikasi Competency ditarik dan diganti dengan spesifikasi Individual Development Plan (IDP) untuk peran Chapter dan Talent, mengacu pada artikel [Individual Development Plan: A Framework for Employee Growth (Mekari Talenta)](https://www.talenta.co/en/blog/individual-development-plan/).
**Revisi**: 2026-09-27 (clarify) — Jawaban klarifikasi diterapkan: periode default IDP = kuartalan; daftar IDP Chapter terbatas pada talent dalam chapter-nya; bentuk detail assignment ditunda (akan dijelaskan berikutnya). Ditambahkan peran Admin dengan Master Data (Unit, Project, Role; Project bergantung pada Unit) dan pendekatan RBAC chapter-as-data.
**Status**: Draft
**Input**: /speckit-specify Buat aplikasi employee (digital talent) management dengan target user Chapter sebagai pengelola data assignment dan data talent competency, Operation sebagai pengelola yang memasukkan data karyawan, dan Talent yang dapat membangun profil dengan input data CV dan melihat competency matrix.

## Ringkasan

Aplikasi web untuk mengelola data karyawan digital talent dalam satu tempat: Admin mengelola master data (Unit, Project, Role), data induk karyawan dikelola Operation, data assignment dan Individual Development Plan (IDP) dikelola Chapter, dan setiap Talent dapat membangun profilnya sendiri dengan mengisi data CV serta mengikuti IDP miliknya. Empat peran dengan hak akses yang dipisahkan tegas; IDP hanya melibatkan peran Chapter dan Talent, dan Chapter hanya menangani talent dalam chapter-nya.

## User Scenarios & Testing

### User Story 1 — Operation mengelola data karyawan (Priority: P1)

Sebagai **Operation**, saya dapat menambahkan dan mengelola data induk karyawan sehingga basis data talent selalu mutakhir.

**Acceptance Scenarios:**

1. **Given** Operation sudah login, **When** mengisi form karyawan baru dengan semua field wajib dan submit, **Then** data karyawan tersimpan dan muncul di daftar karyawan.
2. **Given** karyawan sudah terdaftar, **When** Operation mengubah data (mis. divisi, posisi, status), **Then** perubahan tersimpan dan tampil di detail karyawan.
3. **Given** field wajib kosong atau email/employee ID duplikat, **When** submit, **Then** sistem menolak dengan pesan validasi yang jelas.
4. **Given** daftar karyawan berisi banyak entri, **When** Operation mencari nama atau memfilter divisi/status, **Then** daftar hanya menampilkan hasil yang sesuai.
5. **Given** karyawan sudah tidak aktif, **When** Operation menonaktifkan karyawan, **Then** karyawan tidak muncul sebagai pilihan talent baru untuk assignment/IDP.

### User Story 2 — Chapter mengelola data assignment (Priority: P1)

Sebagai **Chapter**, saya dapat membuat dan mengelola assignment talent sehingga penempatan tiap talent terdokumentasi.

**Acceptance Scenarios:**

1. **Given** Chapter sudah login dan karyawan aktif tersedia, **When** membuat assignment (talent, project/engagement, peran, periode), **Then** assignment tersimpan dan muncul pada riwayat talent.
2. **Given** assignment aktif berjalan, **When** Chapter mengubah atau mengakhirinya (isi tanggal selesai), **Then** riwayat assignment memperlihatkan versi terbaru tanpa menghapus history.
3. **Given** Chapter membuka detail seorang talent, **When** melihat daftar assignment, **Then** terlihat semua assignment talent tersebut beserta periodenya.
4. **Given** Chapter membuka daftar assignment per project, **When** memilih project, **Then** terlihat semua talent yang ter-assign beserta perannya.

### User Story 3 — Chapter mengelola IDP talent (Priority: P1)

Sebagai **Chapter**, saya dapat membuat dan mengelola Individual Development Plan (IDP) untuk tiap talent sehingga pengembangan talent terstruktur, terukur, dan selaras dengan kebutuhan peran.

**Acceptance Scenarios:**

1. **Given** talent aktif dalam chapter-nya tersedia, **When** Chapter membuat IDP dengan mengisi komponen: development objective, penilaian kondisi saat ini, identifikasi gap, aksi pengembangan, timeline & milestones, dan success indicators, **Then** IDP tersimpan dan tampil pada profil IDP talent tersebut.
2. **Given** IDP sudah berjalan, **When** Chapter menambahkan/mengubah aksi pengembangan atau merevisi komponen plan (mis. gap atau target berubah), **Then** IDP menampilkan versi terbaru tanpa menghapus riwayat perubahan.
3. **Given** Chapter melakukan check-in review berkala dengan talent, **When** Chapter mencatat hasil review (tanggal, ringkasan hasil, tindak lanjut), **Then** catatan review tersimpan pada IDP dan tampil pada riwayat review.
4. **Given** Chapter membuka daftar IDP, **When** memfilter per status IDP, **Then** daftar hanya menampilkan IDP talent dalam chapter-nya yang sesuai beserta progresnya.

### User Story 4 — Talent membangun profil dengan data CV (Priority: P2)

Sebagai **Talent**, saya dapat mengisi data CV milik saya sehingga profil saya lengkap dan terawat.

**Acceptance Scenarios:**

1. **Given** Talent sudah login pertama kali, **When** membuka halaman profil CV, **Then** tersedia form terstruktur: ringkasan profil, pendidikan, pengalaman kerja, sertifikasi, keahlian.
2. **Given** Talent mengisi satu atau lebih bagian CV, **When** menyimpan, **Then** data bagian tersebut tersimpan dan tampil pada profil Talent tersebut.
3. **Given** Talent memiliki data CV tersimpan, **When** mengedit dan menyimpan kembali, **Then** hanya profil miliknya yang berubah.
4. **Given** Talent lain mencoba mengakses profil Talent A, **When** permintaan dikirim, **Then** sistem menolak (hanya pemilik dan peran pengelola yang boleh).

### User Story 5 — Talent mengikuti IDP miliknya (Priority: P2)

Sebagai **Talent**, saya dapat melihat IDP milik saya dan memperbarui progres aksi pengembangan sehingga perkembangan saya terdokumentasi.

**Acceptance Scenarios:**

1. **Given** Chapter sudah membuat IDP untuk seorang Talent, **When** Talent membuka halaman IDP, **Then** Talent melihat seluruh komponen IDP miliknya: development objective, kondisi saat ini, gap, aksi pengembangan beserta statusnya, timeline & milestones, success indicators, dan riwayat review.
2. **Given** Talent memiliki aksi pengembangan, **When** Talent memperbarui status aksi (to do → in progress → completed), **Then** pembaruan tersimpan dan terlihat oleh Chapter pada tampilan progres IDP.
3. **Given** Talent belum memiliki IDP, **When** membuka halaman IDP, **Then** tampil keadaan kosong dengan penjelasan singkat (bukan error).
4. **Given** Talent lain mencoba mengakses IDP Talent A, **When** permintaan dikirim, **Then** sistem menolak (IDP hanya dapat dilihat oleh pemiliknya dan peran Chapter).

### User Story 6 — Admin mengelola master data (Priority: P1)

Sebagai **Admin**, saya dapat mendefinisikan dan mengelola master data (Unit, Project, Role) sehingga data operasional aplikasi konsisten mengacu pada referensi yang sama.

**Acceptance Scenarios:**

1. **Given** Admin sudah login, **When** menambahkan Unit baru dengan nama yang valid, **Then** Unit tersimpan dan muncul pada daftar Unit.
2. **Given** minimal satu Unit sudah terdaftar, **When** Admin membuat Project baru dengan memilih Unit pemiliknya, **Then** Project tersimpan dan tampil pada daftar Project beserta Unit-nya.
3. **Given** Admin mencoba membuat Project tanpa memilih Unit, **When** submit, **Then** sistem menolak dengan pesan validasi (Project wajib merujuk satu Unit).
4. **Given** Unit masih direferensikan oleh minimal satu Project, **When** Admin mencoba menghapus Unit tersebut, **Then** sistem menolak dengan penjelasan dependensi.
5. **Given** Admin menambahkan Role baru pada daftar Role, **When** submit, **Then** Role tersimpan dan muncul pada daftar Role.
6. **Given** Admin mengubah data master (mis. nama Unit), **When** disimpan, **Then** referensi pada data yang memakainya tetap valid tanpa penyesuaian manual.

### Edge Cases

- Email atau employee ID duplikat saat menambah karyawan → ditolak dengan pesan validasi.
- Karyawan dinonaktifkan padahal masih punya assignment aktif atau IDP berjalan → sistem memberi peringatan sebelum nonaktif.
- Talent melihat halaman IDP sebelum Chapter membuat IDP → empty state yang jelas.
- Semua aksi pengembangan sudah completed tetapi success indicators belum dievaluasi → status IDP tidak otomatis selesai; penutupan IDP dilakukan oleh Chapter saat review.
- IDP melewati tanggal akhir timeline tanpa penutupan atau perpanjangan → IDP ditandai perlu review pada daftar IDP Chapter.
- User dengan peran A mencoba mengakses fungsi peran B → akses ditolak di sisi server.

## Requirements

### Functional Requirements

**Data karyawan (Operation)**

- **FR-01**: Sistem harus menyediakan tambah/ubah data karyawan oleh Operation dengan field: nama lengkap, employee ID, email, divisi, posisi, tanggal bergabung, status (aktif/non-aktif). *[NEEDS CLARIFICATION: apakah divisi dan posisi akan menunjuk Master Data Unit dan Master Data Role, atau tetap isian bebas?]*
- **FR-02**: Sistem harus menyediakan daftar karyawan dengan pencarian (nama/email) dan filter (divisi, status).
- **FR-03**: Email dan employee ID harus unik; field wajib divalidasi.
- **FR-04**: Operation harus dapat menonaktifkan karyawan; karyawan non-aktif tidak muncul sebagai pilihan talent untuk assignment/IDP baru.

**Assignment (Chapter)**

- **FR-05**: Chapter harus dapat membuat assignment berisi: talent, nama project/engagement, peran, periode (mulai–selesai), status. *[DITUNDA: bentuk detail assignment akan dijelaskan pada iterasi berikutnya — saat itu project/engagement dapat diarahkan merujuk Master Data Project.]*
- **FR-06**: Chapter harus dapat mengubah dan mengakhiri assignment; riwayat assignment talent tetap tersimpan.
- **FR-07**: Chapter harus dapat melihat daftar assignment per talent dan per project/engagement.

**Individual Development Plan (Chapter & Talent)**

- **FR-08**: Chapter harus dapat membuat IDP untuk seorang talent dalam chapter-nya yang memuat: development objective (target peran/kapabilitas yang spesifik dan terikat pada ekspektasi peran), penilaian kondisi saat ini (kekuatan & keterbatasan), identifikasi gap (selisih kondisi saat ini vs yang dibutuhkan), aksi pengembangan (banyak entri), timeline & milestones (periode mulai–selesai dengan checkpoint), dan success indicators. Periode default IDP adalah satu kuartal (3 bulan).
- **FR-09**: Setiap aksi pengembangan harus dapat dilacak statusnya (to do / in progress / completed); Talent dapat memperbarui status aksi miliknya dan Chapter dapat memperbaruinya saat review.
- **FR-10**: Chapter harus dapat mencatat hasil review & monitoring berkala (tanggal, ringkasan hasil, tindak lanjut) dan merevisi IDP sebagai dokumen kerja yang diperbarui; riwayat perubahan IDP tetap tersimpan.
- **FR-11**: Sistem harus menyediakan daftar IDP untuk Chapter yang dapat difilter per status, menampilkan progres tiap IDP. Daftar hanya memuat IDP talent yang berada dalam chapter yang sama dengan Chapter yang login.
- **FR-14**: Talent hanya dapat melihat IDP miliknya sendiri beserta progres dan riwayat review.

**Profil & CV (Talent)**

- **FR-12**: Talent harus dapat mengisi profil CV berbentuk form terstruktur: ringkasan profil, pendidikan (banyak entri), pengalaman kerja (banyak entri), sertifikasi (banyak entri), keahlian (banyak entri).
- **FR-13**: Talent hanya dapat melihat dan mengedit CV miliknya sendiri.

**Akses & keamanan**

- **FR-15**: Sistem harus menyediakan login dan role-based access control untuk empat peran: Admin, Operation, Chapter, Talent. *[NEEDS CLARIFICATION: apakah Admin juga mengelola akun user & penetapan peran, atau pembuatan akun tetap di luar aplikasi (seeding)?]*
- **FR-16**: Operation tidak dapat mengubah assignment/IDP; Chapter tidak dapat mengubah data induk karyawan; Talent hanya dapat mengakses profil CV dan IDP miliknya; hanya Admin yang dapat mengelola master data. Chapter hanya dapat mengakses/mengelola IDP talent dalam chapter yang sama dengannya — cakupan mengikuti atribut chapter pada user, bukan definisi peran. Validasi ditegakkan di sisi server.
- **FR-17**: Setiap perubahan data inti (master data, karyawan, assignment, IDP) harus tercatat jejak auditnya.

**Master data (Admin)**

- **FR-18**: Admin harus dapat mengelola Master Data Unit (tambah/ubah/nonaktifkan) berisi minimal nama unit.
- **FR-19**: Admin harus dapat mengelola Master Data Project (tambah/ubah/nonaktifkan); setiap Project wajib merujuk tepat satu Unit.
- **FR-20**: Admin harus dapat mengelola Master Data Role (tambah/ubah/nonaktifkan). *[NEEDS CLARIFICATION: apakah Master Data Role adalah peran jabatan/fungsional talent (mis. Backend Engineer), bukan peran akses aplikasi? Peran akses (RBAC) disarankan tetap fixed: Admin, Operation, Chapter, Talent.]*
- **FR-21**: Master data yang masih direferensikan data lain (mis. Unit yang dipakai Project) tidak dapat dihapus; penonaktifan hanya menghentikan pemakaian untuk data baru.

### Non-Functional Requirements

- Aplikasi berbasis web, responsif (desktop-first), antarmuka berbahasa Indonesia.
- Data pribadi karyawan hanya dapat diakses oleh user berotorisasi; kontrol akses peran ditegakkan di server.
- Daftar utama (karyawan, daftar IDP) tetap responsif hingga ±5.000 karyawan.

### Key Entities

- **Employee**: data induk karyawan (identitas, divisi, posisi, status, chapter — Product/Engineer/Design). Satu employee memiliki satu akun user.
- **User & Role**: akun login dengan tepat satu peran akses: Admin, Operation, Chapter, atau Talent; atribut chapter pada user menentukan cakupan data peran Chapter.
- **Unit**: master data unit organisasi, dikelola Admin.
- **Project (master data)**: master data project/engagement yang wajib merujuk satu Unit, dikelola Admin.
- **Role (master data)**: master data peran jabatan talent, dikelola Admin.
- **Assignment**: penempatan seorang talent pada project/engagement untuk periode tertentu (detail bentuk assignment ditunda — akan dijelaskan berikutnya).
- **IndividualDevelopmentPlan (IDP)**: rencana pengembangan individual milik satu talent, dibuat dan dikelola Chapter; memuat development objective, penilaian kondisi saat ini, identifikasi gap, timeline & milestones, dan success indicators.
- **DevelopmentAction**: aksi pengembangan dalam sebuah IDP (deskripsi, metode — penugasan project, mentoring, training, exposure lintas fungsi, atau belajar mandiri — status to do/in progress/completed, tenggat).
- **ReviewLog**: catatan check-in review & monitoring antara Chapter dan talent (tanggal, ringkasan hasil, tindak lanjut).
- **CVProfile**: profil CV milik talent, terdiri atas ringkasan dan sub-data multi-entri (pendidikan, pengalaman kerja, sertifikasi, keahlian).

## Success Criteria

- **SC-001**: Operation dapat menambahkan satu karyawan baru lengkap dalam waktu kurang dari 2 menit.
- **SC-002**: Seluruh halaman dan operasi tervalidasi sesuai peran (100% penolakan untuk akses lintas peran yang tidak diizinkan).
- **SC-003**: Chapter dapat membuat satu IDP lengkap dengan seluruh komponennya dalam waktu kurang dari 10 menit.
- **SC-004**: Talent baru dapat menyelesaikan profil CV pertamanya dalam waktu kurang dari 10 menit.
- **SC-005**: Pembaruan status aksi pengembangan oleh Talent atau Chapter tercermin pada tampilan progres IDP tanpa langkah sinkronisasi manual.

## Assumptions

- Satu user = satu employee; pembuatan akun awal tetap di luar aplikasi (seeding) sampai dikonfirmasi apakah Admin mengambil alih pengelolaan akun & penetapan peran.
- Chapter (Product, Engineer, Design) diperlakukan sebagai atribut data pada user/employee, bukan sebagai peran RBAC — konsolidasi chapter cukup mengubah data tanpa mengubah definisi peran.
- CV diinput sebagai form terstruktur — bukan upload file PDF — sesuai frasa "input data CV".
- Chapter bertindak sebagai manajer pengembangan talent: IDP dibuat, direview, dan diperbarui oleh Chapter; Talent berpartisipasi dengan memperbarui progres aksi pengembangan miliknya.
- Struktur IDP mengikuti tujuh komponen sesuai artikel Mekari Talenta "Individual Development Plan: A Framework for Employee Growth".
- Bahasa antarmuka: Indonesia.

## Out of Scope

- Integrasi HRIS/payroll eksternal.
- Import CV dari file PDF atau parsing dokumen.
- Alur approval/ACK formal atas IDP.
- Notifikasi email.
- Penyelenggaraan konten pelatihan/LMS dan penilaian berbasis kuis — aplikasi hanya melacak aksi pengembangan, bukan menyelenggarakan pelatihannya.
- Perencanaan suksesi dan rekomendasi promosi otomatis — IDP hanya mencatat rencana dan progres pengembangan.

## Dependencies

- Belum ditetapkan — akan diidentifikasi pada fase `/speckit.plan`.

## Review & Acceptance Checklist

- [ ] Semua item NEEDS CLARIFICATION sudah terselesaikan (pada fase `/speckit.clarify`).
- [ ] Setiap requirement spesifik dan dapat diuji.
- [ ] Success criteria terukur.
- [ ] Out of scope disepakati bersama stakeholder.
