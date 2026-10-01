# Frontend Operations Map — GraphQL per Layar

**Repo**: `tania-dashboard` · **Feature**: `001-employee-digital-talent-management`

Dokumen ini memetakan setiap layar ke operasi GraphQL yang dipakainya, plus status operasi di
SDL yang **dilayani** backend per 2026-10-01 (`tania-backend/graph/schema.graphqls`: auth + Unit
+ audit). Layar lain menunggu operasinya diport backend per gelombang (`plan.md`
§Ketergantungan pada Backend).

> Sumber generate = SDL yang dilayani. `contracts/schema.graphql` adalah kontrak desain
> (target). Perbedaan penamaan yang **diketahui** antara keduanya dicatat di §4.

---

## 1. Fondasi & sesi

| Layar / kebutuhan | Operasi | Dilayani |
| --- | --- | --- |
| Halaman login | `mutation login(input: LoginInput!): AuthPayload!` | ya |
| Refresh saat `UNAUTHENTICATED` | `mutation refreshSession(refreshToken: String!): AuthPayload!` | ya |
| Logout | `mutation logout(refreshToken: String): Boolean!` | ya |
| Shell `(app)` — identitas & peran | `query me: User!` | ya |
| Health check dev | `query health: Health!` | ya |
| Penampil audit (Admin) | `query auditLogs(limit: Int): [AuditLog!]!` | ya (versi daftar; varian Connection menyusul) |

## 2. Per modul (menunggu backend)

| Modul | Layar | Operasi | Gelombang |
| --- | --- | --- | --- |
| Master data | Unit / Chapter / Job Role / Project (list) | `units`, `chapters`, `jobRoles`, `projects` | F1 |
| Master data | form tambah/ubah/aktivasi | `createUnit`/`updateUnit`/`setUnitActive`, `createChapter`/`updateChapter`/`setChapterActive`, `createJobRole`/`updateJobRole`/`setJobRoleChapter`/`setJobRoleActive`, `createProject`/`updateProject`/`setProjectActive` | F1 |
| Akun | daftar + ubah peran + nonaktifkan | `users(search, accessRole, status)`, `createUserAccount`, `updateUserAccessRole`, `setUserAccountStatus`, `revokeUserSessions` | F1 |
| Karyawan | daftar + filter + pencarian | `employees(filter, first, after)`, `employee(id)` | F2 |
| Karyawan | form + nonaktifkan | `createEmployee`, `updateEmployee`, `deactivateEmployee(id, acknowledgeActiveWork)` | F2 |
| Assignment | kandidat talent | `assignableTalents(search, first, after)` | F3 |
| Assignment | daftar per talent/project + form | `assignments(filter, first, after)`, `createAssignment`, `updateAssignment`, `endAssignment` | F3 |
| IDP | daftar Chapter + filter status | `idps(filter, first, after)`, `idp(id)` | F4 |
| IDP | buat/revisi/tutup + aksi + review | `createIdp`, `updateIdp`, `closeIdp`, `addDevelopmentAction`, `updateDevelopmentAction`, `deleteDevelopmentAction`, `addIdpReview` | F4 |
| IDP | halaman Talent | `myIdp`, `updateDevelopmentActionStatus` | F4 |
| CV | form Talent | `myCvProfile`, `upsertCvProfile`, `addCvEducation`/`updateCvEducation`/`deleteCvEducation`, `addCvCertification`/`updateCvCertification`/`deleteCvCertification`, `addCvSkill`/`updateCvSkill`/`deleteCvSkill` | F5 |
| CV | tampilan read-only Chapter | `cvProfile(employeeId)` | F5 |
| Evaluasi | template & periode (Admin) | `evaluationTemplates`, `createEvaluationTemplate`, `updateEvaluationTemplate`, `setEvaluationTemplateActive`, `evaluationPeriods`, `currentEvaluationPeriod`, `createEvaluationPeriod`, `updateEvaluationPeriod`, `setEvaluationPeriodActive` | F6 |
| Evaluasi | roster + form + revisi (Chapter) | `evaluationRoster(periodId, first, after)`, `performanceEvaluations(periodId, employeeId, first, after)`, `upsertPerformanceEvaluation`, `submitPerformanceEvaluation` | F6 |
| Evaluasi | riwayat milik Talent | `myPerformanceEvaluations` | F6 |
| Dashboard | widget per peran (US8) | `dashboard` (union `AdminDashboard`/`OperationDashboard`/`ChapterDashboard`/`TalentDashboard`) | F7 |

## 3. Aturan pemakaian operasi

1. **Satu operasi per berkas** di `src/features/<modul>/`, dinamai sesuai aksi
   (`EmployeesList.graphql`, `CreateEmployee.graphql`, …).
2. **Field selection minimal**: ambil hanya field yang dirender. Tidak ada "select all" dan
   tidak ada field turunan yang dihitung ulang di klien (`data-model.md` §4).
3. **Variabel, bukan string** — filter & pencarian selalu lewat variabel GraphQL (tidak pernah
   dirangkai ke URL; konstitusi §II).
4. **Setelah mutasi**: `refetch` query daftar/detail yang menampilkan entitas berubah; jangan
   menebak bentuk cache.
5. **Error**: setiap operasi menangani `extensions.code` lewat `src/lib/errors.ts`
   (`api-conventions.md` §3).

## 4. Perbedaan kontrak desain vs SDL yang dilayani (per 2026-10-01)

Frontend generate dari SDL yang dilayani, jadi ia memakai nama kolom **kiri** pada tabel ini.
Backend akan menyelaraskan kontrak desain ke bentuk SDL saat SDL diperluas (T018 di
`tania-backend/tasks.md`); sampai itu, kontrak desain belum boleh dijadikan sumber generate.

| Aspek | Kontrak desain (`contracts/schema.graphql`) | SDL yang dilayani (dipakai UI) |
| --- | --- | --- |
| Refresh token | `mutation refreshToken: AuthPayload!` (tanpa argumen) | `mutation refreshSession(refreshToken: String!): AuthPayload!` |
| Logout | `mutation logout: Boolean!` | `mutation logout(refreshToken: String): Boolean!` |
| `AuthPayload` | `accessToken`, `accessTokenExpiresAt`, `user` | + `refreshToken`, `refreshTokenExpiresAt` |
| Input login | `LocalLoginInput` | `LoginInput` |
| Scalar | `UUID` / `DateTime` / `Date` | `ID` / `String` / `Time` / `JSON` |
| Audit list | `auditLogs(filter, first, after): AuditLogConnection!` | `auditLogs(limit: Int): [AuditLog!]!` |
| Tipe dashboard | `dashboard: ...Dashboard!` | belum ada di SDL |
