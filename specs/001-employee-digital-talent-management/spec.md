# Feature Specification: Aplikasi Employee (Digital Talent) Management

**Feature Branch**: `001-employee-digital-talent-management`
**Created**: 2026-09-25
**Revisi**: 2026-09-27 — Seluruh spesifikasi Competency ditarik dan diganti dengan spesifikasi Individual Development Plan (IDP) untuk peran Chapter dan Talent, mengacu pada artikel [Individual Development Plan: A Framework for Employee Growth (Mekari Talenta)](https://www.talenta.co/en/blog/individual-development-plan/).
**Revisi**: 2026-09-27 (clarify 2) — Jawaban klarifikasi diterapkan: periode default IDP = kuartalan; daftar IDP Chapter terbatas pada talent dalam chapter-nya; bentuk detail assignment ditunda (akan dijelaskan berikutnya). Ditambahkan peran Admin dengan Master Data (Unit, Project, Role; Project bergantung pada Unit) dan pendekatan RBAC chapter-as-data.
**Revisi**: 2026-09-27 (clarify 3) — Assignment project merujuk Master Data Project; divisi/posisi karyawan merujuk Master Data Unit/Role (bukan isian bebas); Master Data Role = peran jabatan/fungsional standar perusahaan; Admin mengelola akun user & penetapan peran akses dalam aplikasi; RBAC chapter-as-data disetujui.
**Revisi**: 2026-09-27 (clarify 4) — Talent dapat melihat riwayat assignment miliknya, dan riwayat tersebut menjadi sumber data pengalaman kerja pada CV (bukan input manual); Chapter dapat membaca CV talent dalam chapter-nya (opsi A); jejak audit hanya dapat dilihat Admin.
**Revisi**: 2026-09-27 (clarify 5, walkthrough) — Perbaikan koherensi hasil walkthrough: cakupan chapter ditegakkan pada akses IDP oleh Talent (US5); siklus status IDP (berjalan → perlu review → selesai) dan status assignment (berjalan/selesai) didefinisikan; satu sumber kebenaran atribut chapter (pada Employee, diwarisi cakupan user); cakupan jejak audit diperluas ke akun user & profil CV.
**Revisi**: 2026-09-27 (clarify 6) — Model tanggung jawab chapter: setiap Master Data Role dimiliki tepat satu chapter atau tidak sama sekali (dikelola Admin); chapter talent, keter-assign-an, dan cakupan otorisasi Chapter diturunkan otomatis dari posisi → Role → chapter pemilik (tanpa atribut Unit Origin/Unit Assignment eksplisit). Karyawan dengan Role tanpa chapter tetap tercatat di Database Karyawan sebagai pencatatan, tetapi tidak dapat di-assign dan bukan kandidat IDP.
**Revisi**: 2026-09-27 (clarify 7) — Fleksibilitas konsolidasi: daftar chapter menjadi Master Data Chapter yang dikelola Admin (FR-24, nilai awal Product/Engineer/Design), sehingga chapter berjumlah bebas (1, 3, atau N) dan konsolidasi menjadi "Chapter Digital Talents" adalah operasi data murni — tanpa perubahan peran RBAC dan tanpa migrasi data karyawan.
**Revisi**: 2026-09-27 (clarify 8) — Keputusan scope MVP: modul Performance Evaluation dan Dashboard masuk ke dalam fitur ini untuk memperkuat alur end-to-end (assignment → penilaian performa → pengembangan IDP → pemantauan periodik). Ditambahkan User Story 7–8, FR-25–FR-30, entitas EvaluationPeriod & PerformanceEvaluation; skala penilaian, self-assessment, dan cakupan widget dashboard ditandai NEEDS CLARIFICATION.
**Revisi**: 2026-09-27 (clarify 9) — Evaluasi performa dibuat dapat dikonfigurasi: Admin mengelola template evaluasi (kriteria + tipe jawaban dari set fixed) yang terpinned ke periode evaluasi (FR-31), sehingga perubahan framework penilaian tidak mengubah kode; self-assessment di luar MVP (Chapter-only); widget dashboard MVP dikonfirmasi sesuai User Story 8.
**Status**: Draft
**Input**: /speckit-specify Buat aplikasi employee (digital talent) management dengan target user Chapter sebagai pengelola data assignment dan data talent competency, Operation sebagai pengelola yang memasukkan data karyawan, dan Talent yang dapat membangun profil dengan input data CV dan melihat competency matrix.

## Ringkasan

Aplikasi web untuk mengelola data karyawan digital talent secara end-to-end: Admin mengelola master data (Unit, Project, Role, Chapter) beserta akun user dan penetapan peran akses, data induk karyawan dikelola Operation, data assignment, Individual Development Plan (IDP), dan evaluasi performa periodik dikelola Chapter, dan setiap Talent dapat membangun profilnya sendiri dengan mengisi data CV serta mengikuti IDP dan evaluasi miliknya. Alur assignment → penilaian performa → pengembangan melalui IDP dipantau periodik melalui dashboard per peran. Empat peran akses dengan hak yang dipisahkan tegas; IDP dan evaluasi hanya melibatkan Chapter dan Talent, dan Chapter hanya menangani talent dalam tanggung jawab chapter-nya.

## User Scenarios & Testing

### User Story 1 — Operation mengelola data karyawan (Priority: P1)

Sebagai **Operation**, saya dapat menambahkan dan mengelola data induk karyawan sehingga basis data talent selalu mutakhir.

**Acceptance Scenarios:**

1. **Given** Operation sudah login, **When** mengisi form karyawan baru dengan semua field wajib dan submit, **Then** data karyawan tersimpan dan muncul di daftar karyawan.
2. **Given** karyawan sudah terdaftar, **When** Operation mengubah data (mis. divisi, posisi, status), **Then** perubahan tersimpan dan tampil di detail karyawan.
3. **Given** field wajib kosong atau email/employee ID duplikat, **When** submit, **Then** sistem menolak dengan pesan validasi yang jelas.
4. **Given** daftar karyawan berisi banyak entri, **When** Operation mencari nama atau memfilter divisi/status, **Then** daftar hanya menampilkan hasil yang sesuai.
5. **Given** karyawan sudah tidak aktif, **When** Operation menonaktifkan karyawan, **Then** karyawan tidak muncul sebagai pilihan talent baru untuk assignment/IDP.
6. **Given** Operation merekam karyawan yang posisinya merujuk Role tanpa kepemilikan chapter, **When** data disimpan, **Then** karyawan tetap tercatat di Database Karyawan sebagai pencatatan dan ditandai tidak dapat di-assign.

### User Story 2 — Chapter mengelola data assignment (Priority: P1)

Sebagai **Chapter**, saya dapat membuat dan mengelola assignment talent sehingga penempatan tiap talent terdokumentasi.

**Acceptance Scenarios:**

1. **Given** Chapter sudah login dan talent aktif dalam chapter-nya tersedia, **When** membuat assignment (talent, project dari Master Data Project, peran, periode), **Then** assignment tersimpan dan muncul pada riwayat talent.
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

1. **Given** Talent sudah login pertama kali, **When** membuka halaman profil CV, **Then** tersedia form terstruktur: ringkasan profil, pendidikan, sertifikasi, keahlian — sedangkan bagian pengalaman kerja terisi otomatis dari riwayat assignment.
2. **Given** Talent mengisi satu atau lebih bagian CV, **When** menyimpan, **Then** data bagian tersebut tersimpan dan tampil pada profil Talent tersebut.
3. **Given** Talent memiliki data CV tersimpan, **When** mengedit dan menyimpan kembali, **Then** hanya profil miliknya yang berubah.
4. **Given** Talent lain mencoba mengakses profil Talent A, **When** permintaan dikirim, **Then** sistem menolak (hanya pemiliknya dan Chapter talent dalam chapter yang sama — hanya baca — yang boleh).
5. **Given** Talent memiliki riwayat assignment, **When** membuka profilnya, **Then** bagian pengalaman kerja menampilkan riwayat assignment (project, peran, periode) secara otomatis, termasuk assignment yang sudah diakhiri.

### User Story 5 — Talent mengikuti IDP miliknya (Priority: P2)

Sebagai **Talent**, saya dapat melihat IDP milik saya dan memperbarui progres aksi pengembangan sehingga perkembangan saya terdokumentasi.

**Acceptance Scenarios:**

1. **Given** Chapter sudah membuat IDP untuk seorang Talent, **When** Talent membuka halaman IDP, **Then** Talent melihat seluruh komponen IDP miliknya: development objective, kondisi saat ini, gap, aksi pengembangan beserta statusnya, timeline & milestones, success indicators, dan riwayat review.
2. **Given** Talent memiliki aksi pengembangan, **When** Talent memperbarui status aksi (to do → in progress → completed), **Then** pembaruan tersimpan dan terlihat oleh Chapter pada tampilan progres IDP.
3. **Given** Talent belum memiliki IDP, **When** membuka halaman IDP, **Then** tampil keadaan kosong dengan penjelasan singkat (bukan error).
4. **Given** Talent lain mencoba mengakses IDP Talent A, **When** permintaan dikirim, **Then** sistem menolak (IDP hanya dapat dilihat oleh pemiliknya dan Chapter dari chapter yang sama).

### User Story 6 — Admin mengelola master data & akun user (Priority: P1)

Sebagai **Admin**, saya dapat mendefinisikan dan mengelola master data (Unit, Project, Role) serta mengelola akun user dan penetapan peran akses sehingga data operasional aplikasi konsisten mengacu pada referensi yang sama dan akses pengguna terkendali.

**Acceptance Scenarios:**

1. **Given** Admin sudah login, **When** menambahkan Unit baru dengan nama yang valid, **Then** Unit tersimpan dan muncul pada daftar Unit.
2. **Given** minimal satu Unit sudah terdaftar, **When** Admin membuat Project baru dengan memilih Unit pemiliknya, **Then** Project tersimpan dan tampil pada daftar Project beserta Unit-nya.
3. **Given** Admin mencoba membuat Project tanpa memilih Unit, **When** submit, **Then** sistem menolak dengan pesan validasi (Project wajib merujuk satu Unit).
4. **Given** Unit masih direferensikan oleh minimal satu Project, **When** Admin mencoba menghapus Unit tersebut, **Then** sistem menolak dengan penjelasan dependensi.
5. **Given** Admin menambahkan Role baru pada daftar Role, **When** submit, **Then** Role tersimpan dan muncul pada daftar Role.
6. **Given** Admin mengubah data master (mis. nama Unit), **When** disimpan, **Then** referensi pada data yang memakainya tetap valid tanpa penyesuaian manual.
7. **Given** Admin menambahkan akun user untuk seorang employee dan menetapkan peran aksesnya, **When** disimpan, **Then** akun tersimpan dan user dapat login dengan peran tersebut.
8. **Given** Admin mengubah peran akses seorang user, **When** perubahan disimpan, **Then** hak akses user mengikuti peran barunya.
9. **Given** Admin melebur beberapa chapter (menambah chapter baru dan memindahkan kepemilikan seluruh Role terkait kepadanya), **When** operasi selesai, **Then** seluruh talent pemakai Role tersebut otomatis berada di tanggung jawab chapter baru tanpa perubahan data karyawan maupun peran akses.

### User Story 7 — Chapter menilai performa talent secara periodik (Priority: P1)

Sebagai **Chapter**, saya dapat menilai performa talent dalam tanggung jawab chapter-nya untuk setiap periode evaluasi sehingga perkembangan talent terdokumentasi dan menjadi dasar rencana pengembangan berikutnya.

**Acceptance Scenarios:**

1. **Given** periode evaluasi berjalan dan talent dalam tanggung jawab chapter-nya tersedia, **When** Chapter membuka daftar evaluasi periode tersebut, **Then** terlihat talent yang belum dinilai dan yang sudah dinilai.
2. **Given** Chapter mengisi evaluasi seorang talent (jawaban per kriteria sesuai template evaluasi periode terkait, ringkasan pencapaian, catatan pengembangan) dengan konteks assignment aktif dan IDP berjalan talent tersebut, **When** submit, **Then** evaluasi tersimpan dan muncul pada daftar evaluasi periode itu.
3. **Given** Chapter merevisi evaluasi sebelum periode ditutup, **When** disimpan, **Then** evaluasi menampilkan versi terbaru dan riwayat perubahan tetap tersimpan.
4. **Given** Talent membuka halaman evaluasinya, **Then** Talent melihat evaluasi miliknya (hanya baca); Talent lain tidak dapat melihat evaluasi orang lain.
5. **Given** periode evaluasi berakhir dengan talent yang belum dinilai, **Then** talent tersebut ditandai belum dinilai pada daftar evaluasi Chapter.

### User Story 8 — Semua peran memantau melalui dashboard (Priority: P2)

Sebagai pengguna aplikasi, saya dapat melihat dashboard sesuai peran saya sehingga kondisi talent dan pengembangan terpantau tanpa menyusun laporan manual.

**Acceptance Scenarios:**

1. **Given** Chapter login, **When** membuka dashboard, **Then** tampil ringkasan talent dalam tanggung jawabnya: distribusi status IDP, progres aksi pengembangan, talent belum ter-assign, IDP perlu review, dan status evaluasi periode berjalan.
2. **Given** Talent login, **When** membuka dashboard, **Then** tampil ringkasan miliknya: assignment aktif, progres IDP (aksi per status), evaluasi terakhir, dan tenggat aksi pengembangan.
3. **Given** Operation login, **When** membuka dashboard, **Then** tampil ringkasan data karyawan: total karyawan aktif, distribusi divisi (Unit), karyawan non-assignable, dan perubahan data terbaru.
4. **Given** Admin login, **When** membuka dashboard, **Then** tampil ringkasan administrasi: distribusi talent per chapter, jumlah akun per peran akses, akun nonaktif, dan status master data.
5. **Given** data inti berubah (mis. Talent memperbarui status aksi), **When** dashboard dibuka, **Then** angka yang tampil konsisten dengan data terbaru tanpa sinkronisasi manual.

### Edge Cases

- Email atau employee ID duplikat saat menambah karyawan → ditolak dengan pesan validasi.
- Karyawan dinonaktifkan padahal masih punya assignment aktif atau IDP berjalan → sistem memberi peringatan sebelum nonaktif.
- Talent melihat halaman IDP sebelum Chapter membuat IDP → empty state yang jelas.
- Semua aksi pengembangan sudah completed tetapi success indicators belum dievaluasi → status IDP tidak otomatis selesai; penutupan IDP dilakukan oleh Chapter saat review.
- IDP melewati tanggal akhir timeline tanpa penutupan atau perpanjangan → IDP ditandai perlu review pada daftar IDP Chapter.
- User dengan peran A mencoba mengakses fungsi peran B → akses ditolak di sisi server.
- Karyawan dinonaktifkan → akun user terkait ikut dinonaktifkan sehingga tidak dapat login lagi.
- User ditetapkan peran akses Chapter tetapi posisi Employee-nya merujuk Role tanpa kepemilikan chapter → sistem menolak penetapan dengan penjelasan (cakupan chapter tidak terdefinisi).
- Kepemilikan chapter pada sebuah Role diubah oleh Admin → seluruh talent yang memakai Role tersebut otomatis berpindah tanggung jawab chapter, termasuk assignment/IDP yang sedang berjalan (menyusul FR-23, tanpa migrasi data manual).
- Karyawan dinonaktifkan di tengah periode evaluasi → evaluasi yang sudah ada tetap tampil sebagai data historis; karyawan tersebut tidak muncul untuk evaluasi baru.

## Requirements

### Functional Requirements

**Data karyawan (Operation)**

- **FR-01**: Sistem harus menyediakan tambah/ubah data karyawan oleh Operation dengan field: nama lengkap, employee ID, email, divisi (merujuk Master Data Unit), posisi (merujuk Master Data Role), tanggal bergabung, status (aktif/non-aktif). Divisi dan posisi dipilih dari master data — bukan isian bebas.
- **FR-02**: Sistem harus menyediakan daftar karyawan dengan pencarian (nama/email) dan filter (divisi, status).
- **FR-03**: Email dan employee ID harus unik; field wajib divalidasi.
- **FR-04**: Operation harus dapat menonaktifkan karyawan; karyawan non-aktif tidak muncul sebagai pilihan talent untuk assignment/IDP baru. Kandidat assignment/IDP adalah karyawan aktif yang assignable (lihat FR-23).

**Assignment (Chapter)**

- **FR-05**: Chapter harus dapat membuat assignment berisi: talent, project (pilihan merujuk Master Data Project), peran, periode (mulai–selesai), status. Pilihan project pada assignment hanya berasal dari Master Data Project. Status assignment: berjalan / selesai. Chapter hanya dapat meng-assign talent yang berada dalam tanggung jawab chapter-nya (FR-23); kandidat talent pada form assignment hanya talent aktif dan assignable dalam chapter-nya.
- **FR-06**: Chapter harus dapat mengubah dan mengakhiri assignment; mengakhiri berarti mengisi tanggal selesai dan mengubah status menjadi selesai. Riwayat assignment talent tetap tersimpan.
- **FR-07**: Chapter harus dapat melihat daftar assignment per talent dan per project — keduanya terbatas pada talent dalam tanggung jawab chapter-nya. Talent dapat melihat riwayat assignment miliknya sendiri (hanya baca); riwayat ini menjadi sumber data pengalaman kerja pada CV-nya.

**Individual Development Plan (Chapter & Talent)**

- **FR-08**: Chapter harus dapat membuat IDP untuk seorang talent dalam chapter-nya yang memuat: development objective (target peran/kapabilitas yang spesifik dan terikat pada ekspektasi peran), penilaian kondisi saat ini (kekuatan & keterbatasan), identifikasi gap (selisih kondisi saat ini vs yang dibutuhkan), aksi pengembangan (banyak entri), timeline & milestones (periode mulai–selesai dengan checkpoint), dan success indicators. Periode default IDP adalah satu kuartal (3 bulan). IDP dibuat dengan status **berjalan**; siklus status IDP: berjalan → perlu review → selesai.
- **FR-09**: Setiap aksi pengembangan harus dapat dilacak statusnya (to do / in progress / completed); Talent dapat memperbarui status aksi miliknya dan Chapter dapat memperbaruinya saat review.
- **FR-10**: Chapter harus dapat mencatat hasil review & monitoring berkala (tanggal, ringkasan hasil, tindak lanjut) dan merevisi IDP sebagai dokumen kerja yang diperbarui; riwayat perubahan IDP tetap tersimpan. Chapter menutup IDP (status → selesai) saat review setelah success indicators dievaluasi; IDP yang melewati akhir timeline tanpa penutupan otomatis berstatus perlu review.
- **FR-11**: Sistem harus menyediakan daftar IDP untuk Chapter yang dapat difilter per status, menampilkan progres tiap IDP. Daftar hanya memuat IDP talent yang berada dalam chapter yang sama dengan Chapter yang login.
- **FR-14**: Talent hanya dapat melihat IDP miliknya sendiri beserta progres dan riwayat review.

**Profil & CV (Talent)**

- **FR-12**: Talent harus dapat mengisi profil CV berbentuk form terstruktur: ringkasan profil, pendidikan (banyak entri), sertifikasi (banyak entri), keahlian (banyak entri). Bagian pengalaman kerja tidak diinput manual — terisi otomatis dari riwayat assignment talent (project, peran, periode).
- **FR-13**: Talent hanya dapat melihat dan mengedit CV miliknya sendiri. Chapter dapat melihat CV (hanya baca) talent dalam chapter yang sama dengannya; peran lain tidak dapat mengakses CV.

**Akses & keamanan**

- **FR-15**: Sistem harus menyediakan login dan role-based access control untuk empat peran akses yang fixed: Admin, Operation, Chapter, Talent. Admin mengelola akun user dan penetapan peran akses di dalam aplikasi (tambah/nonaktifkan akun, ubah peran); tidak ada pembuatan akun di luar aplikasi.
- **FR-16**: Operation tidak dapat mengubah assignment/IDP; Chapter tidak dapat mengubah data induk karyawan; Talent hanya dapat mengakses profil CV dan IDP miliknya; hanya Admin yang dapat mengelola master data. Chapter hanya dapat mengakses/mengelola IDP talent dalam tanggung jawab chapter-nya — cakupan diturunkan otomatis dari posisi Employee yang terhubung ke user melalui kepemilikan chapter pada Role (FR-22–FR-23), bukan definisi peran. Validasi ditegakkan di sisi server.
- **FR-17**: Setiap perubahan data inti (master data, karyawan, akun user, assignment, IDP, evaluasi performa & template evaluasi, profil CV) harus tercatat jejak auditnya; hanya Admin yang dapat melihat jejak audit tersebut.

**Master data (Admin)**

- **FR-18**: Admin harus dapat mengelola Master Data Unit (tambah/ubah/nonaktifkan) berisi minimal nama unit.
- **FR-19**: Admin harus dapat mengelola Master Data Project (tambah/ubah/nonaktifkan); setiap Project wajib merujuk tepat satu Unit.
- **FR-20**: Admin harus dapat mengelola Master Data Role (tambah/ubah/nonaktifkan). Master Data Role adalah peran jabatan/fungsional talent dalam organisasi yang mengikuti standar role perusahaan — bukan peran akses aplikasi, dan isian yang merujuknya tidak bebas. Peran akses aplikasi tetap fixed empat: Admin, Operation, Chapter, Talent.
- **FR-21**: Master data yang masih direferensikan data lain (mis. Unit yang dipakai Project) tidak dapat dihapus; penonaktifan hanya menghentikan pemakaian untuk data baru.
- **FR-22**: Setiap Master Data Role harus memiliki tepat satu chapter pemilik yang terdaftar pada Master Data Chapter (FR-24), atau tidak memiliki chapter sama sekali. Kepemilikan ini dikelola Admin pada Master Data Role dan menjadi satu-satunya sumber kebenaran tanggung jawab chapter.
- **FR-23**: Keter-assign-an dan tanggung jawab chapter diturunkan otomatis dari posisi → Role → chapter pemilik: (a) talent assignable jika posisinya merujuk Role yang dimiliki sebuah chapter; (b) chapter yang bertanggung jawab atas talent tersebut adalah chapter pemilik Role-nya; (c) karyawan dengan Role tanpa chapter tetap tercatat di Database Karyawan sebagai pencatatan, tetapi tidak dapat di-assign dan bukan kandidat IDP; (d) cakupan data user ber-peran Chapter adalah chapter pemilik Role posisi employeenya sendiri. Perubahan kepemilikan chapter pada sebuah Role otomatis memindahkan seluruh talent yang memakainya ke tanggung jawab chapter baru.
- **FR-24**: Admin harus dapat mengelola Master Data Chapter (tambah/ubah nama/nonaktifkan) — daftar chapter organisasi dengan nilai awal Product, Engineer, Design. Jumlah chapter bebas (satu, tiga, atau lebih). Konsolidasi chapter (mis. ketiganya melebur menjadi satu "Chapter Digital Talents" yang menangani seluruh assignable role) adalah operasi data murni oleh Admin: tambah chapter baru, pindahkan kepemilikan seluruh Role terkait ke chapter itu, nonaktifkan chapter lama — tanpa perubahan peran RBAC dan tanpa migrasi data karyawan, karena seluruh cakupan mengikuti turunan FR-23. Chapter yang masih dimiliki oleh minimal satu Role tidak dapat dihapus/dinonaktifkan.

**Evaluasi performa (Chapter & Talent)**

- **FR-25**: Sistem harus menyediakan periode evaluasi performa yang dikelola Admin (tambah/ubah/nonaktifkan), berisi nama dan tanggal mulai–selesai. Setiap periode terpinned ke satu template evaluasi saat dibuat. Periode evaluasi yang masih memiliki evaluasi terkait tidak dapat dihapus.
- **FR-26**: Chapter harus dapat membuat dan mengelola evaluasi performa untuk tiap talent dalam tanggung jawab chapter-nya (FR-23) per periode evaluasi — satu evaluasi per talent per periode. Form evaluasi mengikuti template periode terkait: jawaban per kriteria sesuai tipe jawabannya, ditambah ringkasan pencapaian dan catatan pengembangan. Form juga menampilkan konteks talent: assignment aktif dan IDP berjalan beserta progresnya. Evaluasi MVP hanya oleh Chapter (tanpa self-assessment).
- **FR-27**: Talent hanya dapat melihat evaluasi miliknya sendiri (hanya baca); Chapter dapat melihat evaluasi seluruh talent dalam tanggung jawabnya; peran lain tidak dapat mengakses evaluasi.
- **FR-28**: Evaluasi harus dapat direvisi oleh Chapter sebelum periode ditutup; riwayat perubahan tetap tersimpan. Periode yang berakhir dengan talent belum dinilai ditandai pada daftar evaluasi Chapter.
- **FR-31**: Admin harus dapat mengelola template evaluasi performa (framework penilaian): daftar kriteria dengan tipe jawaban yang dipilih dari set fixed — skala numerik 1–5, skala numerik 1–10, pilihan ya/tidak, teks bebas — beserta urutannya. Perubahan template setelah periode dibuat tidak memengaruhi periode yang sudah berjalan maupun evaluasi yang sudah tersimpan; perubahan hanya berlaku untuk periode berikutnya.

**Dashboard (semua peran)**

- **FR-29**: Sistem harus menyediakan dashboard per peran dengan cakupan data yang sama dengan hak akses peran masing-masing (FR-23, FR-27): Chapter melihat ringkasan talent dalam tanggung jawabnya, Talent melihat ringkasan miliknya, Operation melihat ringkasan data karyawan, Admin melihat ringkasan administrasi & master data. Rincian widget mengikuti User Story 8 (dikonfirmasi untuk MVP).
- **FR-30**: Angka pada dashboard harus konsisten dengan data terbaru tanpa langkah sinkronisasi manual; dashboard adalah tampilan agregat turunan dan tidak menyimpan data baru.

### Non-Functional Requirements

- Aplikasi berbasis web, responsif (desktop-first), antarmuka berbahasa Indonesia.
- Data pribadi karyawan hanya dapat diakses oleh user berotorisasi; kontrol akses peran ditegakkan di server.
- Daftar utama (karyawan, daftar IDP) dan dashboard tetap responsif hingga ±5.000 karyawan.

### Key Entities

- **Employee**: data induk karyawan (identitas, divisi → Unit, posisi → Role, status). Chapter tidak disimpan pada Employee — diturunkan dari posisi → Role → chapter pemilik (FR-23); karyawan dengan Role tanpa chapter bersifat pencatatan saja (tidak assignable). Satu employee memiliki satu akun user.
- **User & Role (akses)**: akun login dengan tepat satu peran akses yang fixed: Admin, Operation, Chapter, atau Talent; dikelola Admin (tambah/nonaktifkan akun, tetapkan peran). Cakupan data peran Chapter diturunkan dari kepemilikan chapter pada Role posisi Employee yang terhubung ke akun.
- **Unit**: master data unit organisasi, dikelola Admin.
- **Chapter (master data)**: daftar chapter organisasi (nama saja), dikelola Admin (FR-24); nilai awal Product, Engineer, Design — jumlah bebas dan dapat dikonsolidasi lewat operasi data.
- **Project (master data)**: master data project yang wajib merujuk satu Unit, dikelola Admin; menjadi satu-satunya sumber pilihan project pada assignment.
- **Role (master data)**: master data peran jabatan/fungsional talent mengikuti standar role perusahaan, dikelola Admin; dirujuk oleh posisi karyawan. Setiap Role dimiliki tepat satu chapter terdaftar (Master Data Chapter) atau tanpa chapter — dasar penentuan tanggung jawab chapter dan keter-assign-an (FR-22–FR-23).
- **Assignment**: penempatan seorang talent pada sebuah project (dari Master Data Project) untuk periode tertentu dengan peran tertentu. Riwayat assignment menjadi sumber data pengalaman kerja pada CV talent.
- **IndividualDevelopmentPlan (IDP)**: rencana pengembangan individual milik satu talent, dibuat dan dikelola Chapter; memuat development objective, penilaian kondisi saat ini, identifikasi gap, timeline & milestones, dan success indicators.
- **DevelopmentAction**: aksi pengembangan dalam sebuah IDP (deskripsi, metode — penugasan project, mentoring, training, exposure lintas fungsi, atau belajar mandiri — status to do/in progress/completed, tenggat).
- **ReviewLog**: catatan check-in review & monitoring antara Chapter dan talent (tanggal, ringkasan hasil, tindak lanjut).
- **CVProfile**: profil CV milik talent, terdiri atas ringkasan dan sub-data multi-entri (pendidikan, sertifikasi, keahlian) serta pengalaman kerja yang diturunkan otomatis dari riwayat assignment.
- **EvaluationPeriod**: periode evaluasi performa (nama, tanggal mulai–selesai, template evaluasi terpinned), dikelola Admin; mengikuti ritme kuartalan secara default.
- **EvaluationTemplate**: framework penilaian yang dikelola Admin — daftar kriteria, masing-masing dengan tipe jawaban dari set fixed (skala 1–5, skala 1–10, ya/tidak, teks bebas) dan urutan; terpinned ke periode evaluasi saat periode dibuat.
- **PerformanceEvaluation**: penilaian performa satu talent untuk satu periode evaluasi (satu per talent per periode), dibuat dan direvisi Chapter; jawaban per kriteria mengikuti template periode, ditambah ringkasan pencapaian dan catatan pengembangan; Talent hanya-baca.
- **Dashboard**: tampilan agregat yang sepenuhnya diturunkan dari entitas lain — tidak menyimpan data baru; cakupan datanya mengikuti hak akses peran.

## Success Criteria

- **SC-001**: Operation dapat menambahkan satu karyawan baru lengkap dalam waktu kurang dari 2 menit.
- **SC-002**: Seluruh halaman dan operasi tervalidasi sesuai peran (100% penolakan untuk akses lintas peran yang tidak diizinkan).
- **SC-003**: Chapter dapat membuat satu IDP lengkap dengan seluruh komponennya dalam waktu kurang dari 10 menit.
- **SC-004**: Talent baru dapat menyelesaikan profil CV pertamanya dalam waktu kurang dari 10 menit.
- **SC-005**: Pembaruan status aksi pengembangan oleh Talent atau Chapter tercermin pada tampilan progres IDP tanpa langkah sinkronisasi manual.
- **SC-006**: Chapter dapat menyelesaikan evaluasi performa satu talent dalam waktu kurang dari 5 menit.
- **SC-007**: Perubahan data inti tercermin pada dashboard setiap peran tanpa langkah sinkronisasi manual (100% kasus uji).

## Assumptions

- Satu user = satu employee; pengelolaan akun user & penetapan peran akses dilakukan Admin di dalam aplikasi (klarifikasi 2026-09-27).
- Chapter diperlakukan sebagai data konfigurasi (Master Data Chapter, FR-24), bukan peran RBAC — pendekatan ini disetujui stakeholder. Kepemilikan chapter tersimpan pada Master Data Role dan menurunkan segala hal lain (chapter talent, keter-assign-an, cakupan akses Chapter); konsolidasi chapter — termasuk melebur menjadi satu "Chapter Digital Talents" — cukup memindahkan kepemilikan Role tanpa mengubah definisi peran maupun data karyawan.
- Atribut Unit Origin & Unit Assignment pada assignment tidak digunakan: keduanya dapat diturunkan (asal talent = chapter pemilik Role posisinya; unit project = Unit pada Master Data Project), sehingga atribut eksplisit berisiko tidak sinkron. Bila tetap diinginkan sebagai kolom tersimpan, dapat ditambahkan kembali.
- Peran pada assignment diasumsikan juga merujuk Master Data Role (referensi jabatan standar); dapat disesuaikan bila peran assignment dimaksudkan berbeda.
- CV diinput sebagai form terstruktur — bukan upload file PDF — sesuai frasa "input data CV".
- Bagian pengalaman kerja pada CV bukan input manual: diturunkan otomatis dari riwayat assignment talent (klarifikasi 2026-09-27).
- Chapter bertindak sebagai manajer pengembangan talent: IDP dibuat, direview, dan diperbarui oleh Chapter; Talent berpartisipasi dengan memperbarui progres aksi pengembangan miliknya.
- Struktur IDP mengikuti tujuh komponen sesuai artikel Mekari Talenta "Individual Development Plan: A Framework for Employee Growth".
- Bahasa antarmuka: Indonesia.
- Periode evaluasi performa mengikuti ritme kuartalan secara default (selaras periode IDP), dapat disesuaikan lewat periode yang dikelola Admin.
- Framework penilaian performa belum ditetapkan jangka panjang — karena itu template evaluasi dikonfigurasikan Admin (kriteria + tipe jawaban fixed) dan terpinned per periode: perubahan framework menjadi operasi data, bukan perubahan kode.

## Out of Scope

- Integrasi HRIS/payroll eksternal.
- Import CV dari file PDF atau parsing dokumen.
- Alur approval/ACK formal atas IDP.
- Notifikasi email.
- Penyelenggaraan konten pelatihan/LMS dan penilaian berbasis kuis — aplikasi hanya melacak aksi pengembangan, bukan menyelenggarakan pelatihannya.
- Perencanaan suksesi dan rekomendasi promosi otomatis — IDP hanya mencatat rencana dan progres pengembangan.
- Penetapan kenaikan jabatan/kompensasi berdasarkan hasil evaluasi — evaluasi performa hanya mencatat penilaian, tidak memicu keputusan SDM otomatis.
- Ekspor laporan (PDF/Excel) dari dashboard dan evaluasi.
- Self-assessment oleh Talent pada evaluasi performa — MVP penilaian Chapter-only; dapat ditambahkan belakangan.
- Import template evaluasi dari file (Excel/CSV) — template didefinisikan melalui form Admin; import file dapat ditambahkan belakangan.

## Dependencies

- Belum ditetapkan — akan diidentifikasi pada fase `/speckit.plan`.

## Review & Acceptance Checklist

- [ ] Semua item NEEDS CLARIFICATION sudah terselesaikan (pada fase `/speckit.clarify`).
- [ ] Setiap requirement spesifik dan dapat diuji.
- [ ] Success criteria terukur.
- [ ] Out of scope disepakati bersama stakeholder.
