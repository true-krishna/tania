# Bug Assessment: Nama karyawan hilang setelah dipilih di menu Tambah Akun

- **Slug**: employee-picker-selection
- **Issue**: TAN-394 — Menu tambah akun: nama akun hasil pencarian hilang saat dipilih
- **Verdict**: valid (confirmed by reading the code, no runtime reproduction needed)
- **Severity**: High
- **Source**: assessment posted on the issue (TAN-394) on 2026-10-30; transcribed to disk so
  `/speckit-bug-fix` has the contract it expects. Content is unchanged.

## User Report

Pada menu tambah akun, saat user mencari nama akun yang mau ditambahkan, namanya muncul di daftar
tetapi ketika dipilih, namanya hilang. Seharusnya nama yang dicari lalu dipilih, namanya muncul
untuk dikonfigurasikan aksesnya.

## Root Cause (frontend, pure UI state)

The employee picker in the Add-Account modal derived "selected employee" only from the currently
active lookup page:

- `src/features/accounts/EmployeePicker.tsx:46` — `selectedEmployee` was resolved from `items`
  (the current `employeeLookup` result).
- On select (`handleSelect`, lines 68–73) `onChange(employeeId)` stored the ID in the form, but
  `setQuery("")` cleared the search, so the lookup re-ran **unfiltered** and returned only the
  first 10 employees of the default list (`PAGE_SIZE = 10`).
- When the picked employee was not in that default page — the normal case, precisely because the
  user searched for them — `items.find(...)` returned `null`: the chip was not rendered (line 166)
  and the input showed the now-empty `query` (line 152), so the field looked empty.

Important: **the employee ID was still stored** in the form state
(`src/features/accounts/AccountsSection.tsx:57`), so submit still carried the right person and the
"Karyawan wajib dipilih." validation did not fire. What was lost was the visual confirmation.

## Impact & Scope

- Add-Account flow only (Akun Pengguna menu); `EmployeePicker` has a single call site
  (`src/features/accounts/AccountsSection.tsx:225`) and there is no edit flow pre-filling it.
- Backend is fine: `employeeLookup` filters and paginates correctly. No backend change needed.
- Severity High: the core RBAC admin flow looks broken, risking duplicate or aborted input that was
  already correct. Not Urgent because submit still succeeds.
- Why it escaped tests: the component test mocked only the unfiltered query
  (`src/features/accounts/EmployeePicker.test.tsx:9`); picking from a filtered result outside the
  default page was not covered.

## Proposed Remediation

Keep the picked employee record separately from the active lookup page — cache the option at
`onSelect` instead of deriving it from `items.find(...)`.

## Files likely to change

- `src/features/accounts/EmployeePicker.tsx` — hold the picked option in component state; prefer it
  over the page lookup when its id matches `value`; clear it in `handleClear`.
- `src/features/accounts/EmployeePicker.test.tsx` — regression coverage for the filtered-pick path
  and for the keyboard path showing the name.

## Tests to add or update

- Mock a filtered query, pick an employee that is outside the unfiltered default page, assert the
  chip (name + nomor induk) stays visible after the lookup settles back to the default page.
- Assert the keyboard path (ArrowDown + Enter) renders the picked name.

## Acceptance Criteria

- [x] After picking from a filtered result (employee NOT in the default top-10), the name stays
      visible as a chip (name + nomor induk) until the modal is closed/reset.
- [x] The selection survives form re-renders, including validation errors on other fields.
- [x] The X button ("Bersihkan pilihan karyawan") removes the chip and empties the field.
- [x] Regression: mouse pick and keyboard pick (ArrowDown + Enter) both show the name; picking an
      employee that happens to be on the default page still works.
- [x] New regression test reproducing this path: filtered query mock, pick outside the default
      page → chip still visible.

## Risks & Considerations

- Do not widen `PAGE_SIZE` or add an "all employees" fetch — that would only mask the state bug.
- The cached option must be dropped when the selection is cleared, so a stale name cannot outlive
  the cleared id.
- `value` remains the source of truth for the form; the cached option is display-only.
