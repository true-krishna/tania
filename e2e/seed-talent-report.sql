-- e2e/seed-talent-report.sql — fixture E2E laporan talent (T028).
--
-- Ditumpuk SETELAH migrasi backend (termasuk 0004_seed.sql + backfill kontrak
-- 0005) pada database FRESH (`docker compose down -v` dahulu). Menambahkan
-- karyawan + kontrak + CV yang membentuk skenario laporan:
--
--   * dua chapter berisi talent (Engineer: A/B, Product: C/D) untuk SC-05,
--   * churn nyata (Eka Engineer resign 2026-03) untuk V-5,
--   * sebaran jenjang pendidikan & lokasi kerja untuk V-3/V-4,
--   * angka yang berbeda antara rentang penuh vs 2025-01..2025-12 (SC-04).
--
-- Ekspektasi `n =` (rentang penuh 2022-01..2026-12 vs filter 2025-01..2025-12)
-- dipakai sebagai konstanta di e2e/critical-path.spec.ts:
--
--   Operation  : distribusi 6 -> 4, gerakan 10 -> 3
--   Chapter    : distribusi 4, gerakan 6  (scope Engineer saja)
--
-- ID deterministik (prefix 7000…/8000…/9000…) dan ON CONFLICT DO NOTHING,
-- sehingga re-apply tidak berbahaya; angka di atas hanya valid untuk database
-- fresh tanpa data lain.

-- ---------- Karyawan tambahan (tanpa akun login) ----------
INSERT INTO employees (id, user_id, full_name, employee_code, email, unit_id, job_role_id, joined_at, status, birth_date, gender) VALUES
    ('70000000-0000-4000-8000-000000000001', NULL, 'Alya Engineer', 'TAN-1001', 'alya.engineer@tania.test',
     '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '2025-02-01', 'ACTIVE', '1994-05-10', 'female'),
    ('70000000-0000-4000-8000-000000000002', NULL, 'Bima Engineer', 'TAN-1002', 'bima.engineer@tania.test',
     '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '2025-03-01', 'ACTIVE', '1988-11-02', 'male'),
    ('70000000-0000-4000-8000-000000000003', NULL, 'Citra Product', 'TAN-1003', 'citra.product@tania.test',
     '20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '2026-01-05', 'ACTIVE', '2000-02-20', 'female'),
    ('70000000-0000-4000-8000-000000000004', NULL, 'Dika Product', 'TAN-1004', 'dika.product@tania.test',
     '20000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', '2026-02-01', 'ACTIVE', '1997-07-07', 'male'),
    ('70000000-0000-4000-8000-000000000005', NULL, 'Eka Engineer', 'TAN-1005', 'eka.engineer@tania.test',
     '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '2025-04-01', 'RESIGNED', '1990-01-30', 'male')
ON CONFLICT (id) DO NOTHING;

-- ---------- Kontrak ----------
-- A/B/C/D: PKWTT terbuka (new talent per bulan mulai; snapshot 2026-12-31).
-- Eka: PKWT yang berakhir resign 2026-03 (satu-satunya churn pada skenario).
INSERT INTO employment_contracts (id, employee_id, contract_no, contract_type, nomor_induk, job_role_id, unit_id, work_location, start_date, end_date, end_reason, terminated_at) VALUES
    ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'SK/E2E/1001', 'pkwtt', 'TAN-1001',
     '40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Jakarta', '2025-02-01', NULL, NULL, NULL),
    ('80000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', 'SK/E2E/1002', 'pkwtt', 'TAN-1002',
     '40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Bandung', '2025-03-01', NULL, NULL, NULL),
    ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000003', 'SK/E2E/1003', 'pkwtt', 'TAN-1003',
     '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Jakarta', '2026-01-05', NULL, NULL, NULL),
    ('80000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000004', 'SK/E2E/1004', 'pkwtt', 'TAN-1004',
     '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Bandung', '2026-02-01', NULL, NULL, NULL),
    ('80000000-0000-4000-8000-000000000005', '70000000-0000-4000-8000-000000000005', 'SK/E2E/1005', 'pkwt', 'TAN-1005',
     '40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Jakarta', '2025-04-01', '2026-03-31', 'resign', '2026-03-31T17:00:00+07:00')
ON CONFLICT (id) DO NOTHING;

-- ---------- CV: jenjang pendidikan (V-3) ----------
-- TAN-0001/TAN-0004 sengaja tanpa entri → bucket MISSING ("Belum diisi").
INSERT INTO cv_profiles (id, employee_id, summary) VALUES
    ('90000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Profil E2E Alya'),
    ('90000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', 'Profil E2E Bima'),
    ('90000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000003', 'Profil E2E Citra'),
    ('90000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000004', 'Profil E2E Dika')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cv_educations (id, cv_profile_id, institution, degree, field_of_study, start_year, end_year) VALUES
    ('91000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 'Institut E2E', 'S1', 'Informatika', 2012, 2016),
    ('91000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000002', 'Universitas E2E', 'S2', 'Sistem Informasi', 2016, 2018),
    ('91000000-0000-4000-8000-000000000003', '90000000-0000-4000-8000-000000000003', 'Politeknik E2E', 'D3', 'Desain', 2018, 2021),
    ('91000000-0000-4000-8000-000000000004', '90000000-0000-4000-8000-000000000004', 'Institut E2E', 'S1', 'Manajemen', 2015, 2019)
ON CONFLICT (id) DO NOTHING;
