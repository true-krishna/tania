# Data Model — Sisi Klien (Frontend)

**Feature**: `001-employee-digital-talent-management` · **Repo**: `tania-dashboard`
**Turunan dari**: `spec.md` (Key Entities), `contracts/schema.graphql`, dan model backend
(`tania-backend/specs/.../data-model.md`).

> Frontend **tidak memiliki database**. Dokumen ini menjelaskan bentuk data yang dikonsumsi,
> identitas entitas di cache normalisasi Apollo, field turunan yang **tidak boleh dihitung ulang
> di klien**, dan model form.

---

## 1. Prinsip

1. **Server adalah sumber kebenaran.** Field turunan (`Employee.chapter`,
   `Employee.assignable`, `CvProfile.workExperience`, `EvaluationPeriod.state`) dihitung backend
   dan dipakai apa adanya. Klien **tidak** menurunkan ulang dari relasi.
2. **Tipe hasil codegen dipakai langsung.** Tidak ada tipe view model duplikat untuk entitas
   GraphQL; lapisan tambahan hanya untuk state form dan opsi select.
3. **Identitas cache dari `id`.** Semua tipe ber-`id` memakai `keyFields: ["id"]`; tidak ada
   `dataIdFromObject` kustom.
4. **Tidak ada penyimpanan lokal.** Tidak ada `localStorage`, IndexedDB, atau cookie dari
   frontend; state hanya hidup di memori (cache Apollo + state komponen).

---

## 2. Entitas yang dikonsumsi

Bentuk lengkap ada di `contracts/schema.graphql`. Kolom "Dilayani" = sudah ada di SDL yang
dilayani backend per 2026-10-01.

| Entitas | Field kunci yang dipakai UI | Dilayani |
| --- | --- | --- |
| `User` | `id`, `email`, `fullName`, `accessRole`, `status`, `employee`, `lastLoginAt` | ya (bentuk ringkas) |
| `AuthPayload` | `accessToken`, `accessTokenExpiresAt`, `refreshToken`, `refreshTokenExpiresAt`, `user` | ya |
| `Unit` | `id`, `name`, `isActive`, `projects` | ya |
| `Chapter` | `id`, `name`, `isActive`, `jobRoles` | belum |
| `JobRole` | `id`, `name`, `isActive`, `chapter` (null = tidak assignable) | belum |
| `Project` | `id`, `name`, `unit`, `isActive` | belum |
| `Employee` | `id`, `fullName`, `employeeCode`, `email`, `unit`, `jobRole`, `chapter`, `assignable`, `joinedAt`, `status`, `account`, `assignments`, `idps` | belum |
| `Assignment` | `id`, `employee`, `project`, `jobRole`, `periodStart`, `periodEnd`, `status` | belum |
| `Idp` | `id`, `employee`, `status`, `developmentObjective`, `currentAssessment`, `gapAnalysis`, `timelineStart`, `timelineEnd`, `successIndicators`, `developmentActions`, `reviewLogs` | belum |
| `DevelopmentAction` | `id`, `description`, `method`, `status`, `dueDate` | belum |
| `ReviewLog` | `id`, `reviewDate`, `summary`, `followUp` | belum |
| `CvProfile` | `id`, `summary`, `educations`, `certifications`, `skills`, `workExperience` (turunan) | belum |
| `EvaluationTemplate` | `id`, `name`, `criteria[]`, `isActive` | belum |
| `EvaluationPeriod` | `id`, `name`, `startDate`, `endDate`, `template`, `state` (turunan) | belum |
| `PerformanceEvaluation` | `id`, `period`, `employee`, `answers[]`, `summaryAchievement`, `developmentNotes`, `status` | belum |
| `EvaluationPeriodRosterEntry` | `employee`, `evaluated` | belum |
| `AuditLog` | `id`, `occurredAt`, `actorRole`, `action`, `entityType`, `entityId` | belum |
| `*Dashboard` (4 varian) | agregat widget per peran (lihat `contracts/schema.graphql`) | belum |

---

## 3. Identitas cache & hubungan normalisasi

- `User`, `Unit`, `Chapter`, `JobRole`, `Project`, `Employee`, `Assignment`, `Idp`,
  `DevelopmentAction`, `ReviewLog`, `CvProfile` + sub-entri, `EvaluationTemplate`,
  `EvaluationPeriod`, `PerformanceEvaluation`, `AuditLog` → `keyFields: ["id"]`.
- Relasi objek (`Employee.unit`, `Employee.jobRole`, `Assignment.project`, `Idp.employee`, …)
  sudah normalisasi otomatis karena mengembalikan tipe ber-`id` — satu entitas diperbarui di
  satu tempat, seluruh layar ikut segar.
- Statistik dashboard (`ChapterCount`, `UnitCount`, `RoleCount`, `MasterDataCount`,
  `IdpStatusCount`, `ActionStatusCount`) **tidak** di-cache sebagai entitas; dibaca dengan
  `fetchPolicy: "cache-and-network"` pada tipe dashboard-nya.
- Setelah mutasi, klien me-`refetch` query yang menampilkan entitas berubah (mis.
  `updateDevelopmentActionStatus` → refetch progres IDP) alih-alih menebak bentuk cache baru.

---

## 4. Field turunan (jangan dihitung ulang)

| Field | Arti | Dipakai di |
| --- | --- | --- |
| `Employee.assignable` | `status = ACTIVE` **dan** `jobRole.chapter != null` (FR-23) | kandidat talent pada form assignment/IDP; filter karyawan |
| `Employee.chapter` | chapter pemilik Role posisi (FR-23) | kolom daftar karyawan; konteks Chapter |
| `CvProfile.workExperience` | ringkasan riwayat assignment (termasuk yang berakhir) → bagian pengalaman kerja CV (FR-12) | halaman CV Talent & tampilan read-only Chapter |
| `EvaluationPeriod.state` | periode berjalan vs berakhir (terkunci) (FR-25) | roster & form evaluasi: hanya-baca setelah berakhir |
| `Idp.status` → `NEEDS_REVIEW` | IDP melewati timeline tanpa penutupan (FR-10) | filter & badge daftar IDP |

---

## 5. Bentuk pagination

Semua daftar besar memakai Connection Relay-style:

```text
employees(filter: EmployeeFilter, first: Int = 25, after: String): EmployeeConnection!
EmployeeConnection { edges: [EmployeeEdge!]!, pageInfo: PageInfo!, totalCount: Int! }
EmployeeEdge { node: Employee!, cursor: String! }
PageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor }
```

UI memakai `first` (default 25, maks 100 dari konvensi API) + `endCursor` sebagai `after` untuk
"muat berikutnya"; `totalCount` ditampilkan sebagai jumlah hasil filter. Daftar kecil
(master data, kriteria template) memakai list biasa.

---

## 6. Model form & state klien

| Model | Field | Aturan UI yang dicerminkan |
| --- | --- | --- |
| Form karyawan | `fullName`, `employeeCode`, `email`, `unitId`, `jobRoleId`, `joinedAt`, `status` | divisi & posisi **wajib dipilih dari master** (FR-01); `unitId`/`jobRoleId` tidak pernah input bebas |
| Form assignment | `employeeId`, `projectId`, `jobRoleId`, `periodStart`, `periodEnd?`, `status` | `employeeId` hanya dari `assignableTalents`; `projectId` dari master Project (FR-05) |
| Form IDP | 7 komponen (objective, kondisi saat ini, gap, aksi, timeline, success indicators) | aksi pengembangan diinput sebagai daftar entri terpisah (FR-08) |
| Form CV | `summary` + daftar pendidikan/sertifikasi/keahlian | pengalaman kerja **tidak** diinput (turunan, FR-12) |
| Form evaluasi | jawaban per kriteria sesuai `answerType` periode + `summaryAchievement` + `developmentNotes` | tipe jawaban menentukan kontrol (skala 1–5, 1–10, ya/tidak, teks bebas) (FR-31) |
| Filter daftar | `search`, `unitId`, `jobRoleId`, `status`, `assignableOnly` | dikirim sebagai variabel GraphQL, tidak pernah ke URL |
| Dialog nonaktifkan karyawan | `acknowledgeActiveWork: Boolean` | ditampilkan bila karyawan punya assignment aktif/IDP berjalan |

State UI lokal (`useState`/`useReducer` per fitur) hanya untuk: nilai form, halaman filter,
dialog terbuka/tertutup, dan pesan validasi. Tidak ada state manager global (lihat
`research.md` FRD10).

---

## 7. Enum yang dipakai sebagai label/badge

`AccessRole`, `AccountStatus`, `EmployeeStatus`, `AssignmentStatus`, `IdpStatus`,
`DevelopmentActionStatus`, `DevelopmentMethod`, `EvaluationAnswerType`,
`PerformanceEvaluationStatus`, `EvaluationPeriodState`, `EvaluationFillState`, `AuditAction`.

Label Indonesia untuk setiap nilai dipetakan sekali di `src/lib/format.ts` (atau
`src/lib/errors.ts` untuk kode error) agar tidak diulang per layar.
