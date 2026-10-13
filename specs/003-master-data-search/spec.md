# Feature Specification: Pencarian pada Daftar Master Data (Job Role, Project, Unit)

**Feature Branch**: `003-master-data-search`

**Created**: 2026-10-13

**Revisi**: 2026-10-13 (keputusan pemilik produk, TAN-180) — Pemetaan "Initiative" dikonfirmasi: **Initiative = Master Data Project**. Butir NEEDS CLARIFICATION pada User Story 2 dan Assumptions ditutup; User Story 2 kini merujuk daftar Project secara langsung.

**Status**: Draft

**Input**: User description: "add search for Job Role, Initiative, and Unit — 1. Job Role: search by job role; 2. Initiative: search by initiative name; 3. Unit: search by unit name"

> Permintaan menyebut tiga daftar: **Job Role**, **Initiative**, dan **Unit**. Tania tidak memiliki entitas bernama "Initiative" — daftar master data yang tersedia adalah Job Role (FR-20 induk), Unit (FR-18 induk), Project (FR-19 induk), dan Chapter (FR-24 induk). Permintaan ini dimaknai sebagai pencarian pada tiga daftar master data yang ada: Job Role, **Project**, dan Unit — pemetaan **Initiative = Master Data Project** dikonfirmasi pemilik produk (keputusan pada TAN-180; daftar project adalah wadah inisiatif kerja yang merujuk Unit). Spesifikasi ini melengkapi spesifikasi induk `specs/001-employee-digital-talent-management/spec.md` (User Story 6); konteks master data, RBAC, dan paginasi didefinisikan pada spesifikasi induk beserta `specs/002-tania-rbac/spec.md` dan tidak diulang di sini.

## Ringkasan

Halaman-halaman Master Data (Job Role, Project, Unit) saat ini hanya menyediakan daftar + form tambah/edit + aktif/non-aktif dengan paginasi tabel; Admin yang mencari satu entitas tertentu harus menggulir atau berpindah halaman. Fitur ini menambahkan satu kolom pencarian pada masing-masing dari tiga halaman tersebut: ketik sebagian nama, daftar tersaring seketika hanya menampilkan baris yang namanya memuat kata kunci, paginasi menghitung hasil tersaring, dan mengosongkan kolom mengembalikan daftar penuh. Pencarian bersifat hanya-baca — ia tidak mengubah data, hak akses, maupun operasi master data apa pun; pola interaksinya mengikuti pencarian yang sudah ada di aplikasi (daftar talent pada workload).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin mencari job role pada daftar Job Role (Priority: P1)

Sebagai **Admin**, saya dapat mencari job role dengan mengetik sebagian namanya pada kolom pencarian di daftar Job Role, sehingga saya menemukan job role tertentu seketika tanpa menggulir seluruh daftar atau berpindah halaman.

**Why this priority**: Daftar pertama yang diminta; sekaligus menetapkan pola pencarian (kolom tunggal, saringan langsung atas nama) yang dipakai ulang dua cerita berikutnya — dibangun lebih dulu agar dua daftar lain tinggal mengikuti.

**Independent Test**: Dapat diuji penuh dengan login sebagai Admin, membuka daftar Job Role, mengetik potongan nama job role, dan memastikan hanya baris yang cocok yang tampil; tidak bergantung pada dua daftar lain.

**Acceptance Scenarios**:

1. **Given** Admin sudah login dan daftar Job Role memuat lebih dari satu halaman job role, **When** Admin mengetik potongan nama job role (mis. "eng") pada kolom pencarian, **Then** hanya job role yang namanya memuat "eng" (perbedaan huruf besar/kecil diabaikan) yang tampil, tanpa Admin perlu menekan tombol terpisah.
2. **Given** Admin sedang mencari dengan kata kunci tertentu dan hasilnya tampil, **When** Admin mengosongkan kolom pencarian, **Then** seluruh daftar Job Role tampil kembali seperti sebelum mencari.
3. **Given** tidak ada job role yang namanya memuat kata kunci, **When** Admin mengetikkan kata kunci tersebut, **Then** daftar menampilkan pesan "tidak ada hasil yang cocok dengan pencarian" — bukan pesan "belum ada data" — dan tidak ada data yang berubah.
4. **Given** hasil pencarian melebihi satu halaman, **When** Admin berpindah halaman, **Then** paginasi hanya menghitung job role yang cocok dengan kata kunci.

---

### User Story 2 - Admin mencari project pada daftar Project (Priority: P2)

Sebagai **Admin**, saya dapat mencari project — diminta sebagai "Initiative", dikonfirmasi sama dengan Master Data Project (keputusan pada TAN-180) — dengan mengetik sebagian namanya pada kolom pencarian di daftar Project, sehingga saya menemukan inisiatif kerja tertentu beserta Unit pemiliknya seketika.

**Why this priority**: Daftar kedua yang diminta; mengulang pola yang ditetapkan User Story 1 tanpa perilaku baru.

**Independent Test**: Dapat diuji penuh dengan login sebagai Admin, membuka daftar Project, mengetik potongan nama project, dan memastikan hanya baris yang cocok yang tampil lengkap dengan Unit pemiliknya; tidak bergantung pada daftar lain.

**Acceptance Scenarios**:

1. **Given** Admin sudah login dan minimal satu project terdaftar, **When** Admin mengetik potongan nama project pada kolom pencarian, **Then** hanya project yang namanya memuat kata kunci yang tampil, lengkap dengan Unit pemiliknya dan badge status.
2. **Given** kata kunci tidak cocok dengan project mana pun, **When** Admin mengetikkannya, **Then** daftar menampilkan pesan tidak ada hasil yang cocok dan tidak ada data yang berubah.
3. **Given** Admin mengubah nama sebuah project pada baris hasil pencarian, **When** perubahan tersimpan, **Then** baris tetap tampil pada hasil bila nama baru masih memuat kata kunci dan hilang dari hasil bila tidak — daftar selalu konsisten dengan data terbaru.

---

### User Story 3 - Admin mencari unit pada daftar Unit (Priority: P2)

Sebagai **Admin**, saya dapat mencari unit dengan mengetik sebagian namanya pada kolom pencarian di daftar Unit, sehingga saya menemukan unit tertentu — beserta jumlah proyek yang memakainya — seketika.

**Why this priority**: Daftar ketiga yang diminta; mengulang pola yang ditetapkan User Story 1 tanpa perilaku baru.

**Independent Test**: Dapat diuji penuh dengan login sebagai Admin, membuka daftar Unit, mengetik potongan nama unit, dan memastikan hanya baris yang cocok yang tampil; tidak bergantung pada daftar lain.

**Acceptance Scenarios**:

1. **Given** Admin sudah login dan daftar Unit memuat lebih dari satu halaman unit, **When** Admin mengetik potongan nama unit pada kolom pencarian, **Then** hanya unit yang namanya memuat kata kunci yang tampil, dengan jumlah Proyek dan badge status tiap baris tetap benar.
2. **Given** Admin sedang mencari dan membuka form tambah/edit, **When** Admin mengubah kata kunci pencarian, **Then** form tetap terbuka dengan isian tidak berubah dan hanya daftar di belakangnya yang tersaring.
3. **Given** tidak ada unit yang namanya memuat kata kunci, **When** Admin mengetikkan kata kunci tersebut, **Then** daftar menampilkan pesan tidak ada hasil yang cocok dan tidak ada data yang berubah.

---

### Edge Cases

- Kata kunci hanya berisi spasi → diperlakukan sebagai kosong: daftar tidak tersaring.
- Kata kunci cocok dengan baris non-aktif → baris non-aktif ikut tampil (daftar memang menampilkan aktif dan non-aktif) dengan badge statusnya tetap terlihat; pencarian tidak membedakan status.
- Kata kunci memuat karakter khusus atau sangat panjang → diperlakukan sebagai teks literal (pencocokan substring biasa, bukan ekspresi/pola), tanpa error.
- Admin berada di halaman lanjutan lalu mengubah kata kunci → Admin tidak berakhir di halaman kosong: halaman yang tampil dihitung ulang dari hasil tersaring.
- Baris baru dibuat atau diubah saat kata kunci aktif → baris tampil pada hasil bila namanya cocok dengan kata kunci, tidak tampil bila tidak; kata kunci aktif tidak menghalangi penyimpanan form.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Setiap halaman daftar Job Role, Project, dan Unit MUST menyediakan satu kolom pencarian yang menyaring baris daftar berdasarkan nama entitas seiring ketikan — tanpa tombol terpisah maupun langkah submit.
- **FR-002**: Pencocokan MUST dilakukan sebagai substring pada nama entitas dengan mengabaikan perbedaan huruf besar/kecil.
- **FR-003**: Pencarian MUST hanya menyaring baris yang sudah tersaji pada daftar: hak akses, cakupan data, dan kolom yang ditampilkan mengikuti ketentuan yang berlaku (matriks Peran & Modul pada `specs/002-tania-rbac/spec.md`) — pencarian tidak memberi akses baru dan tidak mengekspos data yang tidak sudah tersaji.
- **FR-004**: Pencarian MUST berlaku atas seluruh baris daftar termasuk baris non-aktif yang memang ditampilkan; badge status tiap baris tetap terlihat pada hasil pencarian.
- **FR-005**: Paginasi daftar MUST dihitung dari hasil tersaring; setelah kata kunci berubah, Admin MUST tidak berakhir pada halaman kosong akibat penghitungan halaman lama.
- **FR-006**: Bila tidak ada baris yang cocok, sistem MUST menampilkan pesan "tidak ada hasil yang cocok dengan pencarian" yang berbeda dari pesan "belum ada data" pada daftar yang benar-benar kosong.
- **FR-007**: Mengosongkan kata kunci MUST mengembalikan tampilan daftar penuh tanpa saringan.
- **FR-008**: Pencarian MUST bersifat hanya-baca: hanya menyaring tampilan daftar — tidak mengubah data, tidak mengganggu form tambah/edit yang sedang terbuka, dan tidak mengubah operasi master data apa pun (FR-18–FR-24 spesifikasi induk tetap berlaku).

### Key Entities *(include if feature involves data)*

- **Unit**: nama (atribut yang dicari), status aktif, jumlah Project yang memakainya — tidak ada perubahan atribut.
- **JobRole**: nama (atribut yang dicari), status aktif, chapter pemilik — tidak ada perubahan atribut.
- **Project**: nama (atribut yang dicari), status aktif, Unit pemilik — tidak ada perubahan atribut.

Tidak ada perubahan skema data: pencarian hanya membaca nama yang sudah tersaji pada daftar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pada daftar berisi 100+ baris, Admin menemukan entitas tertentu hanya dengan mengetik maksimal 10 karakter — tanpa berpindah halaman atau menggulir seluruh daftar.
- **SC-002**: Setiap baris yang tampil saat kata kunci aktif memiliki nama yang memuat kata kunci (nol baris tak relevan) — berlaku pada ketiga daftar.
- **SC-003**: Hasil penyaringan terbarui dalam waktu yang terasa seketika (≤ 1 detik) setelah ketikan, tanpa pemuatan ulang halaman.

## Assumptions

- Pencarian versi ini hanya berdasarkan nama; penyaringan berdasarkan relasi (chapter pemilik Job Role, Unit pemilik Project) atau status aktif/non-aktif berada di luar cakupan.
- Skala data master data saat ini puluhan–ratusan baris per daftar dan halaman sudah memuat seluruh baris (aktif + non-aktif); pencarian tidak menuntut API baru. Bila sebuah daftar tumbuh jauh lebih besar, mekanisme penyaringan sisi server dievaluasi pada fase `/speckit.plan`.
- Pola interaksi mengikuti pencarian yang sudah ada di aplikasi (kolom "Cari nama talent…" pada daftar talent workload) demi konsistensi pengalaman.
- Pemetaan "Initiative" = Master Data Project adalah keputusan pemilik produk (TAN-180, 2026-10-13) — bukan asumsi terbuka; bila suatu saat Tania memiliki daftar bernama Initiative yang berbeda dari Project, User Story 2 dirumuskan ulang tanpa mengubah pola pada User Story 1 dan 3.
- Akses terhadap daftar master data mengikuti matriks Peran & Modul RBAC (Admin kelola; Operation/Chapter/Talent lihat); pencarian adalah penyaring tampilan dan tidak mengubah matriks tersebut — saat ini halaman Master Data hanya ditampilkan kepada Admin (layout Admin-only), dan begitu pula hasil pencariannya.

## Out of Scope

- Pencarian pada daftar Chapter dan pada daftar non-master-data (karyawan, assignment, evaluasi, CV, audit) — hanya tiga daftar yang diminta.
- Penyaringan berdasarkan atribut selain nama (chapter pemilik, unit pemilik, status aktif/non-aktif).
- Pencarian global lintas modul.
- Perubahan CRUD master data, perubahan matriks RBAC, dan perubahan kontrak API master data.

## Dependencies

- Tidak ada dependensi baru — halaman daftar Job Role, Project, dan Unit sudah tersedia dan menampilkan seluruh baris; pencarian murni melengkapi lapisan tampilan di atasnya.

## Rujukan Silang ke Spesifikasi Induk

| Spesifikasi ini | Spesifikasi induk (`specs/001-employee-digital-talent-management/spec.md`) / RBAC |
| --- | --- |
| User Story 1–3 | User Story 6 (skenario penerimaan 1, 2, 5 — daftar yang dikelola Admin) |
| FR-001, FR-002 | FR-18 (Unit), FR-19 (Project), FR-20 (Job Role) — daftar yang dikelola |
| FR-003 | Matriks Peran & Modul (`specs/002-tania-rbac/spec.md`, baris Master data) |
| FR-004 | FR-21 induk (master data hanya dinonaktifkan; baris non-aktif tetap tampil) |
| FR-005, FR-006, FR-007 | Perilaku daftar + paginasi yang ada pada halaman master data |
| FR-008 | FR-21 induk (tidak ada operasi hapus; operasi master data tidak berubah) |
| Asumsi "Initiative" → Project | FR-19 induk; dikonfirmasi pemilik produk (TAN-180, 2026-10-13) — Initiative = Master Data Project |

## Review & Acceptance Checklist

- [ ] Setiap requirement spesifik dan dapat diuji.
- [ ] Success criteria terukur dan bebas detail teknologi.
- [ ] Edge case diidentifikasi.
- [ ] Scope dibatasi jelas (Out of Scope) dan dependensi dirinci.
- [ ] Pemetaan "Initiative" dikonfirmasi pemilik produk — **tertutup**: dikonfirmasi 2026-10-13 pada TAN-180 (Initiative = Master Data Project).
