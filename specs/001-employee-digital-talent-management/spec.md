# Feature Specification: Aplikasi Employee (Digital Talent) Management

**Feature Branch**: `001-employee-digital-talent-management`
**Created**: 2026-09-25
**Status**: Draft
**Input**: /speckit-specify Buat aplikasi employee (digital talent) management dengan target user Chapter sebagai pengelola data assignment dan data talent competency, Operation sebagai pengelola yang memasukkan data karyawan, dan Talent yang dapat membangun profil dengan input data CV dan melihat competency matrix.

## Ringkasan

Aplikasi web untuk mengelola data karyawan digital talent dalam satu tempat: data induk karyawan dikelola Operation, data assignment dan talent competency dikelola Chapter, dan setiap Talent dapat membangun profilnya sendiri dengan mengisi data CV serta melihat competency matrix. Tiga peran dengan hak akses yang dipisahkan tegas.

## User Scenarios & Testing

### User Story 1 — Operation mengelola data karyawan (Priority: P1)

Sebagai **Operation**, saya dapat menambahkan dan mengelola data induk karyawan sehingga basis data talent selalu mutakhir.

**Acceptance Scenarios:**

1. **Given** Operation sudah login, **When** mengisi form karyawan baru dengan semua field wajib dan submit, **Then** data karyawan tersimpan dan muncul di daftar karyawan.
2. **Given** karyawan sudah terdaftar, **When** Operation mengubah data (mis. divisi, posisi, status), **Then** perubahan tersimpan dan tampil di detail karyawan.
3. **Given** field wajib kosong atau email/employee ID duplikat, **When** submit, **Then** sistem menolak dengan pesan validasi yang jelas.
4. **Given** daftar karyawan berisi banyak entri, **When** Operation mencari nama atau memfilter divisi/status, **Then** daftar hanya menampilkan hasil yang sesuai.
5. **Given** karyawan sudah tidak aktif, **When** Operation menonaktifkan karyawan, **Then** karyawan tidak muncul sebagai pilihan talent baru untuk assignment/competency.

### User Story 2 — Chapter mengelola data assignment (Priority: P1)

Sebagai **Chapter**, saya dapat membuat dan mengelola assignment talent sehingga penempatan tiap talent terdokumentasi.

**Acceptance Scenarios:**

1. **Given** Chapter sudah login dan karyawan aktif tersedia, **When** membuat assignment (talent, project/engagement, peran, periode), **Then** assignment tersimpan dan muncul pada riwayat talent.
2. **Given** assignment aktif berjalan, **When** Chapter mengubah atau mengakhirinya (isi tanggal selesai), **Then** riwayat assignment memperlihatkan versi terbaru tanpa menghapus history.
3. **Given** Chapter membuka detail seorang talent, **When** melihat daftar assignment, **Then** terlihat semua assignment talent tersebut beserta periodenya.
4. **Given** Chapter membuka daftar assignment per project, **When** memilih project, **Then** terlihat semua talent yang ter-assign beserta perannya.

### User Story 3 — Chapter mengelola competency & competency matrix (Priority: P1)

Sebagai **Chapter**, saya dapat menetapkan competency beserta level untuk tiap talent dan melihat competency matrix seluruh talent.

**Acceptance Scenarios:**

1. **Given** katalog competency tersedia, **When** Chapter menetapkan competency + level untuk seorang talent, **Then** penetapan tersimpan dan langsung tercermin di competency matrix.
2. **Given** talent sudah memiliki competency, **When** Chapter mengubah level atau menghapus penetapan, **Then** matrix menampilkan kondisi terbaru.
3. **Given** Chapter membuka halaman competency matrix, **When** matrix dirender, **Then** terlihat grid talent × competency dengan level pada setiap sel, dan dapat difilter per divisi.
4. **Given** katalog belum punya competency yang dibutuhkan, **When** Chapter menambahkan competency baru ke katalog, **Then** competency dapat langsung dipakai untuk penetapan.

### User Story 4 — Talent membangun profil dengan data CV (Priority: P2)

Sebagai **Talent**, saya dapat mengisi data CV milik saya sehingga profil saya lengkap dan terawat.

**Acceptance Scenarios:**

1. **Given** Talent sudah login pertama kali, **When** membuka halaman profil CV, **Then** tersedia form terstruktur: ringkasan profil, pendidikan, pengalaman kerja, sertifikasi, keahlian.
2. **Given** Talent mengisi satu atau lebih bagian CV, **When** menyimpan, **Then** data bagian tersebut tersimpan dan tampil pada profil Talent tersebut.
3. **Given** Talent memiliki data CV tersimpan, **When** mengedit dan menyimpan kembali, **Then** hanya profil miliknya yang berubah.
4. **Given** Talent lain mencoba mengakses profil Talent A, **When** permintaan dikirim, **Then** sistem menolak (hanya pemilik dan peran pengelola yang boleh).

### User Story 5 — Talent melihat competency matrix (Priority: P2)

Sebagai **Talent**, saya dapat melihat competency matrix sehingga tahu posisi kompetensi saya.

**Acceptance Scenarios:**

1. **Given** Chapter sudah menetapkan competency untuk seorang Talent, **When** Talent membuka halaman competency matrix, **Then** Talent melihat kompetensi dan level miliknya.
2. **Given** Talent belum memiliki penetapan competency, **When** membuka halaman matrix, **Then** tampil keadaan kosong dengan penjelasan singkat (bukan error).

### Edge Cases

- Email atau employee ID duplikat saat menambah karyawan → ditolak dengan pesan validasi.
- Karyawan dinonaktifkan padahal masih punya assignment aktif → sistem memberi peringatan sebelum nonaktif.
- Competency katalog dihapus padahal sudah dipakai di matrix → penetapan yang ada dilindungi (hapus ditolak atau perlu konfirmasi).
- Talent melihat matrix sebelum Chapter menetapkan apa pun → empty state yang jelas.
- User dengan peran A mencoba mengakses fungsi peran B → akses ditolak di sisi server.

## Requirements

### Functional Requirements

**Data karyawan (Operation)**

- **FR-01**: Sistem harus menyediakan tambah/ubah data karyawan oleh Operation dengan field: nama lengkap, employee ID, email, divisi, posisi, tanggal bergabung, status (aktif/non-aktif).
- **FR-02**: Sistem harus menyediakan daftar karyawan dengan pencarian (nama/email) dan filter (divisi, status).
- **FR-03**: Email dan employee ID harus unik; field wajib divalidasi.
- **FR-04**: Operation harus dapat menonaktifkan karyawan; karyawan non-aktif tidak muncul sebagai pilihan talent untuk assignment/competency baru.

**Assignment (Chapter)**

- **FR-05**: Chapter harus dapat membuat assignment berisi: talent, nama project/engagement, peran, periode (mulai–selesai), status. *[NEEDS CLARIFICATION: bentuk assignment belum didefinisikan — apakah penempatan pada project internal, engagement klien, atau peran dalam tim?]*
- **FR-06**: Chapter harus dapat mengubah dan mengakhiri assignment; riwayat assignment talent tetap tersimpan.
- **FR-07**: Chapter harus dapat melihat daftar assignment per talent dan per project/engagement.

**Competency (Chapter)**

- **FR-08**: Chapter harus dapat mengelola katalog competency (nama, deskripsi, kategori).
- **FR-09**: Chapter harus dapat menetapkan competency dan level untuk tiap talent. *[NEEDS CLARIFICATION: skala level belum didefinisikan, mis. 1–4 (Basic, Intermediate, Advanced, Expert)]*
- **FR-10**: Sistem harus menyediakan competency matrix berupa grid talent × competency dengan level pada tiap sel, dapat difilter per divisi.
- **FR-11**: Setiap perubahan penetapan competency harus tercatat (siapa, kapan, perubahan apa).

**Profil & CV (Talent)**

- **FR-12**: Talent harus dapat mengisi profil CV berbentuk form terstruktur: ringkasan profil, pendidikan (banyak entri), pengalaman kerja (banyak entri), sertifikasi (banyak entri), keahlian (banyak entri).
- **FR-13**: Talent hanya dapat melihat dan mengedit CV miliknya sendiri.
- **FR-14**: Talent harus dapat melihat competency matrix. *[NEEDS CLARIFICATION: apakah Talent melihat hanya matrix miliknya sendiri, atau matrix seluruh talent?]*

**Akses & keamanan**

- **FR-15**: Sistem harus menyediakan login dan role-based access control untuk tiga peran: Chapter, Operation, Talent.
- **FR-16**: Operation tidak dapat mengubah assignment/competency; Chapter tidak dapat mengubah data induk karyawan; Talent hanya dapat mengakses profil miliknya. Validasi ditegakkan di sisi server.
- **FR-17**: Setiap perubahan data inti (karyawan, assignment, competency) harus tercatat jejak auditnya.

### Non-Functional Requirements

- Aplikasi berbasis web, responsif (desktop-first), antarmuka berbahasa Indonesia.
- Data pribadi karyawan hanya dapat diakses oleh user berotorisasi; kontrol akses peran ditegakkan di server.
- Daftar utama (karyawan, matrix) tetap responsif hingga ±5.000 karyawan.

### Key Entities

- **Employee**: data induk karyawan (identitas, divisi, posisi, status). Satu employee memiliki satu akun user.
- **User & Role**: akun login dengan tepat satu peran: Chapter, Operation, atau Talent.
- **Assignment**: penempatan seorang talent pada project/engagement untuk periode tertentu.
- **Competency**: definisi kompetensi dalam katalog (nama, deskripsi, kategori).
- **TalentCompetency**: penetapan sebuah competency + level untuk seorang talent (sel dalam matrix).
- **CVProfile**: profil CV milik talent, terdiri atas ringkasan dan sub-data multi-entri (pendidikan, pengalaman kerja, sertifikasi, keahlian).

## Success Criteria

- **SC-001**: Operation dapat menambahkan satu karyawan baru lengkap dalam waktu kurang dari 2 menit.
- **SC-002**: Seluruh halaman dan operasi tervalidasi sesuai peran (100% penolakan untuk akses lintas peran yang tidak diizinkan).
- **SC-003**: Chapter dapat membuka competency matrix seluruh talent dalam satu klik tanpa konfigurasi tambahan.
- **SC-004**: Talent baru dapat menyelesaikan profil CV pertamanya dalam waktu kurang dari 10 menit.
- **SC-005**: Perubahan competency oleh Chapter tercermin di competency matrix tanpa langkah sinkronisasi manual.

## Assumptions

- Satu user = satu employee; peran awal ditetapkan saat pembuatan akun (seeding/admin di luar cakupan fitur ini).
- CV diinput sebagai form terstruktur — bukan upload file PDF — sesuai frasa "input data CV".
- Competency matrix bersifat read-only bagi Talent; penetapan competency hanya oleh Chapter.
- Bahasa antarmuka: Indonesia.

## Out of Scope

- Integrasi HRIS/payroll eksternal.
- Import CV dari file PDF atau parsing dokumen.
- Alur approval/ACK atas penetapan competency.
- Notifikasi email.
- Learning path, training, dan penilaian kompetensi berbasis kuis.

## Dependencies

- Belum ditetapkan — akan diidentifikasi pada fase `/speckit.plan`.

## Review & Acceptance Checklist

- [ ] Semua item NEEDS CLARIFICATION sudah terselesaikan (pada fase `/speckit.clarify`).
- [ ] Setiap requirement spesifik dan dapat diuji.
- [ ] Success criteria terukur.
- [ ] Out of scope disepakati bersama stakeholder.
