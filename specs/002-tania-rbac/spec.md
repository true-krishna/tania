# Feature Specification: RBAC Tania (Kontrol Akses Berbasis Peran)

**Feature Branch**: `002-tania-rbac`

**Created**: 2026-10-08

**Revisi**: 2026-10-08 (clarify 1) — Keputusan pemilik produk (TAN-144): hak baca modul Assignment diberikan kepada **Operation** (lihat semua, hanya baca) dan tidak lagi kepada Admin; baris Assignment pada Matriks Peran & Modul disesuaikan. Perubahan assignment tetap hanya Chapter, Talent tetap melihat miliknya, dan FR-16 induk tidak berubah (ia hanya melarang Operation *mengubah* assignment).
**Revisi**: 2026-10-08 (clarify 2, diperjelas clarify 3) — Keputusan pemilik produk (TAN-144): modul IDP dan evaluasi performa (termasuk periode & template evaluasi) **keluar dari prioritas iterasi 2**. Kedua fungsi tetap bagian produk Tania — **bukan digantikan WAD**; saat dibangun kembali, keduanya akan mengonsumsi data aktivitas/beban kerja dari sistem existing **WAD** (project "Tania WAD Integration Module") sebagai input berkorelasi: bukti capaian bagi evaluasi, dasar identifikasi kebutuhan pengembangan bagi IDP. Baris terkait pada Matriks Peran & Modul ditandai ditunda — definisi aksesnya tetap terdokumentasi untuk bila modul diaktifkan kembali; selama ditunda, modul diperlakukan belum tersedia (deny-by-default).
**Revisi**: 2026-10-12 (amandemen post-analyze, TAN-144/TAN-156) — Catatan matriks: "lihat semua" pada Data karyawan bagi Admin bersifat administratif read-only (konteks penautan akun, tanpa riwayat assignment); proteksi Admin terakhir diperluas mencakup perubahan peran menjauh dari Admin; catatan status FR-18/US4-4 terhadap workstream kontrak kerja; checklist keputusan baru dicentang (keputusan klarifikasi terkonfirmasi).
**Revisi**: 2026-10-15 (clarify 4, TAN-212) — Keputusan pemilik produk: **Admin = kelola penuh** pada seluruh modul aktif. Baris *Data karyawan & kontrak kerja* Admin berubah dari "lihat semua" menjadi **kelola**; baris *Assignment* dan *Profil CV* dibuka untuk Admin (**kelola**). Ini **membalik clarify 1** (Assignment: Admin "—") dan menggantikan catatan "administratif read-only" (klarifikasi 2026-10-09). Modul bertanda \* (IDP, evaluasi performa, periode & template evaluasi) **tetap ditunda as is** — belum dibuka untuk peran mana pun, termasuk Admin.

**Status**: Draft

**Input**: User description: "Buat spesifikasi detail RBAC TANIA via /speckit.specify (TAN-144); referensi penyusunan: `specs/001-employee-digital-talent-management/spec.md`"

> Spesifikasi ini diturunkan dari `specs/001-employee-digital-talent-management/spec.md` — menyatukan dan merinci seluruh ketentuan kontrol akses yang pada spesifikasi induk tersebar di banyak bagian (FR-15–FR-17, FR-20, FR-22–FR-23, FR-35, FR-37, FR-39, FR-41–FR-46, User Story 6 beserta edge case terkait) menjadi satu spesifikasi RBAC yang berdiri sendiri: peran akses, matriks akses per modul, siklus hidup akun user, autentikasi & sesi, cakupan data Chapter (chapter-as-data), penegakan sisi server, dan jejak audit. Fungsionalitas bisnis tiap modul (data karyawan, assignment, IDP, evaluasi performa, CV, master data) tetap didefinisikan pada spesifikasi induk dan tidak diulang di sini; pemetaan rujukan ada di bagian Rujukan Silang.

## Ringkasan

RBAC (Role-Based Access Control) Tania mengatur siapa boleh melakukan apa di dalam aplikasi. Setiap akun user terhubung ke tepat satu karyawan dan memegang tepat satu peran akses dari empat peran tetap — Admin, Operation, Chapter, Talent. Admin mengelola akun user dan penetapan peran aksesnya di dalam aplikasi. Hak akses per modul mengikuti satu matriks peran (bagian Matriks Peran & Modul) dan ditegakkan sepenuhnya di sisi server pada setiap permintaan — penyembunyian menu/aksi di antarmuka hanya kenyamanan dan bukan batas keamanan. Cakupan data peran Chapter diturunkan otomatis dari kontrak aktif karyawan yang terhubung ke akun (posisi → Master Data Role → chapter pemilik), tanpa atribut chapter tersimpan pada akun — pendekatan chapter-as-data yang disetujui stakeholder. Setiap perubahan akun dan peran tercatat pada jejak audit yang hanya dapat dilihat Admin.

## Matriks Peran & Modul

Matriks ini adalah satu-satunya definisi hak akses per modul (FR-03). Makna nilai:

- **kelola** — membuat, mengubah, dan menjalankan operasi siklus hidup modul tersebut.
- **lihat** — membaca data modul.
- **lihat cakupan** — membaca hanya data dalam tanggung jawab chapter-nya (diturunkan FR-18).
- **—** — tidak diberikan; setiap permintaan ditolak di sisi server.

| Modul | Admin | Operation | Chapter | Talent |
| --- | --- | --- | --- | --- |
| Autentikasi & sesi (login, logout, perpanjangan sesi, profil sendiri) | ✔ | ✔ | ✔ | ✔ |
| Dashboard | ringkasan administrasi & master data | ringkasan data karyawan | ringkasan cakupan chapter | ringkasan miliknya |
| Data karyawan & kontrak kerja (termasuk provisi akun Entra) | kelola | kelola | lihat cakupan (per talent) | lihat data diri |
| Assignment | kelola | lihat semua | kelola (cakupan chapter) | lihat miliknya |
| IDP * | — | — | kelola (cakupan chapter) | lihat & perbarui progres miliknya |
| Evaluasi performa (pengisian & revisi) * | — | — | kelola (cakupan chapter, periode berjalan) | lihat miliknya |
| Periode evaluasi * | kelola | — | lihat | lihat |
| Template evaluasi * | kelola | — | lihat (template periode yang dinilai) | — |
| Profil CV | kelola | — | lihat cakupan (hanya baca) | kelola miliknya |
| Master data (Unit, Project, Role, Chapter) | kelola | lihat | lihat | lihat |
| Akun user & peran akses | kelola | — | — | — |
| Jejak audit | lihat penuh | — | — | — |

Catatan matriks:

- Riwayat perubahan per record karyawan/kontrak tetap terlihat Operation pada detail data tersebut — bukan melalui modul jejak audit (FR-41 induk).
- "lihat cakupan (per talent)" pada Data karyawan berarti Chapter membaca record talent dalam chapter-nya satu per satu (mis. dari daftar IDP/assignment); daftar seluruh karyawan bukan modul Chapter.
- **Admin = kelola penuh** (keputusan pemilik produk 2026-10-15, TAN-212): pada seluruh modul aktif — termasuk Assignment dan Profil CV — Admin berwenang penuh (membuat, mengubah, menjalankan operasi siklus hidup modul), bukan sekadar membaca. Catatan "administratif read-only" pada baris Data karyawan & kontrak kerja (klarifikasi 2026-10-09) dan baris Assignment "—" (clarify 1) tidak berlaku lagi. Cakupan data Chapter tidak membatasi Admin — Admin melihat dan mengelola semua.
- Modul bertanda \* tetap **ditunda as is** (keputusan yang sama, 2026-10-15): baris IDP, evaluasi performa, periode, dan template evaluasi tidak berubah — aksesnya belum dibuka untuk peran mana pun, termasuk Admin.
- Angka dashboard mengikuti hak akses peran masing-masing (FR-29 induk); dashboard hanya tampilan agregat turunan.
- Matriks berlaku deny-by-default: modul atau operasi baru yang belum tercantum ditolak untuk semua peran sampai matriks diperbarui (FR-03).
- \* **Ditunda dari iterasi 2** (keputusan 2026-10-08, TAN-144): fungsi IDP dan evaluasi performa tidak dibangun pada iterasi ini. Keduanya tetap fungsi Tania dan **berkorelasi — bukan substitusi — dengan WAD**: data aktivitas/beban kerja dari WAD menjadi bukti capaian bagi evaluasi dan dasar identifikasi kebutuhan pengembangan bagi IDP saat modul dibangun kembali. Selama ditunda, modul diperlakukan belum tersedia — akses ditolak untuk semua peran; definisi akses pada matriks tetap berlaku bila modul diaktifkan kembali.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pengguna masuk dan memperoleh sesi sesuai peran aksesnya (Priority: P1)

Sebagai **pemegang akun** (salah satu dari empat peran), saya dapat login dengan email dan kata sandi sehingga saya memperoleh sesi yang membawa peran akses saya, dan saya dapat keluar atau memperpanjang sesi tanpa login ulang selama akun saya aktif.

**Why this priority**: Autentikasi adalah gerbang seluruh RBAC — tanpa sesi yang membawa peran, tidak ada modul yang dapat memberikan akses yang tepat; seluruh user story lain mengasumsikan sesi berjalan.

**Independent Test**: Dapat diuji penuh dengan login untuk satu akun aktif tiap peran, memverifikasi sesi terbuka dan modul yang tersedia mengikuti matriks perannya, lalu logout dan login ulang.

**Acceptance Scenarios**:

1. **Given** akun aktif dengan salah satu peran, **When** login dengan email dan kata sandi yang benar, **Then** sesi terbuka dan modul yang tersedia mengikuti Matriks Peran & Modul untuk peran tersebut.
2. **Given** email terdaftar, **When** login dengan kata sandi salah, **Then** login ditolak dengan pesan umum yang tidak membocorkan apakah email atau kata sandi yang salah.
3. **Given** akun berstatus nonaktif, **When** login dengan kredensial yang benar, **Then** login ditolak dengan pesan bahwa akun tidak aktif.
4. **Given** sesi berjalan, **When** user logout, **Then** sesi berakhir dan akses berikutnya menuntut login ulang.
5. **Given** sesi berjalan dan akun tetap aktif, **When** user memperpanjang sesi sebelum berakhir, **Then** sesi diperpanjang tanpa login ulang; setelah logout atau pencabutan sesi, perpanjangan ditolak.

---

### User Story 2 - Admin mengelola akun user dan penetapan peran akses (Priority: P1)

Sebagai **Admin**, saya dapat membuat akun user untuk seorang karyawan beserta peran aksesnya, mengubah peran tersebut, menonaktifkan/mengaktifkan akun, dan mencabut seluruh sesi suatu akun sehingga akses pengguna ke aplikasi selalu sesuai tanggung jawabnya.

**Why this priority**: Pengelolaan akun adalah satu-satunya pintu masuk pengguna ke aplikasi (tidak ada pembuatan akun di luar aplikasi — FR-15 induk); tanpa story ini tidak ada akun yang dapat diatur perannya.

**Independent Test**: Dapat diuji penuh dengan login sebagai Admin, membuat satu akun dengan peran tertentu, memverifikasi user dapat login sesuai perannya, lalu mengubah peran dan menonaktifkan akun serta memverifikasi efeknya.

**Acceptance Scenarios**:

1. **Given** Admin sudah login dan karyawan aktif tersedia, **When** membuat akun (pilih karyawan, isi email, tetapkan peran akses, isi kata sandi sementara), **Then** akun tersimpan aktif dan user dapat login dengan peran tersebut.
2. **Given** email sudah dipakai akun lain, **When** membuat akun dengan email itu, **Then** sistem menolak dengan pesan validasi yang jelas.
3. **Given** karyawan sudah memiliki akun, **When** Admin membuat akun kedua untuk karyawan yang sama, **Then** sistem menolak (satu akun per karyawan).
4. **Given** Admin menetapkan peran Chapter untuk karyawan yang posisinya merujuk Role tanpa chapter pemilik, **When** disimpan, **Then** sistem menolak penetapan dengan penjelasan bahwa cakupan chapter tidak terdefinisi.
5. **Given** Admin mengubah peran akses seorang user, **When** perubahan disimpan, **Then** hak akses user mengikuti peran barunya.
6. **Given** Admin menonaktifkan sebuah akun, **When** pemiliknya mencoba login atau memperpanjang sesi, **Then** keduanya ditolak.
7. **Given** Admin mencabut sesi seorang user, **When** pencabutan selesai, **Then** seluruh sesi aktif user tersebut berakhir tanpa mengubah status akunnya.
8. **Given** daftar akun berisi banyak entri, **When** Admin mencari nama/email atau memfilter per peran dan status, **Then** hanya hasil yang sesuai yang tampil.

---

### User Story 3 - Akses modul ditegakkan di sisi server sesuai matriks peran (Priority: P1)

Sebagai **pemilik sistem**, saya memastikan setiap operasi divalidasi terhadap Matriks Peran & Modul di sisi server pada setiap permintaan sehingga tidak ada akses yang lolos meskipun antarmuka menyembunyikan modul tersebut.

**Why this priority**: Penegakan sisi server adalah inti keamanan RBAC (FR-16 induk; konstitusi keamanan III) — tanpa itu, penyembunyian menu di antarmuka menjadi satu-satunya penghalang yang dapat dilewati siapa pun.

**Independent Test**: Dapat diuji penuh dengan mengirim permintaan langsung ke tiap modul sebagai tiap peran (tanpa melalui menu) dan memverifikasi 100% operasi di luar matriks ditolak.

**Acceptance Scenarios**:

1. **Given** user dengan peran tertentu, **When** mencoba operasi modul yang tidak diberikan kepada perannya (mis. Operation mengubah assignment, Chapter mengubah data karyawan, Talent mengelola master data), **Then** permintaan ditolak di sisi server dengan penjelasan yang jelas.
2. **Given** user belum login, **When** mengakses modul mana pun selain login dan perpanjangan sesi, **Then** permintaan ditolak.
3. **Given** user mencoba membaca data di luar cakupannya (mis. Talent membuka profil talent lain), **When** permintaan dikirim, **Then** respons menyatakan data tidak ditemukan — sama seperti data yang memang tidak ada — sehingga keberadaan data tidak dapat ditebak.
4. **Given** modul atau operasi baru belum tercantum pada matriks, **When** peran mana pun mencoba mengaksesnya, **Then** permintaan ditolak (deny-by-default) sampai matriks diperbarui.

---

### User Story 4 - Cakupan data Chapter diturunkan otomatis dari kontrak aktif (Priority: P1)

Sebagai **Chapter**, saya hanya bekerja dengan talent dalam tanggung jawab chapter saya — diturunkan otomatis dari kontrak aktif → posisi (Master Data Role) → chapter pemilik — sehingga cakupan saya selalu benar tanpa pengaturan manual.

**Why this priority**: Cakupan otomatis (chapter-as-data) adalah pembeda utama RBAC Tania — ia menjamin isolasi data antar chapter dan menghilangkan pengaturan cakupan manual yang rawan salah; tanpa ini, seluruh modul milik Chapter bocor lintas chapter.

**Independent Test**: Dapat diuji penuh dengan login sebagai dua Chapter dari chapter berbeda dan memverifikasi masing-masing hanya melihat talent pada chapter-nya di seluruh modul berkakipan chapter.

**Acceptance Scenarios**:

1. **Given** Chapter sudah login, **When** membuka daftar modul berkakipan chapter yang aktif (saat ini assignment; IDP dan evaluasi performa mengikuti status penundaan pada catatan matriks), **Then** hanya talent dalam tanggung jawab chapter-nya yang tampil.
2. **Given** Chapter membuka detail seorang talent, **When** talent tersebut berada di luar chapter-nya, **Then** data dinyatakan tidak ditemukan (anti-enumerasi).
3. **Given** Admin mengubah kepemilikan chapter pada sebuah Master Data Role, **When** operasi selesai, **Then** seluruh talent pemakai Role tersebut — dan cakupan Chapter terkait — otomatis mengikuti chapter baru tanpa migrasi data.
4. **Given** kontrak aktif seorang talent berpindah ke Role milik chapter lain (mutasi/perpanjangan), **When** Chapter lama membuka datanya, **Then** talent tersebut tidak lagi berada dalam cakupannya; Chapter baru yang melihatnya. *(Eksekusi skenario ini menunggu ketersediaan rantai kontrak aktif — lihat catatan FR-18.)*
5. **Given** akun ber-peran Chapter yang employeenya merujuk Role tanpa chapter pemilik (atau tanpa kontrak aktif), **When** membuka modul berkakipan chapter, **Then** akses ditolak dengan penjelasan bahwa cakupan tidak terdefinisi.

---

### User Story 5 - Perubahan peran dan status akun berlaku segera (Priority: P2)

Sebagai **Admin**, saya ingin perubahan peran atau status akun berlaku segera sehingga akses usang tidak bertahan lebih lama dari yang diperlukan.

**Why this priority**: Merefinekatkan keputusan administrasi secara langsung menutup celah "akses usang"; nilai keamanannya tinggi namun berdiri di atas fondasi US1–US4 yang lebih dulu menentukan siapa boleh apa.

**Independent Test**: Dapat diuji penuh dengan mengubah peran lalu menonaktifkan akun yang sedang berpesan sesi, dan memverifikasi efeknya pada operasi berikutnya tanpa login ulang.

**Acceptance Scenarios**:

1. **Given** user sedang memiliki sesi aktif, **When** Admin mengubah peran aksesnya, **Then** operasi berikutnya pada sesi tersebut sudah mengikuti peran baru.
2. **Given** user sedang memiliki sesi aktif, **When** Admin menonaktifkan akunnya, **Then** sesi tidak dapat diperpanjang dan login baru ditolak.
3. **Given** akun nonaktif, **When** Admin mengaktifkannya kembali, **Then** pemiliknya dapat login kembali dengan peran yang tercatat.

---

### User Story 6 - Jejak audit atas akun dan peran akses (Priority: P2)

Sebagai **Admin**, saya dapat menelusuri seluruh perubahan akun user — pembuatan, perubahan peran, perubahan status, pencabutan sesi — sehingga setiap keputusan akses dapat dipertanggungjawabkan.

**Why this priority**: Jejak audit menuntut akuntabilitas administrasi akses (konstitusi keamanan III; FR-17/FR-41 induk); ia tidak mengubah perilaku akses apa pun sehingga menyusul setelah model akses berjalan.

**Independent Test**: Dapat diuji penuh dengan melakukan satu perubahan akun sebagai Admin dan memverifikasi entri jejak auditnya (aktor, waktu, aksi, nilai sebelum→sesudah), serta penolakan akses jejak audit oleh peran lain.

**Acceptance Scenarios**:

1. **Given** Admin membuat akun / mengubah peran / mengubah status / mencabut sesi, **When** aksi tersimpan, **Then** jejak audit mencatat aktor, waktu, jenis aksi, dan nilai sebelum→sesudah.
2. **Given** user berperan selain Admin, **When** membuka modul jejak audit, **Then** akses ditolak.
3. **Given** jejak audit memuat perubahan akun, **When** Admin menelusurinya, **Then** tidak ada kata sandi atau rahasia lain yang tampil pada jejak tersebut.

### Edge Cases

- Penetapan peran Chapter kepada karyawan yang posisinya merujuk Role tanpa chapter pemilik → ditolak saat pembuatan akun maupun perubahan peran, dengan penjelasan cakupan tidak terdefinisi.
- Email sudah terdaftar pada akun lain, atau karyawan sudah memiliki akun → ditolak dengan pesan validasi.
- Mencoba menonaktifkan **atau mengubah peran menjauh dari Admin** pada satu-satunya akun Admin aktif → ditolak agar aplikasi selalu memiliki Admin yang dapat mengelola akun.
- Karyawan dinonaktifkan / resign / pensiun → akun user terkait ikut dinonaktifkan dan sesinya tidak dapat diperpanjang; pada resign/pensiun akun Entra yang dikelola ikut dinonaktifkan (FR-37, FR-39, FR-43–FR-46 induk).
- Perubahan peran terjadi saat sesi aktif → peran baru berlaku untuk operasi berikutnya; tidak perlu login ulang.
- Pembacaan data di luar cakupan → respons "tidak ditemukan" yang identik dengan data yang memang tidak ada (anti-enumerasi).
- Percobaan login gagal berulang dari sumber yang sama → lajunya dibatasi oleh sistem.
- Karyawan dinonaktifkan → peran pada akunnya tetap tersimpan namun akun nonaktif tidak dapat login; bila karyawan diaktifkan kembali, akun mengikuti status yang ditetapkan Admin (tidak otomatis aktif).

## Requirements *(mandatory)*

### Functional Requirements

**Model peran & akses**

- **FR-01**: Peran akses aplikasi adalah empat peran tetap — Admin, Operation, Chapter, Talent — dan setiap akun memegang tepat satu peran; tidak ada peran ganda, peran kustom, maupun penyuntingan izin per user. *(FR-15, FR-20 induk)*
- **FR-02**: Setiap akun terhubung ke tepat satu karyawan; pembuatan akun wajib memilih karyawannya. *(Asumsi induk: satu user = satu employee.)*
- **FR-03**: Matriks Peran & Modul adalah satu-satunya definisi hak akses dan berlaku deny-by-default: operasi yang tidak diberikan kepada peran peminta ditolak; modul baru wajib masuk matriks sebelum dapat diakses.

**Akun user (Admin)**

- **FR-04**: Admin harus dapat membuat akun berisi: karyawan terkait, email (valid dan unik antar akun), peran akses, dan kata sandi sementara; akun bermula aktif. Satu karyawan maksimal memiliki satu akun.
- **FR-05**: Admin harus dapat mengubah peran akses sebuah akun; perubahan berlaku segera (FR-17). Penetapan peran Chapter divalidasi terhadap keterdefinisian cakupan chapter karyawan terkait (FR-20) dan ditolak bila cakupan tidak terdefinisi.
- **FR-06**: Admin harus dapat menonaktifkan dan mengaktifkan kembali akun. Penonaktifan mencabut seluruh sesi aktif dan memblokir login; pengaktifan kembali membuka login dengan peran yang tercatat. Penonaktifan satu-satunya akun Admin aktif ditolak.
- **FR-07**: Admin harus dapat mencabut seluruh sesi sebuah akun tanpa mengubah status akunnya.
- **FR-08**: Admin harus dapat melihat daftar akun dengan pencarian (nama/email) dan filter per peran serta status, termasuk peran, status, karyawan terkait, dan waktu login terakhir tiap akun.
- **FR-09**: Siklus hidup akun mengikuti siklus karyawan: penonaktifan karyawan menonaktifkan akunnya; resign dan pensiun juga menonaktifkan akun Entra yang dikelola sistem (FR-37, FR-39, FR-43–FR-46 induk). Pengaktifan kembali karyawan tidak otomatis mengaktifkan akunnya.

**Autentikasi & sesi**

- **FR-10**: Login menggunakan email dan kata sandi; hanya akun aktif yang dapat login. Kegagalan login disampaikan dengan pesan umum yang tidak membocorkan penyebabnya.
- **FR-11**: Sesi dimulai saat login, diakhiri logout, dan dapat diperpanjang tanpa login ulang selama akun tetap aktif dan sesi tidak dicabut; perpanjangan setelah logout atau pencabutan ditolak.
- **FR-12**: Kata sandi minimal 12 karakter; kata sandi tidak pernah ditampilkan kembali dalam bentuk terbaca. Kata sandi sementara diset Admin saat pembuatan akun dan disampaikan kepada user melalui saluran terpisah dari aplikasi.
- **FR-13**: Sistem harus membatasi laju percobaan login yang gagal berulang dari sumber yang sama.

**Penegakan otorisasi**

- **FR-14**: Seluruh otorisasi ditegakkan di sisi server pada setiap permintaan, terlepas dari apa yang ditampilkan antarmuka; penyembunyian menu/aksi di antarmuka bukan batas keamanan. *(FR-16 induk)*
- **FR-15**: Deny-by-default: permintaan tanpa sesi ditolak pada seluruh modul kecuali login dan perpanjangan sesi; operasi yang tidak diberikan kepada peran peminta ditolak dengan penjelasan yang jelas.
- **FR-16**: Pembacaan data di luar cakupan peminta disampaikan sebagai "data tidak ditemukan" — tidak dapat dibedakan dari data yang memang tidak ada (anti-enumerasi); input tak valid tetap disampaikan sebagai kesalahan validasi.
- **FR-17**: Keputusan otorisasi selalu membaca data akun terkini — perubahan peran atau status berlaku untuk operasi berikutnya tanpa menunggu login ulang.

**Cakupan chapter (chapter-as-data)**

- **FR-18**: Cakupan Chapter diturunkan otomatis dari rantai tunggal: akun → karyawan → kontrak aktif → posisi (Master Data Role) → chapter pemilik; tidak ada atribut chapter tersimpan pada akun. *(FR-22, FR-23, FR-35 induk)*
  Catatan iterasi 2 (2026-10-12): rantai *kontrak aktif* berlaku penuh bersama workstream kontrak kerja (TAN-140/TAN-145). Sampai itu, cakupan diturunkan dari posisi karyawan saat ini (jobRole → chapter pemilik) melalui antarmuka helper cakupan yang sama; isolasi antar chapter tetap diuji (US4-1/2/3/5).
- **FR-19**: Bagi peran Chapter, modul berkakipan chapter — saat ini assignment, baca CV, dan detail talent; IDP serta evaluasi performa mengikuti status penundaan pada catatan matriks — hanya memuat talent dalam cakupan; kandidat pada form hanya karyawan aktif dan assignable dalam cakupan tersebut.
- **FR-20**: Akun ber-peran Chapter yang cakupannya tidak terdefinisi (posisinya merujuk Role tanpa chapter pemilik, atau tanpa kontrak aktif) ditolak pada modul berkakipan chapter dengan penjelasan yang jelas; penetapannya dicegah sejak pengelolaan akun (FR-05).
- **FR-21**: Perubahan kepemilikan chapter pada sebuah Master Data Role otomatis memindahkan seluruh talent pemakainya — dan cakupan Chapter terkait — tanpa migrasi data karyawan maupun peran akses. *(FR-23 induk)*

**Jejak audit**

- **FR-22**: Setiap pembuatan akun, perubahan peran, perubahan status, dan pencabutan sesi harus tercatat pada jejak audit: aktor, waktu, jenis aksi, dan nilai sebelum→sesudah. *(Memperluas FR-17 induk ke akun user.)*
- **FR-23**: Jejak audit penuh hanya dapat dilihat Admin; riwayat perubahan per record karyawan/kontrak tetap terlihat Operation pada detail data tersebut. *(FR-41 induk)*
- **FR-24**: Jejak audit tidak pernah memuat kata sandi maupun rahasia lain; data pribadi sensitif tampil tersamar. *(FR-42 induk)*

### Non-Functional Requirements

- Kontrol akses berlaku least privilege dan selalu ditegakkan di sisi server — prinsip konstitusi keamanan III.
- Seluruh halaman dan operasi tervalidasi sesuai matriks — 100% penolakan untuk akses lintas peran yang tidak diizinkan.
- Daftar akun dan filternya tetap responsif hingga ±5.000 akun.
- Log sistem tidak memuat data pribadi; kegagalan otorisasi terekam pada log operasional tanpa membocorkan isi data.
- Pembatasan laju percobaan login gagal bekerja otomatis tanpa konfigurasi per pengguna.

### Key Entities

- **User (akun)**: identitas login — email unik, nama (mengikuti karyawan terkait), tepat satu peran akses, status (aktif/nonaktif), karyawan terkait, waktu login terakhir.
- **AccessRole (peran akses)**: himpunan tetap Admin, Operation, Chapter, Talent — berbeda dari Master Data Role yang merupakan peran jabatan organisasi.
- **AccountStatus**: aktif / nonaktif; menentukan kebolehan login dan perpanjangan sesi.
- **Session**: dibuka saat login, dapat diperpanjang selama akun aktif, diakhiri logout atau pencabutan; pencabutan massal per akun tersedia untuk Admin.
- **AuditEntry**: catatan aktor, waktu, jenis aksi, entitas, dan nilai sebelum→sesudah atas setiap perubahan akun.
- **ChapterScope (turunan)**: bukan entitas tersimpan — nilai turunan dari rantai akun → karyawan → kontrak aktif → posisi → chapter pemilik (FR-18).

## Success Criteria *(mandatory)*

- **SC-001**: 100% percobaan akses lintas peran / di luar matriks ditolak di sisi server (terverifikasi lewat uji matriks per modul).
- **SC-002**: Perubahan peran dan status akun berlaku pada operasi berikutnya pada 100% kasus uji — tanpa jendela akses usang yang menuntut login ulang.
- **SC-003**: Admin dapat membuat satu akun lengkap dengan perannya dalam waktu kurang dari 2 menit, dan akun tersebut dapat langsung login.
- **SC-004**: Seluruh daftar modul berkakipan chapter menampilkan 0 record di luar tanggung jawab chapter Chapter yang login.
- **SC-005**: Respons pembacaan di luar cakupan tidak dapat dibedakan dari data yang tidak ada (terverifikasi lewat uji anti-enumerasi).
- **SC-006**: 100% perubahan akun/peran memiliki entri jejak audit yang dapat ditelusuri Admin.

## Assumptions

- Empat peran akses tetap dan pendekatan chapter-as-data membawa terus keputusan spesifikasi induk (disetujui stakeholder, 2026-09-27).
- Proteksi "satu-satunya akun Admin aktif tidak dapat dinonaktifkan" adalah default keamanan yang dipilih karena belum ada ketentuan induk — perlu konfirmasi pemilik produk.
- Pembatasan laju login gagal adalah praktik standar keamanan; ambang spesifiknya ditetapkan pada fase rencana teknis.
- Kata sandi sementara disampaikan Admin kepada user melalui saluran di luar aplikasi; notifikasi email tetap di luar cakupan (induk).
- Perubahan kata sandi mandiri oleh user belum termasuk spesifikasi ini (kata sandi saat ini hanya diset Admin saat pembuatan akun); dapat ditambahkan belakangan.
- Akun Admin pertama disiapkan sekali melalui proses bootstrap inisialisasi sistem di luar alur aplikasi; setelah itu seluruh akun dikelola Admin di dalam aplikasi (selaras FR-15 induk).
- Kebijakan kata sandi minimal 12 karakter mengikuti kebijakan yang sudah diterapkan pada implementasi.
- Mekanika teknis sesi (token berumur pendek + perpanjangan, penyimpan pencabutan) dirinci pada fase `/speckit.plan`, bukan pada spesifikasi ini.

## Out of Scope

- Peran kustom, penyuntingan izin per-halaman/per-aksi, dan akun multi-peran — matriks empat peran tetap adalah keseluruhan model.
- Login Single Sign-On (SSO) melalui Microsoft Entra ID — Entra hanya dipakai untuk provisi akun talent (FR-43–FR-46 induk), bukan autentikasi aplikasi.
- Perubahan kata sandi mandiri, MFA/2FA, dan pemulihan akun mandiri.
- Alur approval/persetujuan permintaan akses.
- Delegasi tugas Admin kepada peran lain.
- Personalisasi tampilan di luar matriks (mis. preferensi layout per user).

## Dependencies

- Spesifikasi induk `specs/001-employee-digital-talent-management/spec.md`: modul-modul yang diatur matriksnya, master data (Role → chapter pemilik), data karyawan & kontrak aktif (sumber cakupan Chapter), dan alur provisi/penonaktifan akun Entra.
- Akun Admin awal melalui proses bootstrap inisialisasi sistem.
- Rincian teknis penegakan (titik pemeriksaan otorisasi, mekanika sesi) mengikuti fase `/speckit.plan`.

## Rujukan Silang ke Spesifikasi Induk

| Spesifikasi ini | Spesifikasi induk (`specs/001-employee-digital-talent-management/spec.md`) |
| --- | --- |
| US1 | FR-15 (login & RBAC); US6 skenario 7–8 |
| US2 | US6 (skenario 7–8); FR-15 |
| US3 | FR-16; FR-23 |
| US4 | FR-22, FR-23, FR-35; FR-16 |
| US5 | FR-16; US6 (skenario 8) |
| US6 | FR-17; FR-41 |
| FR-01 | FR-15, FR-20 |
| FR-02 | Asumsi induk "satu user = satu employee" |
| FR-03 | FR-16 |
| FR-04–FR-08 | FR-15 (Admin mengelola akun & penetapan peran); US6 |
| FR-09 | FR-37, FR-39, FR-43–FR-46 |
| FR-10–FR-13 | FR-15 |
| FR-14–FR-17 | FR-16 |
| FR-18–FR-21 | FR-22, FR-23, FR-35 |
| FR-22–FR-24 | FR-17, FR-41, FR-42 |
| Matriks Peran & Modul | FR-16 (pemisahan hak per peran); US8 (dashboard per peran) |

## Review & Acceptance Checklist

- [x] Semua bagian wajib terisi dan konsisten dengan spesifikasi induk.
- [x] Setiap requirement spesifik dan dapat diuji (matriks per modul dapat dieksekusi sebagai uji per peran).
- [x] Success criteria terukur dan agnostik teknologi.
- [x] Edge cases diidentifikasi, termasuk cakupan tidak terdefinisi dan siklus akun mengikuti karyawan.
- [x] Asumsi dan dependensi diidentifikasi.
- [x] Keputusan baru di luar spesifikasi induk disepakati bersama pemilik produk (klarifikasi TAN-144): proteksi satu-satunya akun Admin aktif — menonaktifkan maupun mengubah peran menjauh dari Admin; pembatasan laju login — ambang dipin di plan (10 gagal / 15 menit / sumber); tanpa perubahan kata sandi mandiri — kredensial dikelola Entra.
