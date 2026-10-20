# Feature Specification: Masuk Single Sign-On (SSO) Microsoft Entra ID

**Feature Branch**: `006-entra-sso-login`

**Created**: 2026-10-20

**Status**: Clarified — seluruh butir klarifikasi (NC-01..NC-03) ditutup dengan keputusan pemilik produk (2026-10-20); siap untuk `/speckit.plan`. Pembuatan issue implementasi menunggu persetujuan eksplisit pemilik produk.

**Input**: `/speckit.specify` (TAN-267) — "Tambahkan opsi login menggunakan Microsoft Entra SSO sebagai opsi utama, selain email & password. Credentials (CLIENT_ID, CLIENT_SECRET, TENANT_ID) sudah disiapkan." (perintah: "/speckit.specify Sesuai issue ini" — deskripsi diambil dari TAN-267)

**Revisi**: 2026-10-20 (`/speckit.clarify`, TAN-267) — Keputusan pemilik produk: **NC-01** ditutup — hanya akun **tenant korporat Telkom** (single-tenant); akun personal Microsoft / tenant lain ditolak; **semua akun dalam tenant** boleh mencoba masuk (tanpa pembatasan domain/grup tambahan). **NC-02** ditutup — pemetaan otomatis berdasarkan **work email**; identitas tanpa kecocokan akun Tania ditolak **tanpa membuat akun baru** (akun tetap dikelola lewat provisi/kelola Admin — FR-43–FR-46 spesifikasi 001). **NC-03** ditutup — halaman login **mengarahkan otomatis** ke proses masuk Microsoft dengan **email + kata sandi sebagai pintu fallback** yang selalu dapat dijangkau. Prioritas fitur: **High** (tanpa tanggal target). Marker `[NEEDS CLARIFICATION]` dihapus dari FR-001/FR-004/FR-005.

**Relasi ke spesifikasi lain**:

- **Melengkapi** `specs/001-employee-digital-talent-management/spec.md` — kemampuan **provisi akun Microsoft Entra** (FR-43–FR-46) sudah ada pada alur pengelolaan karyawan; spesifikasi ini menambah **jalur masuk (autentikasi)** memakai akun korporat tersebut dan tidak mengubah perilaku provisi.
- **Konsisten dengan** `specs/002-tania-rbac/spec.md` — SSO **tidak mengubah** Matriks Peran & Modul maupun penegakan otorisasi sisi server; hak akses tetap diturunkan dari peran akun Tania yang terhubung, bukan dari klaim di sisi Microsoft.

## Ringkasan

Saat ini satu-satunya cara masuk ke Tania adalah email + kata sandi. Pengguna harus mengingat dan mengelola kata sandi khusus Tania di samping akun korporat Microsoft yang mereka pakai sehari-hari; organisasi juga menanggung risiko dan beban pengelolaan kata sandi (reset, kebocoran, akun lemah).

Spesifikasi ini menambahkan **masuk Single Sign-On (SSO) dengan akun korporat Microsoft Entra ID** sebagai **opsi utama** di halaman login, **selain** jalur email + kata sandi yang tetap berfungsi penuh. Identitas korporat yang terhubung ke akun Tania membuka sesi dengan hak akses akun Tania tersebut; identitas yang tidak terhubung atau berada di luar lingkup organisasi tidak memperoleh akses. Kredensial integrasi (CLIENT_ID, CLIENT_SECRET, TENANT_ID) telah disiapkan pemilik produk dan hanya hidup sebagai konfigurasi lingkungan.

## Clarifications

### Session 2026-10-20

- Q: Cakupan akun Microsoft — hanya akun organisasi tenant Telkom (single-tenant), atau perlu mendukung akun personal Microsoft / tenant lain (multi-tenant)? → A: **Tenant Telkom saja**.
- Q: Pemetaan & provisioning akun — pengguna yang sudah ada dicocokkan otomatis lewat email; pengguna baru (belum punya akun Tania) dibuat otomatis dengan peran default, atau ditolak? → A: **Work email** — pemetaan otomatis berdasarkan email korporat; tanpa pembuatan akun otomatis.
- Q: Pembatasan akses — semua akun dalam tenant boleh login, atau dibatasi ke domain/grup tertentu? → A: **Boleh login** — semua akun dalam tenant, tanpa pembatasan domain/grup tambahan.
- Q: Makna "opsi utama" — tombol Microsoft ditonjolkan di atas form email, atau auto-redirect ke halaman login Microsoft dengan pintu "masuk dengan email" sebagai fallback? → A: **Email sebagai fallback** (auto-redirect ke Microsoft; email + kata sandi tetap dapat dijangkau).
- Q: Prioritas & target rilis — priority (urgent/high/medium) dan tanggal target? → A: **High** (tanpa tanggal target).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Masuk dengan akun korporat Microsoft Entra ID (Priority: P1)

Sebagai **pengguna Tania**, saya dapat masuk ke aplikasi dengan akun korporat Microsoft saya (Microsoft Entra ID) dari halaman login, sehingga saya tidak perlu mengingat kata sandi khusus Tania.

**Why this priority**: Ini inti permintaan (TAN-267). Tanpa jalur SSO, tidak ada nilai fitur sama sekali.

**Independent Test**: Pengguna dengan akun korporat yang terhubung ke akun Tania aktif menyelesaikan proses masuk dari halaman login hingga berada di dalam aplikasi tanpa memasukkan email/kata sandi Tania.

**Acceptance Scenarios**:

1. **Given** pengguna dengan akun korporat yang terhubung membuka halaman login, **When** mengikuti proses masuk yang diarahkan otomatis ke Microsoft dan menyelesaikan autentikasi dengan akun korporat tersebut, **Then** sesi Tania terbentuk dan pengguna masuk ke aplikasi.
2. **Given** pengguna membatalkan proses autentikasi di sisi Microsoft atau proses gagal di tengah jalan, **When** kembali ke halaman login, **Then** tidak ada sesi yang terbentuk dan pintu fallback email + kata sandi dapat langsung dipakai tanpa dipaksa kembali ke SSO.
3. **Given** autentikasi di sisi Microsoft berhasil tetapi work email identitas tidak cocok dengan akun Tania aktif mana pun, **When** proses berakhir, **Then** akses ditolak dengan pesan yang jelas dan tidak ada akun baru yang dibuat (kebijakan pemetaan — NC-02).
4. **Given** pengguna mencoba masuk dengan akun personal Microsoft atau akun tenant lain (NC-01), **When** proses berakhir, **Then** permintaan ditolak dengan pesan yang jelas dan tidak ada sesi yang terbentuk.

---

### User Story 2 - Email & kata sandi tetap tersedia sebagai alternatif (Priority: P1)

Sebagai **pengguna Tania**, saya tetap dapat masuk dengan email dan kata sandi seperti sebelumnya, sehingga saya tidak terkunci keluar saat SSO diaktifkan (misalnya akun tanpa akun korporat, atau gangguan pada layanan Microsoft).

**Why this priority**: Permintaan eksplisit "selain email & password"; pemilik produk menegaskan jalur lama tetap ada sebagai pintu fallback. Zero-regression pada jalur masuk eksisting adalah syarat peluncuran.

**Independent Test**: Seluruh skenario masuk email + kata sandi yang berlaku saat ini tetap berfungsi tanpa perubahan perilaku setelah fitur SSO ada.

**Acceptance Scenarios**:

1. **Given** pengguna dengan kredensial email + kata sandi yang valid, **When** masuk melalui form email + kata sandi, **Then** sesi terbentuk seperti sebelumnya.
2. **Given** layanan Microsoft tidak tersedia atau mengalami gangguan, **When** pengguna mencoba masuk, **Then** jalur email + kata sandi tetap dapat dipakai dan pesan gangguan SSO tidak menghalangi jalur alternatif.
3. **Given** percobaan masuk email + kata sandi gagal berulang, **When** melebihi batas yang berlaku saat ini, **Then** pembatasan yang sudah ada tetap bekerja tanpa berubah.

---

### User Story 3 - Identitas korporat terhubung ke akun Tania yang tepat (Priority: P2)

Sebagai **Admin**, setiap identitas korporat yang masuk terhubung dengan tepat ke satu akun Tania, sehingga hak akses yang berlaku selalu hak akses akun Tania tersebut — bukan apa pun yang diklaim dari sisi Microsoft.

**Why this priority**: Pemetaan menentukan otorisasi. Tanpa aturan pemetaan yang jelas, SSO berisiko membuka akses ke akun yang salah atau akun baru tanpa kontrol.

**Independent Test**: Identitas korporat milik akun Tania tertentu menghasilkan sesi dengan peran/hak akses akun itu; identitas tanpa keterkaitan tidak menghasilkan sesi (kebijakan detail mengikuti NC-02).

**Acceptance Scenarios**:

1. **Given** identitas korporat yang work email-nya identik dengan alamat email akun Tania aktif, **When** pemiliknya masuk via SSO, **Then** sesi memakai peran dan hak akses akun Tania tersebut.
2. **Given** pemetaan work email → akun Tania yang sama telah terbentuk, **When** dipakai untuk masuk lagi, **Then** selalu menuju akun Tania yang sama.
3. **Given** identitas korporat dari tenant Telkom yang belum terhubung ke akun Tania mana pun (work email tidak cocok dengan akun Tania aktif mana pun), **When** mencoba masuk, **Then** akses ditolak dengan pesan yang jelas dan tidak ada akun baru yang dibuat (kebijakan pemetaan — NC-02).
4. **Given** akun Tania berstatus tidak aktif (mis. karyawan resign/pensiun — FR-46 spesifikasi 001), **When** identitas korporatnya mencoba masuk, **Then** akses ditolak meskipun autentikasi di sisi Microsoft berhasil.

---

### User Story 4 - Jejak audit & perlakuan sesi yang setara (Priority: P3)

Sebagai **Admin/auditor**, setiap upaya masuk via SSO terekam pada jejak audit seperti halnya jalur email + kata sandi, sehingga investigasi keamanan mencakup semua jalur masuk.

**Why this priority**: Kewajiban tata kelola (konstitusi — keamanan & auditabilitas), tetapi tidak menghalangi peluncuran jalur SSO itu sendiri.

**Independent Test**: Percobaan SSO yang berhasil maupun gagal menghasilkan entri jejak audit yang memuat metode masuk; sesi hasil SSO berakhir dengan perlakuan yang sama dengan sesi lain.

**Acceptance Scenarios**:

1. **Given** masuk via SSO berhasil, **When** jejak audit diperiksa, **Then** ada entri keberhasilan yang memuat penanda metode masuk.
2. **Given** masuk via SSO gagal atau ditolak, **When** jejak audit diperiksa, **Then** ada entri kegagalan yang memuat penanda metode masuk.
3. **Given** sesi terbentuk via SSO, **When** pengguna keluar, sesi kedaluwarsa, atau sesi ditarik, **Then** perlakuannya sama dengan sesi yang dibuat lewat email + kata sandi.

### Edge Cases

- Pengguna menutup atau membatalkan jendela autentikasi Microsoft di tengah proses → kembali ke halaman login tanpa sesi, dengan pintu fallback email + kata sandi yang tetap dapat dipakai.
- Pengguna sengaja memilih pintu email + kata sandi tidak dipaksa kembali ke SSO secara berulang (tidak ada lingkaran pengalihan).
- Layanan Microsoft lambat/tidak tersedia saat proses masuk → pesan yang jelas ("coba lagi / gunakan email & kata sandi"), aplikasi tidak menggantung tanpa umpan balik.
- Bukti keberhasilan autentikasi dipakai ulang atau sudah kedaluwarsa → ditolak; tidak ada sesi yang terbentuk.
- Identitas korporat mengubah alamat email/UPN-nya setelah terhubung → keterkaitan tidak boleh otomatis berpindah ke akun Tania lain; penanganan kasus lanjutan mengikuti kebijakan admin (dirinci pada fase plan).
- Akun personal Microsoft atau akun dari tenant lain mencoba masuk → ditolak dengan pesan yang jelas (NC-01).
- Akun tenant Telkom tanpa akun Tania yang cocok (belum pernah dibuat/dikelola Admin) → ditolak tanpa membuat akun baru; pesan mengarahkan pengguna ke pengelola/admin (NC-02).
- Percobaan SSO gagal berulang dari sumber yang sama → pembatasan laju setara dengan yang berlaku pada jalur email + kata sandi.
- Pesan kesalahan tidak boleh membocorkan apakah suatu email/identitas terdaftar di Tania.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Halaman login MUST menjadikan masuk dengan akun korporat Microsoft Entra ID sebagai **opsi utama**: pengunjung halaman login diarahkan otomatis ke proses masuk Microsoft Entra ID, dengan jalur email + kata sandi tetap dapat dijangkau sebagai pintu fallback (tanpa lingkaran pengalihan yang memaksa kembali ke SSO).
- **FR-002**: Sistem MUST mempertahankan jalur masuk email + kata sandi sepenuhnya berfungsi dan selalu dapat dijangkau sebagai fallback dari halaman login — termasuk setelah pembatalan atau kegagalan SSO.
- **FR-003**: Sistem MUST memverifikasi keabsahan bukti hasil autentikasi dari Microsoft Entra ID sebelum sesi Tania terbentuk; sesi tidak boleh terbentuk dari bukti yang tidak valid, kedaluwarsa, atau dipakai ulang.
- **FR-004**: Sistem MUST mencocokkan identitas korporat secara otomatis dengan akun Tania yang work email-nya identik; kecocokan ditemukan → sesi terbentuk untuk akun tersebut; tidak ada kecocokan → akses ditolak dengan pesan yang jelas, **tanpa membuat akun baru** (akun tetap dikelola melalui provisi/kelola Admin — FR-43–FR-46 spesifikasi 001).
- **FR-005**: Sistem MUST hanya menerima identitas dari **tenant korporat Telkom** (single-tenant); akun personal Microsoft atau tenant lain ditolak dengan pesan yang jelas. Semua akun dalam tenant Telkom boleh mencoba masuk — tanpa pembatasan domain/grup tambahan; terbentuknya sesi tetap mengikuti FR-004 (harus ada akun Tania aktif yang cocok).
- **FR-006**: Hak akses sesi hasil SSO MUST selalu berasal dari peran akun Tania yang terhubung (Matriks Peran & Modul `002-tania-rbac`); klaim grup/peran di sisi Microsoft tidak menambah atau mengurangi hak akses.
- **FR-007**: Sistem MUST mencatat jejak audit untuk setiap upaya masuk via SSO — berhasil, gagal, maupun ditolak — setara dengan jejak jalur email + kata sandi, termasuk penanda metode masuk.
- **FR-008**: Sesi hasil SSO MUST memiliki masa berlaku, pembaruan, pencabutan (keluar), dan penonaktifan yang setara dengan sesi dari jalur email + kata sandi.
- **FR-009**: Sistem MUST menampilkan pesan kegagalan yang jelas dan dapat ditindaklanjuti (Bahasa Indonesia) untuk kegagalan SSO, tanpa membocorkan detail teknis maupun informasi keberadaan akun.
- **FR-010**: Rahasia integrasi (termasuk CLIENT_SECRET) MUST hanya hidup sebagai konfigurasi lingkungan — tidak pernah dalam kode sumber, log, dokumentasi, issue, atau komentar.
- **FR-011**: Sistem MUST menolak masuk via SSO untuk akun Tania yang statusnya tidak aktif, konsisten dengan perilaku jalur email + kata sandi (termasuk kaitan penonaktifan akun Entra pada terminasi karyawan — FR-46 spesifikasi 001).
- **FR-012**: Sistem MUST menerapkan pembatasan laju terhadap upaya SSO yang gagal berulang, setara dengan pembatasan yang berlaku pada jalur email + kata sandi.

### Key Entities *(include if feature involves data)*

- **Akun Tania**: identitas pengguna aplikasi yang sudah ada (email, peran, status aktif); alamat email akun dipakai sebagai kunci pemetaan otomatis (work email); atribut baru: keterkaitan ke nol atau satu identitas korporat Microsoft.
- **Identitas korporat (Microsoft Entra ID)**: identitas unik pada tenant organisasi — pengenal tenant, pengenal akun unik, alamat email/UPN, nama tampilan; dipakai untuk mencocokkan ke akun Tania.
- **Sesi pengguna**: sesi masuk yang sudah ada; kini mencatat metode masuk (SSO atau email + kata sandi) untuk keperluan audit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pengguna dengan akun korporat yang sudah terhubung menyelesaikan masuk via SSO dalam ≤ 3 interaksi (pilih opsi → autentikasi di Microsoft → berada di aplikasi) dan < 30 detik pada kondisi normal.
- **SC-002**: 100% upaya masuk dari akun di luar lingkup yang diizinkan ditolak (0 sesi terbentuk).
- **SC-003**: 0 regresi pada jalur email + kata sandi: seluruh pengguna eksisting tetap dapat masuk; tingkat keberhasilan login tidak menurun setelah fitur diluncurkan.
- **SC-004**: 100% upaya masuk SSO (berhasil/gagal) menghasilkan entri jejak audit yang memuat metode masuk dan dapat diperiksa admin.
- **SC-005**: Dalam 1 bulan setelah peluncuran, ≥ 80% dari seluruh keberhasilan masuk memakai jalur SSO — indikator bahwa "opsi utama" benar-benar dipakai pengguna.

## Assumptions

- Organisasi memiliki **tenant korporat Telkom** yang aktif pada Microsoft Entra ID, dan pemilik produk dapat mengatur pendaftaran aplikasi di sisi Entra (URI pengalihan, cakupan profil/email) — prasyarat eksternal di luar kendali tim aplikasi.
- Kredensial yang telah disiapkan pemilik produk (CLIENT_ID, CLIENT_SECRET, TENANT_ID) berlaku untuk tenant korporat yang sama dengan akun pengguna yang dituju; nilainya tidak pernah dicantumkan di dokumen, kode, atau percakapan apa pun.
- Akun korporat pengguna tersedia (sebagian dibuat melalui kemampuan provisi akun Entra yang sudah ada — FR-43–FR-46 spesifikasi 001).
- Peran dan hak akses tetap dikelola di Tania (RBAC); SSO hanya mengganti cara pembuktian identitas, bukan model otorisasi.
- Cakupan MVP adalah aplikasi web (halaman login yang ada); dukungan mobile/di luar web berada di luar cakupan spesifikasi ini.
- Semua akun Tania aktif memiliki alamat email unik yang sama dengan work email akun korporatnya — dasar pemetaan otomatis (pengecualian, jika ada, dicatat pada fase plan).
- Kebijakan kata sandi tidak berubah pada spesifikasi ini; opsi seperti "wajib SSO penuh / nonaktifkan kata sandi" adalah keputusan fase lanjutan di luar cakupan.
