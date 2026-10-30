# Bug Fix: Nama karyawan tetap tampil setelah dipilih di menu Tambah Akun

- **Slug**: employee-picker-selection
- **Fixed**: 2026-10-30
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

`EmployeePicker` now remembers the option the user picked instead of re-deriving it from the
currently loaded lookup page. Selecting clears the search, which re-runs the lookup unfiltered and
usually leaves the picked employee out of the returned page — previously that made the chip vanish
and the field look empty even though the id was still in the form.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `src/features/accounts/EmployeePicker.tsx` | modified | `selectedOption` state caches the picked `EmployeeOption` on select; `selectedEmployee` prefers the cache when its id matches `value`, else falls back to the loaded page; `handleClear` drops the cache. |
| `src/features/accounts/EmployeePicker.test.tsx` | added/updated tests | Added a `ControlledPicker` harness (mirrors `AccountsSection` lifting the id) plus a filtered-query mock; new regression test; keyboard test now asserts the rendered name. |
| `.specify/bugs/employee-picker-selection/assessment.md` | added | Assessment transcribed from the TAN-394 issue comment so this command has its contract on disk. |

## Diff Highlights

```tsx
const [selectedOption, setSelectedOption] = React.useState<EmployeeOption | null>(null);
...
const selectedEmployee =
  value && selectedOption?.id === value
    ? selectedOption
    : (items.find((employee) => employee.id === value) ?? null);

function handleSelect(employeeId: string) {
  setSelectedOption(items.find((employee) => employee.id === employeeId) ?? null);
  onChange(employeeId);
  ...
}

function handleClear() {
  setSelectedOption(null);
  onChange("");
  ...
}
```

## Tests Added or Updated

- `src/features/accounts/EmployeePicker.test.tsx::keeps a picked employee outside the default page visible as a chip` — types a filtered query, picks Zulkifli (id `emp-9`, not present in the unfiltered default page), waits for the debounced query to settle back to the default page, then asserts the chip (name + `(EMP-0909)`) is still rendered, the input is empty, and the chip survives re-opening the list. Fails without the fix, passes with it (verified by stashing the component change).
- `src/features/accounts/EmployeePicker.test.tsx::selects the active option with ArrowDown and Enter` — now rendered through the controlled harness and asserts the picked name and nomor induk are displayed, covering the keyboard path.

## Local Verification

- `npx vitest run src/features/accounts/EmployeePicker.test.tsx` → 5 passed with the fix; on the pre-fix component the new regression test fails with "Unable to find an element with the text: Zulkifli Rahman" (reproduction confirmed).
- `npx vitest run` (full suite) → 74 files / 816 tests passed.
- `npx tsc --noEmit` → clean.
- `npx eslint src/features/accounts/EmployeePicker.tsx src/features/accounts/EmployeePicker.test.tsx` → clean (the local `tania/no-comments` rule rejects comments in component files, so the rationale lives here and in the test only).
- `npx prettier --check` on both files → clean.
- Manual checks: none — no browser session against a seeded backend in this environment; the behaviour is pinned by the component test above.

## Deviations from Assessment

- The assessment's `EmployeePicker.tsx:46` / `:68` / `:152` / `:166` line references have drifted
  on current `master` (the component moved slightly); the root cause and shape of the fix are
  unchanged.
- Added a `ControlledPicker` test harness rather than asserting through a `vi.fn()` `onChange`,
  because the bug depends on the picked id flowing back in through `value` — an uncontrolled mock
  could never have reproduced it.

## Follow-ups

- Backend/API untouched; no contract change.
- `employeeLookup` still pages at 10 rows for the picker; if the picker should allow browsing beyond
  the first page, that is a separate UX decision (do not widen `PAGE_SIZE` as a substitute for this
  fix).
- Nice-to-have: assert the chip survives a validation error on a sibling field (`roleName`), which
  needs a small `AccountsSection`-level test rather than a picker-level one.
