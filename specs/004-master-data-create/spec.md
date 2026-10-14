# Feature Specification: Tambah Master Data (Create) — Job Role, Initiative, Unit

**Feature Branch**: `004-master-data-create`

**Created**: 2026-10-14

**Status**: Draft — satu keputusan otorisasi menunggu ratifikasi pemilik produk

**Input**: /speckit.specify (TAN-187) — "add create for Job Role, Initiative, and Unit. Only operational can do CRUD for master data."

> Permintaan menyebut tiga daftar: **Job Role**, **Initiative**, dan **Unit**. "Initiative" dipetakan ke **Master Data Project** — keputusan pemilik produk pada TAN-180 (2026-10-13), tidak dibuka kembali di sini. Spesifikasi ini menambahkan operasi **Create** pada ketiga daftar tersebut dan mengatur otorisasinya. Perilaku daftar (kolom, pencarian, paginasi, ubah, aktif/non-aktif) sudah didefinisikan pada `specs/003-master-data-search/spec.md` (pencarian) dan `specs/003-master-data/spec.md` (modul Master Data, Final) serta spesifikasi induk `specs/001-employee-digital-talent-management/spec.md` (User Story 6) — tidak diulang di sini.

**Relasi ke spesifikasi lain**:

- **Melengkapi** `specs/003-master-data/spec.md` (modul Master Data — daftar, ubah, aktif/non-aktif) yang secara eksplisit **belum** memuat operasi Create (lihat FR-15 modul: "Behavior existing di luar daftar Action … tidak diubah oleh spesifikasi ini") dan `specs/003-master-data-search/spec.md` (pencarian).
- **Mengamandemen** `specs/001-employee-digital-talent-management/spec.md` FR-15/FR-16/FR-18–FR-20 dan baris **Master data** pada Matriks Peran & Modul `specs/002-tania-rbac/spec.md` — lihat FR-010 dan bagian *Perlu Keputusan Pemilik Produk*.

## Ringkasan

Master Data organisasi (Unit, Job Role, Project/Initiative) adalah referensi bersama yang dipakai modul lain (data karyawan, kontrak, assignment, cakupan chapter). Saat ini pengelolaannya hanya tersedia bagi Admin, dan Create belum menjadi bagian yang disepakati dari modul Master Data. Permintaan ini menambahkan kemampuan **menambah (Create)** Unit, Job Role, dan Initiative pada halaman Master Data, sekaligus menetapkan bahwa **hanya Operation** yang boleh melakukan operasi pengelolaan (Create/Update/Deactivate) atas master data — sejalan dengan perannya sebagai pengelola data operasional, dan ditegakkan di sisi server, bukan hanya di antarmuka.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operation menambahkan Unit baru (Priority: P1)

Sebagai **Operation**, saya dapat menambahkan Unit baru dari halaman Master Data → Unit, sehingga unit organisasi baru langsung tersedia sebagai referensi bersama (mis. untuk membuat Project/Initiative) tanpa menunggu pihak lain.

**Why this priority**: Unit adalah referensi yang menjadi prasyarat Project/Initiative dan turunan cakupan chapter; tanpa Unit baru, pekerjaan membuat Initiative baru terhambat. Dibangun lebih dulu agar dua cerita berikutnya dapat mengacu padanya.

**Independent Test**: Dapat diuji penuh dengan login sebagai Operation, membuka halaman Unit, menambah satu Unit dengan nama valid, dan memastikan Unit muncul pada daftar — tidak bergantung pada Job Role/Initiative.

**Acceptance Scenarios**:

1. **Given** Operation sudah login dan berada pada halaman Master Data → Unit, **When** menambah Unit baru dengan nama yang valid dan submit, **Then** Unit tersimpan berstatus aktif dan langsung muncul pada daftar Unit.
2. **Given** Operation submit Unit tanpa nama (atau nama hanya berisi spasi), **When** submit, **Then** sistem menolak dengan pesan validasi yang jelas dan tidak ada data yang berubah.
3. **Given** sudah ada Unit dengan nama yang sama, **When** Operation menambah Unit dengan nama itu, **Then** sistem menolak (nama Unit unik) dengan pesan yang jelas dan tidak ada data yang berubah.
4. **Given** Operation berhasil menambahkan Unit lalu membuka form Initiative, **When** daftar Unit pada form dimuat, **Then** Unit yang baru dibuat tersedia sebagai pilihan Unit in Charge.

---

### User Story 2 - Operation menambahkan Job Role baru (Priority: P2)

Sebagai **Operation**, saya dapat menambahkan Job Role baru dari halaman Master Data → Job Role, sehingga peran jabatan baru tersedia sebagai referensi posisi karyawan/kontrak.

**Why this priority**: Job Role adalah referensi jabatan yang dipakai kontrak kerja dan turunan cakupan chapter; melengkapi pola Create yang sama dengan Unit setelah pola dasarnya (US1) ditetapkan.

**Independent Test**: Dapat diuji penuh dengan login sebagai Operation, membuka halaman Job Role, menambah satu Job Role dengan nama valid, dan memastikan Job Role muncul pada daftar.

**Acceptance Scenarios**:

1. **Given** Operation sudah login dan berada pada halaman Master Data → Job Role, **When** menambah Job Role baru dengan nama valid dan submit, **Then** Job Role tersimpan berstatus aktif dan muncul pada daftar Job Role.
2. **Given** model existing mengizinkan Job Role merujuk chapter/Owner Unit, **When** Operation mengisi referensi tersebut dengan nilai valid (atau membiarkannya kosong bila opsional), **Then** Job Role tersimpan sesuai referensi yang dipilih.
3. **Given** Operation submit Job Role tanpa nama, **When** submit, **Then** sistem menolak dengan pesan validasi yang jelas dan tidak ada data yang berubah.
4. **Given** referensi yang dipilih (mis. chapter) tidak valid/tidak ada, **When** submit, **Then** sistem menolak dengan pesan yang jelas dan tidak ada data yang berubah.

---

### User Story 3 - Operation menambahkan Initiative (Project) baru (Priority: P2)

Sebagai **Operation**, saya dapat menambahkan Initiative baru — dipetakan ke Master Data Project — dari halaman Master Data → Initiative, dengan memilih Unit in Charge-nya, sehingga wadah inisiatif kerja baru tercatat lengkap dengan unit pemiliknya.

**Why this priority**: Melengkapi permintaan; bergantung pada ketersediaan Unit (US1), jadi dikerjakan setelah Unit dan Job Role.

**Independent Test**: Dapat diuji penuh dengan login sebagai Operation, memastikan minimal satu Unit terdaftar, menambah Initiative dengan nama + Unit, dan memastikan tersimpan serta tampil beserta Unit in Charge-nya.

**Acceptance Scenarios**:

1. **Given** minimal satu Unit sudah terdaftar, **When** Operation membuat Initiative baru dengan nama valid dan memilih Unit in Charge, **Then** Initiative tersimpan berstatus aktif dan tampil pada daftar Initiative beserta Unit-nya.
2. **Given** Operation mencoba membuat Initiative tanpa memilih Unit in Charge, **When** submit, **Then** sistem menolak dengan pesan validasi (Initiative wajib merujuk tepat satu Unit) dan tidak ada data yang berubah.
3. **Given** Operation submit Initiative tanpa nama, **When** submit, **Then** sistem menolak dengan pesan validasi yang jelas dan tidak ada data yang berubah.
4. **Given** tidak ada Unit yang terdaftar sama sekali, **When** Operation membuka form Initiative, **Then** form menjelaskan bahwa Unit harus dibuat lebih dulu (tidak dapat submit Initiative tanpa Unit).

---

### User Story 4 - Hanya Operation yang dapat mengelola master data (Priority: P1)

Sebagai **pemilik sistem**, saya memastikan operasi Create/Update/Deactivate master data (Unit, Job Role, Initiative) hanya dapat dijalankan oleh peran Operation, ditegakkan di sisi server pada setiap permintaan — sehingga antarmuka bukan batas keamanan.

**Why this priority**: Inti permintaan ini adalah otorisasi; tanpa penegakan yang benar, penambahan Create membuka permukaan tulis master data bagi peran yang salah.

**Independent Test**: Dapat diuji penuh dengan mengirim permintaan Create/Update/Deactivate master data sebagai tiap peran (Operation, Admin, Chapter, Talent) dan memverifikasi hanya Operation yang diterima; 100% peran lain ditolak di sisi server.

**Acceptance Scenarios**:

1. **Given** Operation sudah login, **When** menjalankan Create/Update/Deactivate atas Unit, Job Role, atau Initiative (melalui UI maupun request langsung), **Then** operasi diizinkan sesuai validasi data.
2. **Given** user berperan selain Operation (Admin, Chapter, Talent) — termasuk yang mengakses langsung ke API tanpa melalui menu, **When** menjalankan Create/Update/Deactivate master data, **Then** permintaan ditolak di sisi server (mis. `FORBIDDEN`) dan tidak ada data yang berubah.
3. **Given** user belum login, **When** menjalankan operasi master data apa pun, **Then** permintaan ditolak.
4. **Given** sebuah modul atau operasi baru belum tercantum pada matriks akses, **When** peran mana pun mencoba mengaksesnya, **Then** permintaan ditolak (deny-by-default) sampai matriks diperbarui.

---

### Edge Cases

- Nama hanya berisi spasi → diperlakukan sebagai kosong → ditolak validasi (nama wajib).
- Nama duplikat (tidak membedakan besar/kecil huruf untuk Unit/Job Role/Initiative bila aturan existing berlaku) → ditolak dengan pesan jelas, tanpa mengubah data.
- Submit ganda (double submit) pada form Create → dicegah; kontrol submit terkunci selama request berjalan dan input user dipertahankan bila request gagal.
- Create Initiative tanpa Unit terdaftar → form menuntut Unit dibuat lebih dulu; tidak ada Initiative yatim.
- Create berhasil saat daftar sedang tersaring kata kunci → baris baru tampil bila namanya cocok dengan kata kunci, dan tidak tampil bila tidak; kata kunci tidak menghalangi penyimpanan (konsisten dengan FR pencarian `003-master-data-search`).
- Penonaktifan (bukan penghapusan) tetap menjadi satu-satunya cara menghentikan pemakaian master data; aplikasi tidak menyediakan operasi hapus (FR-21 induk) — Create tidak mengubah ketentuan ini.
- Kegagalan jaringan/API saat submit → pesan error yang jelas, tidak ada data yang berubah, input dipertahankan.
- Perubahan otorisasi berlaku untuk operasi berikutnya pada sesi berjalan (tanpa menuntut login ulang) — konsisten dengan FR-17 `002-tania-rbac`.

## Requirements *(mandatory)*

### Functional Requirements

**Operasi Create (Unit, Job Role, Initiative)**

- **FR-001**: Halaman Master Data → Unit MUST menyediakan aksi tambah Unit; Operation MUST dapat membuat Unit dengan nama yang valid, dan Unit tersimpan berstatus aktif serta muncul pada daftar Unit.
- **FR-002**: Halaman Master Data → Job Role MUST menyediakan aksi tambah Job Role; Operation MUST dapat membuat Job Role dengan nama yang valid (beserta referensi opsional yang didukung model existing, mis. chapter/Owner Unit), dan Job Role tersimpan berstatus aktif serta muncul pada daftar.
- **FR-003**: Halaman Master Data → Initiative (Master Data Project) MUST menyediakan aksi tambah Initiative; Operation MUST dapat membuat Initiative dengan nama valid dan **tepat satu Unit in Charge**, dan Initiative tersimpan berstatus aktif serta tampil beserta Unit-nya.
- **FR-004**: Nama entitas MUST wajib diisi; submit dengan nama kosong/spasi ditolak dengan pesan validasi yang jelas dan tidak mengubah data.
- **FR-005**: Nama entitas MUST unik bila aturan existing menetapkan keunikan; pelanggaran ditolak di sisi server dengan pesan yang jelas dan tidak mengubah data.
- **FR-006**: Initiative MUST merujuk tepat satu Unit; submit tanpa Unit ditolak dengan pesan validasi (selaras FR-19 induk). Referensi yang tidak valid/tidak ada ditolak.
- **FR-007**: Setiap Create MUST menampilkan umpan balik sukses/gagal yang jelas; ketika operasi gagal, tidak ada data yang berubah dan input user dipertahankan.
- **FR-008**: Create MUST menolak submit ganda selama request berjalan (kontrol submit terkunci) agar tidak ada data ganda.
- **FR-009**: Entitas baru MUST terlihat oleh modul lain yang merujuknya (mis. Unit baru tersedia pada form Initiative; Job Role baru tersedia sebagai referensi posisi) tanpa penyesuaian manual.

**Otorisasi (amandemen matriks)**

- **FR-010**: Operasi pengelolaan master data — Create, Update, dan Deactivate untuk Unit, Job Role, dan Initiative — MUST hanya dapat dijalankan oleh peran **Operation**; peran lain ditolak. **[NEEDS CLARIFICATION: apakah "hanya operational" berarti Operation menggantikan Admin sebagai pengelola master data (baris Matriks Peran & Modul `002-tania-rbac` berubah dari Admin "kelola" menjadi Operation "kelola", Admin kehilangan hak kelola), atau Operation berbagi hak kelola bersama Admin? Dan apakah Admin/Chapter/Talent tetap memiliki hak **lihat/baca** master data untuk kebutuhan referensi (picker pada form modul lain) — karena "CRUD" secara literal mencakup Read? Rekomendasi default di Assumptions.]**
- **FR-011**: Otorisasi MUST ditegakkan sepenuhnya di sisi server pada setiap permintaan (UI/route/penyembunyian menu bukan batas keamanan); permintaan tanpa sesi ditolak dan operasi di luar matriks ditolak dengan penjelasan yang jelas.
- **FR-012**: Antarmuka MUST menampilkan menu/halaman Master Data beserta aksi pengelolaan sesuai peran yang berhak (Operation) dan menyembunyikannya dari peran lain; menyembunyikan menu bukan pengganti penegakan server (FR-011).
- **FR-013**: Perubahan otorisasi ini MUST tercatat sebagai amandemen eksplisit pada Matriks Peran & Modul `002-tania-rbac` dan FR terkait pada `001-employee-digital-talent-management` saat spesifikasi ini disetujui — tidak boleh ada dua sumber kebenaran yang saling bertentangan.

**Keutuhan operasi master data existing**

- **FR-014**: Create MUST tidak mengubah ketentuan master data existing: Update dan aktif/non-aktif tetap berlaku, **tidak ada operasi hapus** (FR-21 induk), dan penonaktifan tetap ditolak bila data masih direferensikan.
- **FR-015**: Create MUST hanya menambah atribut yang didukung model existing; tidak menambah field baru di luar cakupan permintaan (perluasan field Job Role/Unit/Initiative berada di luar spesifikasi ini).
- **FR-016**: Setiap pembuatan master data MUST tercatat pada jejak audit (aktor, waktu, jenis aksi, nilai sesudah) sesuai FR-17 induk.

### Key Entities *(include if feature involves data)*

- **Unit**: entitas referensi organisasi; ditambah (Create) oleh Operation; nama menjadi atribut wajib; tidak ada perubahan skema baru di luar yang sudah ada.
- **JobRole**: entitas referensi jabatan; ditambah oleh Operation; nama wajib, referensi chapter/Owner Unit opsional sesuai model existing.
- **Project (Initiative)**: entitas referensi inisiatif kerja; ditambah oleh Operation; nama wajib dan wajib merujuk tepat satu Unit (Unit in Charge).
- **AuditEntry**: catatan pembuatan master data (aktor, waktu, jenis aksi, nilai sesudah) — diturunkan dari FR-17 induk.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operation dapat menambahkan satu Unit, Job Role, dan Initiative masing-masing dalam waktu kurang dari 1 menit per entri, dan entri langsung tampil pada daftar terkait.
- **SC-002**: 100% percobaan Create/Update/Deactivate master data oleh peran selain Operation (termasuk request langsung ke API tanpa melalui menu) ditolak di sisi server.
- **SC-003**: 0 data master dibuat dengan referensi wajib yang hilang (Initiative tanpa Unit; entitas tanpa nama) — seluruh submit tidak valid tertolak tanpa mengubah data.
- **SC-004**: 100% pembuatan master data memiliki entri jejak audit yang dapat ditelusuri.
- **SC-005**: 0 referensi rusak pada modul yang memakai master data setelah Create (entitas baru langsung dapat dipakai tanpa penyesuaian manual).

## Assumptions

- **Pemetaan "Initiative" = Master Data Project** adalah keputusan pemilik produk (TAN-180, 2026-10-13), bukan asumsi terbuka.
- **Working assumption untuk FR-010** (menunggu ratifikasi): Operation menjadi **satu-satunya peran** yang dapat melakukan pengelolaan (Create/Update/Deactivate) master data — baris Matriks Peran & Modul berubah menjadi **Operation: kelola**; Admin kehilangan hak kelola master data; hak **baca/lihat** master data untuk kebutuhan referensi (dropdown pada form modul lain) **tetap** dimiliki peran sesuai matriks berjalan (Admin/Operation/Chapter/Talent). Bila "CRUD" dimaksudkan literal termasuk Read saja milik Operation, form referensi modul lain harus diubah agar tidak bergantung pada modul master data — perubahan yang jauh lebih besar; keputusan ini menentukan apakah perlu revisi tambahan.
- Perubahan otorisasi ini membalik keputusan lama (spec 001 FR-16 "hanya Admin yang dapat mengelola master data"; spec 002 matriks Master data Admin: kelola) sehingga **wajib diratifikasi** pemilik produk sebelum fase `/speckit.plan`; spesifikasi ini mencatat amandemennya (FR-013).
- Create memakai pola halaman & komponen Master Data existing (`MasterDataSection` + form tambah yang sudah ada) dan operasi create server-side existing (`createUnit`, `createJobRole`, `createProject`); tidak ada dependensi baru.
- Perluasan atribut Job Role (Job Category, Owner Unit), Unit (Unit Code, Unit Type, Division, PIC), dan Initiative (Type, Status) mengikuti `specs/003-master-data/spec.md`; spesifikasi ini hanya menambahkan operasi Create atas model yang berlaku.
- Label UI berbahasa Indonesia; tidak ada PII pada URL/log.
- Penonaktifan master data yang masih direferensikan tetap ditolak di server (FR-21 induk).

## Out of Scope

- Operasi hapus master data (tidak tersedia di aplikasi — FR-21 induk).
- Perubahan perilaku Update / aktif-non-aktif dan pencarian daftar di luar yang sudah ditetapkan (`003-master-data`, `003-master-data-search`).
- Penambahan/perubahan field baru pada Unit, Job Role, atau Initiative (Job Title, Job Category, Unit Code, dsb.) — di luar cakupan permintaan Create.
- Modul Master Data Chapter (submenu disembunyikan — keputusan 2026-10-13) dan akun user/peran akses.
- Perubahan model empat peran tetap (Admin, Operation, Chapter, Talent) — hanya baris hak akses master data yang diamandemen.
- Perubahan pemetaan "Initiative" (tetap = Master Data Project).

## Dependencies

- `specs/001-employee-digital-talent-management/spec.md` — US6, FR-15/FR-16/FR-18–FR-20 (pengelolaan master data), FR-21 (tanpa hapus), FR-17 (jejak audit).
- `specs/002-tania-rbac/spec.md` — Matriks Peran & Modul (baris Master data yang diamandemen) dan penegakan otorisasi server-side (FR-14–FR-17).
- `specs/003-master-data/spec.md` (modul Master Data — daftar, kolom, ubah, aktif/non-aktif) dan `specs/003-master-data-search/spec.md` (pencarian daftar).
- Operasi create server-side existing (`createUnit`, `createJobRole`, `createProject`) pada `tania-backend` beserta penyesuaian otorisasi; halaman & komponen Master Data pada `tania-dashboard`.

## Rujukan Silang

| Spesifikasi ini | Spesifikasi terkait |
| --- | --- |
| US1 Unit | FR-18 induk; `003-master-data` US2 (Unit) |
| US2 Job Role | FR-20 induk; `003-master-data` US1 (Job Role) |
| US3 Initiative | FR-19 induk; `003-master-data` US3 (Initiative = Project) |
| FR-001–FR-003 | US6 skenario 1/2/5 induk (daftar yang dikelola) |
| FR-006 | FR-19 induk (Project wajib merujuk satu Unit); US6 skenario 3 |
| FR-010–FR-013 | FR-15/FR-16 induk; Matriks Peran & Modul `002-tania-rbac` (baris Master data) — **diamandemen** |
| FR-014 | FR-21 induk (tanpa hapus; penonaktifan ditolak bila direferensikan) |
| FR-016 | FR-17 induk (jejak audit) |
| FR-010 (working assumption) | Proteksi akses `002-tania-rbac` FR-14–FR-17 |

## Perlu Keputusan Pemilik Produk

1. **Lingkup otorisasi (FR-010).** Permintaan menyebut "only operational can do CRUD for master data", sementara spesifikasi yang sudah diratifikasi menetapkan **Admin** sebagai pengelola master data (`001` FR-16; Matriks `002` Admin: kelola). Pilihan:
   - **A (working assumption)** — Operation menggantikan Admin: baris Master data menjadi **Operation: kelola**; Admin kehilangan hak kelola master data; hak **lihat** tetap sesuai matriks berjalan.
   - **B** — Operation **dan** Admin berbagi hak kelola master data.
   - **C** — Operation adalah satu-satunya peran dengan akses master data **termasuk Read**; modul lain tidak lagi membaca master data langsung (perubahan lebih besar pada form referensi).
   - **Custom** — tentukan sendiri.

   Bila tidak ada koreksi, spesifikasi dilanjutkan dengan **Opsi A**.

## Review & Acceptance Checklist

- [x] Setiap requirement spesifik dan dapat diuji (kecuali FR-010 yang menunggu ratifikasi).
- [x] Success criteria terukur dan bebas detail teknologi.
- [x] Edge case diidentifikasi.
- [x] Scope dibatasi jelas (Out of Scope) dan dependensi dirinci.
- [ ] **FR-010 (lingkup otorisasi) diratifikasi pemilik produk** — terbuka.
- [x] Pemetaan "Initiative" = Master Data Project tetap berlaku (keputusan TAN-180).
