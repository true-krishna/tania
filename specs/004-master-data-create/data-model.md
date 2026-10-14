# Phase 1 — Data Model: Tambah Master Data (Create) — Job Role, Initiative, Unit

**Feature**: `004-master-data-create` (TAN-187) · **Date**: 2026-10-14

**Tanpa perubahan skema/entitas.** Plan ini hanya menambahkan operasi Create atas model yang sudah ada (Unit, JobRole, Project, AuditEntry). Field di bawah mencerminkan domain existing di `tania-backend/internal/domain/masterdata.go` dan `unit.go`; tidak ada kolom, relasi, atau migrasi baru.

## Built-in Create (sudah ada)

Ketiga usecase mengikuti bentuk baku: **authorize → validate → persist → audit** dalam satu transaksi.

### Unit (`createUnit`)

| Field | Tipe | Aturan Create |
| --- | --- | --- |
| `id` | ID | Dibuat server (UUID) |
| `name` | String | **Wajib**; dinormalisasi (`normalizeName`); **unik** (duplikat → `ErrConflict`) |
| `isActive` | Boolean | Selalu `true` saat dibuat |
| `projects` | [Project] | Turunan relasi; tidak diisi saat create |
| `createdAt` / `updatedAt` | Time | Diisi server |

### JobRole (`createJobRole`)

| Field | Tipe | Aturan Create |
| --- | --- | --- |
| `id` | ID | Dibuat server |
| `name` | String | **Wajib**; dinormalisasi; **unik** |
| `chapter` | Chapter? | **Opsional** (boleh kosong). Bila diisi, **harus chapter aktif & ada**; bila tidak → error validasi |
| `isActive` | Boolean | `true` saat dibuat |
| `createdAt` / `updatedAt` | Time | Diisi server |

> FR-22 induk: Master Data Role boleh memiliki tepat satu chapter pemilik **atau tidak sama sekali**. Inilah dasar perbaikan G1 pada form.

### Project / Initiative (`createProject`)

| Field | Tipe | Aturan Create |
| --- | --- | --- |
| `id` | ID | Dibuat server |
| `name` | String | **Wajib**; dinormalisasi; **unik dalam Unit** (duplikat → `ErrConflict`) |
| `unit` | Unit | **Wajib** — harus merujuk tepat satu Unit yang ada (FR-19/FR-006); tanpa Unit → error validasi |
| `isActive` | Boolean | `true` saat dibuat |
| `createdAt` / `updatedAt` | Time | Diisi server |

### AuditEntry (turunan, FR-16/FR-17 induk)

| Field | Keterangan |
| --- | --- |
| `identity` | Aktor (Admin) |
| `action` | `AuditCreate` |
| `entityType` / `entityID` | `unit` / `job_role` / `project` + id entitas |
| `after` | Snapshot nilai setelah create |
| Persistensi | Ditulis **dalam transaksi yang sama** dengan create — perubahan tanpa audit tidak dapat ter-commit |

## Status & transisi

- Entitas baru selalu `isActive = true`.
- Transisi yang **tidak** ada: `delete` (aplikasi tidak menyediakan operasi hapus — FR-21 induk); penonaktifan hanya boleh bila tidak lagi direferensikan (mis. Unit tanpa Project).
- Update (rename) dan aktif/non-aktif di luar scope plan ini (sudah ada; hanya diregresi-test).

## Aturan validasi (ringkasan, dari spec)

| # | Aturan | Sumber |
| --- | --- | --- |
| V1 | Nama wajib (kosong/spasi → ditolak) | FR-004 |
| V2 | Nama unik (per entitas; Project per Unit) | FR-005 |
| V3 | Initiative wajib merujuk tepat satu Unit | FR-006 / FR-19 induk |
| V4 | Referensi Job Role (chapter) opsional; bila diisi harus valid & aktif | FR-22 induk / G1 |
| V5 | Create hanya oleh Admin | FR-010 |
| V6 | Create mencatat jejak audit | FR-016 |

## Catatan implementasi (delta)

- **Frontend**: satu perubahan aturan validasi di `MasterDataSection` (kewajiban `select` eksplisit per halaman) agar **V4** benar; penambahan test untuk Job Role/Initiative.
- **Backend**: tidak berubah — V1–V3, V5, V6 sudah ditegakkan server-side.
