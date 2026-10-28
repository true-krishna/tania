# Feature Specification: Manajemen Master Data Massal (Bulk) — Job Role, Unit, Initiative, Chapter

**Feature Branch**: `feat/TAN-347-bulk-master-data`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "/speckit.specify buatkan fitur untuk melakukan bulk insert update dan delete master data jobrole, unit, initiative, dan chapter" (TAN-347)

> Spesifikasi ini menurunkan dan memperluas `specs/001-employee-digital-talent-management/spec.md`
> (User Story 6 — pengelolaan master data): seluruh aturan data master — Unit berkode unik (FR-18),
> Initiative/Project wajib merujuk tepat satu Unit (FR-19), Job Role dengan kepemilikan chapter
> opsional (FR-20/FR-22), Chapter (FR-24), keunikan nilai per entitas, dan jejak audit (FR-17) —
> berlaku apa adanya pada operasi massal; tidak ada pengecualian aturan. Pemetaan **"Initiative" =
> Master Data Project** adalah keputusan pemilik produk yang sudah mengikat (TAN-180, 2026-10-13;
> ditegaskan kembali pada `/speckit.clarify` TAN-187) dan tidak dibuka kembali di sini. Konteks
> bersama (RBAC empat peran akses, model chapter-as-data, audit) didefinisikan pada spesifikasi
> induk dan tidak diulang di sini.

**Revisi**: 2026-10-27 (keputusan pemilik produk pada thread TAN-347) — **Bulk delete
ditiadakan; "delete" pada permintaan dimaknai nonaktifkan massal (bulk deactivate).** Keputusan
kanonik FR-21 tetap utuh tanpa amandemen: aplikasi **tidak menyediakan operasi hapus** master
data (Unit, Chapter, Job Role, Initiative/Project); asersi SDL bahwa mutasi hapus tidak
diekspos tidak tersentuh. Operasi massal "hapus" menjadi **penonaktifan massal** dengan
proteksi referensi FR-21 ditegakkan **per baris**: baris yang masih direferensikan data lain
ditolak dengan penjelasan dependensinya, baris lain tetap tereksekusi.

**Revisi**: 2026-10-27 (keputusan pemilik produk, `/speckit.clarify` pada thread TAN-347) — Empat
butir clarify terkunci, semuanya mengikuti rekomendasi: (1) **bulk insert** via unggah templat
berkas per entitas (templat resmi dapat diunduh; satu baris = satu entri lengkap);
(2) **bulk update** = pilih banyak baris + satu perubahan yang sama; nilai berbeda per baris
(mis. rename massal) tetap melalui edit tunggal; (3) **kolom referensi templat** menerima nilai
manusiawi atau ID — kode Unit / nama chapter / ID — dan nilai ambigu ditolak per baris;
(4) **konfirmasi nonaktif massal** menampilkan ringkasan jumlah; penjelasan dependensi muncul
pada hasil per baris setelah eksekusi, tanpa pratinjau pra-eksekusi.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin menambahkan master data secara massal (Priority: P1)

Sebagai **Admin**, saya dapat menambahkan banyak entri master data sekaligus dalam satu aksi —
mengunggah berkas templat yang setiap barisnya memuat satu entri lengkap seperti pembuatan
tunggal (Unit: kode + nama; Initiative: nama + Unit in Charge; Job Role: nama + chapter
pemilik opsional; Chapter: nama) — sehingga penyiapan data referensi (mis. saat onboarding
unit/chapter baru atau inisiatif baru untuk satu batch talent) tidak menuntut pengisian form
berulang per entri.

**Why this priority**: Insert massal adalah nilai inti fitur — kebutuhan nyata paling sering
muncul saat menyiapkan sekumpulan referensi baru sekaligus; inilah inti permintaan "bulk insert".

**Independent Test**: Dapat diuji penuh dengan login sebagai Admin, mengunggah templat berisi
beberapa baris Unit (atau entitas lain) yang sah, lalu menyimpan — seluruh baris sah tersimpan
dan muncul pada daftar masing-masing.

**Acceptance Scenarios**:

1. **Given** Admin sudah login dan templat berisi beberapa baris entri yang sah, **When** Admin mengunggah berkas dan menyimpan, **Then** seluruh baris sah tersimpan dan muncul pada daftar master data terkait.
2. **Given** salah satu baris memuat nilai unik yang sudah dipakai entri lain (mis. kode Unit yang sudah terdaftar, nama Job Role yang sudah ada, nama Initiative yang sudah ada dalam Unit yang sama), **When** operasi massal dieksekusi, **Then** baris itu gagal dengan alasan yang jelas dan baris lain yang sah tetap berhasil dibuat.
3. **Given** salah satu baris Initiative tidak merujuk Unit, atau merujuk Unit/Chapter yang tidak ada atau nonaktif, **When** operasi massal dieksekusi, **Then** baris itu ditolak dengan pesan validasi yang sama seperti pembuatan tunggal (Initiative wajib merujuk tepat satu Unit), tanpa memengaruhi baris lain.
4. **Given** berkas memuat lebih baris dari batas maksimum satu operasi, **When** Admin mengunggahnya, **Then** seluruh permintaan ditolak utuh dengan pesan yang jelas; tidak ada baris yang dieksekusi sebagian.

---

### User Story 2 - Admin mengubah banyak entri master data sekaligus (Priority: P1)

Sebagai **Admin**, saya dapat memilih banyak entri master data pada satu daftar lalu menerapkan
satu perubahan yang sama kepada semuanya dalam satu aksi — memindahkan kepemilikan chapter pada
banyak Job Role sekaligus (mis. konsolidasi chapter, FR-24 induk), memindahkan Unit in Charge
pada banyak Initiative, atau mengaktifkan/menonaktifkan banyak entri sekaligus — sehingga koreksi
massal referensi tidak perlu dilakukan satu per satu.

**Why this priority**: Koreksi massal melengkapi insert massal — tanpa itu, kesalahan pembuatan
massal harus dikoreksi satu per satu dan sebagian besar nilai fitur hilang. Perubahan
kepemilikan chapter massal juga adalah mekanisme alami skenario konsolidasi chapter (US6
skenario 9 induk).

**Independent Test**: Dapat diuji penuh dengan memilih 2 Job Role, menerapkan satu perubahan
chapter pemilik, lalu memverifikasi keduanya menampilkan chapter baru pada daftar dan turunan
cakupan chapter mengikuti tanpa langkah manual.

**Acceptance Scenarios**:

1. **Given** terdapat beberapa entri pada satu daftar master data, **When** Admin memilih beberapa di antaranya dan menerapkan satu perubahan yang sama (chapter pemilik untuk Job Role; Unit in Charge untuk Initiative; aktif/non-aktif untuk semua daftar), **Then** semua baris yang sah menampilkan nilai terbaru pada daftar.
2. **Given** salah satu baris terpilih gagal validasi perubahan yang sama (mis. chapter tujuan nonaktif; referensi tidak ada), **When** operasi dieksekusi, **Then** baris itu gagal dengan alasan yang jelas dan baris lain tetap berubah.
3. **Given** Admin mengubah banyak entri (mis. banyak Job Role pindah chapter), **When** operasi selesai, **Then** referensi pada data yang memakainya tetap valid dan turunannya berlaku otomatis tanpa penyesuaian manual (selaras US6 skenario 6/9 induk).

---

### User Story 3 - Admin menonaktifkan banyak entri master data sekaligus (Priority: P1)

Sebagai **Admin**, saya dapat menonaktifkan banyak entri master data sekaligus dengan konfirmasi
eksplisit sebelum eksekusi — memenuhi makna "delete" pada permintaan TAN-347 tanpa operasi hapus
(FR-21 induk tetap utuh) — sehingga referensi yang tidak lagi dipakai berhenti tersedia untuk
data baru secara massal; entri yang masih direferensikan data lain tidak pernah ikut
dinonaktifkan dan dilaporkan dengan penjelasan dependensinya.

**Why this priority**: Penonaktifan massal adalah padanan "delete" yang disepakati pemilik produk
(TAN-347, 2026-10-27): pengelolaan siklus hidup massal melengkapi insert dan update massal,
dengan perlindungan referensi FR-21 yang sama seperti operasi tunggal.

**Independent Test**: Dapat diuji penuh dengan memilih 2 entri tak direferensikan, menonaktifkan
dengan konfirmasi, lalu memverifikasi keduanya berstatus nonaktif dan tidak lagi tersedia
sebagai pilihan untuk data baru — sementara entri yang masih direferensikan ditolak per baris
dengan alasan jelas.

**Acceptance Scenarios**:

1. **Given** terdapat entri master data yang tidak direferensikan data lain, **When** Admin memilih beberapa entri, memilih nonaktifkan, dan mengonfirmasi, **Then** entri terpilih yang sah berstatus nonaktif dan tidak lagi tersedia untuk data baru; hasilnya dilaporkan.
2. **Given** salah satu entri terpilih masih direferensikan data lain (Unit dipakai Initiative/kontrak; Chapter masih memiliki Job Role; Job Role dipakai kontrak; Initiative dipakai assignment), **When** operasi dieksekusi, **Then** baris itu ditolak dengan penjelasan dependensi yang jelas dan baris lain tetap tereksekusi.
3. **Given** Admin memilih aksi nonaktif massal, **When** konfirmasi diminta, **Then** tampil ringkasan jumlah entri yang akan dinonaktifkan dan eksekusi hanya berjalan setelah konfirmasi eksplisit.
4. **Given** salah satu entri terpilih sudah berstatus nonaktif, **When** operasi dieksekusi, **Then** baris itu dilaporkan apa adanya (sudah nonaktif, tidak berubah) tanpa dihitung sebagai kegagalan.
5. **Given** entri yang dinonaktifkan massal kemudian perlu dipakai kembali, **When** Admin mengaktifkannya kembali (tunggal maupun massal via User Story 2), **Then** entri tersedia kembali sebagai referensi untuk data baru.

---

### Edge Cases

- Satu operasi melebihi batas maksimum (100 baris) → seluruh permintaan ditolak utuh dengan pesan yang jelas; tidak ada baris yang dieksekusi sebagian.
- Berkas insert memuat entri sama lebih dari sekali (mis. kode Unit sama dua kali) → baris kedua gagal dengan alasan duplikat (baris pertama berhasil); hasil per baris tetap konsisten dan dapat dijelaskan.
- Semua baris gagal → tidak ada perubahan data; hasil menjelaskan alasan tiap baris, plus alasan umum bila berlaku.
- Referensi (Unit in Charge, chapter pemilik) dinonaktifkan di antara pemilihan dan eksekusi → baris gagal dengan alasan referensi tidak lagi aktif.
- Operasi massal dipanggil oleh peran selain Admin (UI maupun request langsung) → seluruh permintaan ditolak di sisi server, bukan hanya disembunyikan di UI.
- Nonaktif massal yang sebagian barisnya masih direferensikan → baris terkait ditolak per baris dengan penjelasan dependensi; baris lain tetap tereksekusi.
- Setelah operasi, turunan data (ketersediaan pilihan di form lain, cakupan chapter, angka dashboard) berubah konsisten tanpa langkah sinkronisasi manual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-01**: Admin harus dapat menambahkan master data secara massal dalam satu aksi per daftar (Unit, Initiative, Job Role, Chapter) dengan mengunggah berkas templat resmi yang setiap barisnya memuat satu entri lengkap dengan data yang sama seperti pembuatan tunggal: Unit — kode + nama; Initiative — nama + tepat satu Unit in Charge; Job Role — nama + chapter pemilik (opsional, selaras FR-22); Chapter — nama.
- **FR-02**: Hasil operasi massal harus dilaporkan per baris: baris yang berhasil dan baris yang gagal (beserta alasan yang jelas dan dapat ditindaklanjuti); kegagalan satu baris tidak boleh menggagalkan baris lain yang sah.
- **FR-03**: Admin harus dapat memilih banyak entri pada satu daftar master data sekaligus dan menerapkan satu perubahan yang sama kepada semuanya dalam satu aksi: Job Role — chapter pemilik; Initiative — Unit in Charge; semua daftar — status aktif/non-aktif. Per baris berlaku aturan pengubahan tunggal yang ada. Pengubahan nilai berbeda per baris (mis. rename massal) tetap melalui edit tunggal — keputusan clarify TAN-347.
- **FR-04**: Admin harus dapat menonaktifkan banyak entri sekaligus dengan proteksi referensi FR-21 berlaku per baris: baris yang masih direferensikan data lain atau masih memiliki bawahan wajib ditolak per baris dengan penjelasan dependensi yang jelas, bukan gagal diam-diam; baris lain tetap tereksekusi. Penonaktifan hanya menghentikan pemakaian untuk data baru. **Tidak ada operasi hapus master data yang ditambahkan** — keputusan pemilik produk TAN-347 (2026-10-27).
- **FR-05**: Aksi penonaktifan massal harus selalu didahului konfirmasi eksplisit yang menampilkan ringkasan jumlah entri yang akan dinonaktifkan; penjelasan dependensi muncul pada hasil per baris setelah eksekusi, tanpa pratinjau pra-eksekusi — keputusan clarify TAN-347.
- **FR-06**: Satu operasi massal maksimum memuat 100 baris; permintaan yang melebihi batas ditolak utuh dengan pesan yang jelas.
- **FR-07**: Seluruh penegakan otorisasi pada operasi massal dilakukan di sisi server: hanya Admin yang dapat menjalankan insert/update/nonaktif master data massal (selaras keputusan TAN-187); peran lain ditolak termasuk pada request langsung.
- **FR-08**: Setiap entri yang dibuat, diubah, atau dinonaktifkan melalui operasi massal harus tercatat jejak auditnya per entri (bukan satu catatan untuk seluruh batch); jejak audit hanya dapat dilihat Admin (FR-17 induk).
- **FR-09**: Operasi massal wajib mengikuti seluruh aturan data master tunggal yang berlaku: keunikan nilai per entitas (kode Unit unik; nama Job Role unik; nama Initiative unik dalam Unit yang sama), Initiative wajib merujuk tepat satu Unit, referensi harus aktif dan ada, penonaktifan ditolak bila masih direferensikan atau masih memiliki bawahan wajib.
- **FR-10**: Aplikasi menyediakan templat resmi yang dapat diunduh untuk bulk insert per entitas; berkas yang diunggah divalidasi sebelum eksekusi (format berkas, kolom pada baris pertama, batas baris); kolom referensi menerima nilai manusiawi atau ID — Unit in Charge diisi kode Unit (unik) atau ID unit, chapter Job Role diisi nama chapter atau ID — dan nilai ambigu (nama dipakai lebih dari satu entitas aktif) ditolak per baris; setiap baris yang referensinya tidak dapat diselesaikan atau gagal validasi dilaporkan per baris beserta alasannya, tanpa memengaruhi baris lain yang sah — keputusan clarify TAN-347.
- **FR-11**: Duplikat di dalam satu berkas insert ditolak pada baris duplikatnya (nilai unik yang muncul lebih dari sekali dalam satu berkas hanya dijalankan sekali); hasil per baris tetap konsisten dan dapat dijelaskan.

### Key Entities *(include if feature involves data)*

- **Unit, Initiative (Project), Job Role, Chapter (master data)**: seperti pada spesifikasi induk `001-employee-digital-talent-management` — operasi massal tidak mengubah model data; ia mengoperasikan kumpulan entri master data dengan aturan yang sama.
- **Hasil Operasi Massal**: keluaran setiap operasi massal — daftar baris berhasil dan daftar baris gagal (beserta alasan per baris); bukan data yang tersimpan, melainkan laporan eksekusi.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin dapat menambahkan 50 entri master data dalam satu aksi dalam waktu kurang dari 2 menit (termasuk menyiapkan berkas dan meninjau hasil).
- **SC-002**: 100% percobaan operasi massal oleh peran yang tidak berwenang ditolak di sisi server.
- **SC-003**: 100% kegagalan baris dilaporkan dengan alasan yang dapat dipahami Admin; baris yang berhasil tidak pernah tergulung balik oleh kegagalan baris lain (100% kasus uji).
- **SC-004**: 100% entri yang dibuat, diubah, atau dinonaktifkan melalui operasi massal memiliki jejak audit per entri.
- **SC-005**: Operasi massal 100 baris selesai dalam waktu kurang dari 10 detik pada kondisi normal; daftar master data tetap responsif pada skala data spesifikasi induk.

## Assumptions

- Mekanisme per operasi terkunci pada clarify (TAN-347, 2026-10-27): **bulk insert** melalui unggah templat berkas (satu baris per entri); **bulk update dan nonaktif massal** melalui pemilihan banyak baris pada daftar + satu aksi (impor berkas untuk update/nonaktif di luar scope).
- Satu templat resmi disediakan per entitas (berkolom berbeda per entitas), bukan satu berkas campuran.
- Batas batch 100 baris cukup untuk skala master data (jumlah unit/chapter/role jauh di bawah batas ini); batas dapat ditinjau bila muncul kebutuhan nyata.
- Antarmuka berbahasa Indonesia, desktop-first, dan skala data mengikuti spesifikasi induk.
- Operasi massal tersedia pada halaman Master Data eksisting (Unit, Initiative, Job Role, Chapter) — tidak ada modul terpisah.

## Out of Scope

- **Operasi hapus (hard delete) master data** — ditiadakan sesuai keputusan pemilik produk TAN-347 (2026-10-27); FR-21 tetap utuh, "delete" dimaknai nonaktifkan massal (FR-04).
- Impor berkas untuk bulk update/nonaktif — seleksi baris tetap menjadi cara untuk keduanya.
- Perluasan atribut entitas master data (mis. tipe unit, kategori Job Role, status inisiatif) — mengikuti `003-master-data`/`004-master-data-create`; fitur ini hanya melapisi operasi massal atas model yang berlaku.
- Operasi massal pada template evaluasi, periode evaluasi, akun user, atau data karyawan — di luar permintaan.
- Perubahan aturan operasi tunggal maupun model data master — fitur ini melapisi operasi massal di atas aturan yang berlaku.
- Penggantian label nav/halaman ("Project" ↔ "Initiative") — follow-up terpisah (D5, spec 004 dashboard).
- Login, kerangka RBAC, dan mekanisme jejak audit — kerangka bersama yang dikonsumsi.

## Dependencies

- **Operasi master data tunggal** sudah terimplementasi di kedua repo (spec induk US6; audit plan 004-master-data-create): operasi massal memakai aturan, validasi, dan jejak audit yang sama.
- **Unit aktif** tersedia sebagai referensi wajib Initiative (FR-19 induk).
- **Kerangka audit** berjalan (FR-17 induk): setiap perubahan massal tercatat per entri.
- **Akun Admin** terdefinisi (FR-15/FR-16 induk) — satu-satunya peran pelaku operasi massal.

## Rujukan Silang ke Spec Induk Master Data

| Spesifikasi ini | `specs/001-employee-digital-talent-management/spec.md` |
| --- | --- |
| US1 (insert massal) | FR-18/FR-19/FR-20/FR-24 — aturan create tunggal per entitas sama |
| US2 (update massal: chapter Job Role) | FR-22/FR-23 — kepemilikan chapter & turunan cakupan otomatis |
| US2 (update massal: Unit in Charge Initiative) | FR-19 — Project wajib tepat satu Unit |
| US3 (nonaktif massal) | FR-21/FR-24 — proteksi referensi penonaktifan berlaku per baris; "delete" dimaknai nonaktif (keputusan TAN-347, FR-21 tetap utuh) |
| FR-07 (Admin-only) | FR-16 + keputusan TAN-187 |
| FR-08 (audit per entri) | FR-17 |

## Review & Acceptance Checklist

- [ ] Setiap requirement spesifik dan dapat diuji.
- [ ] Success criteria terukur dan bebas detail teknologi.
- [ ] Edge case diidentifikasi.
- [ ] Scope dibatasi jelas (Out of Scope) dan dependensi dirinci.
- [x] Keputusan semantik "delete" tercatat: bulk delete ditiadakan, hanya nonaktif massal — pemilik produk, thread TAN-347 (2026-10-27); FR-21 tetap utuh tanpa amandemen.
- [x] Empat butir clarify terkunci (1A/2A/3A/4A) — pemilik produk, thread TAN-347 (2026-10-27): mekanisme insert, semantik update, kolom referensi, kedalaman konfirmasi nonaktif.
