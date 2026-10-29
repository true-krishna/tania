// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import {
  BulkSetJobRoleChapterDocument,
  BulkSetUnitActiveDocument,
  JobRolesDocument,
  UnitsDocument,
} from "@/generated/graphql";
import {
  useMasterDataBulkActions,
  type MasterDataBulkSelectionRow,
} from "./useMasterDataBulkActions";
import type { MergedImportReport } from "./useMasterDataImport";

function makeRows(count: number): MasterDataBulkSelectionRow[] {
  return Array.from({ length: count }, (_, i) => ({ id: `e-${i + 1}`, label: `Entri ${i + 1}` }));
}

function idsOf(from: number, to: number): string[] {
  return Array.from({ length: to - from }, (_, i) => `e-${from + i + 1}`);
}

const REFRESH_MOCKS: MockedResponse[] = [
  {
    request: { query: UnitsDocument, variables: { includeInactive: true } },
    result: { data: { units: [] } },
  },
  {
    request: { query: JobRolesDocument, variables: { includeInactive: true } },
    result: { data: { jobRoles: [] } },
  },
];

function unitActiveMock(
  ids: string[],
  isActive: boolean,
  failed: { index: number; message: string }[] = [],
): MockedResponse {
  return {
    request: { query: BulkSetUnitActiveDocument, variables: { ids, isActive } },
    result: {
      data: {
        bulkSetUnitActive: {
          __typename: "BulkUnitResult",
          succeeded: ids
            .map((_, index) => ({ __typename: "BulkUnitItemResult", index }))
            .filter((row) => !failed.some((failure) => failure.index === row.index)),
          failed: failed.map((failure) => ({
            __typename: "BulkUnitItemResult",
            index: failure.index,
            error: {
              __typename: "BulkMasterDataError",
              code: "REFERENCED",
              message: failure.message,
            },
          })),
        },
      },
    },
  };
}

function renderBulkActions(mocks: MockedResponse[]) {
  return renderHook(() => useMasterDataBulkActions(), {
    wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>,
  });
}

async function runBulk(
  mocks: MockedResponse[],
  entity: "unit" | "jobRole",
  action: Parameters<ReturnType<typeof useMasterDataBulkActions>["run"]>[1],
  rows: MasterDataBulkSelectionRow[],
) {
  const { result } = renderBulkActions(mocks);
  let report!: MergedImportReport;
  const progress: [number, number][] = [];
  await act(async () => {
    report = await result.current.run(entity, action, rows, (current, total) =>
      progress.push([current, total]),
    );
  });
  return { report, progress };
}

describe("useMasterDataBulkActions (TAN-351 — enam mutasi massal TAN-349)", () => {
  it("splits a selection above 100 ids into sequential ≤100-id operations (FR-06, Opsi A)", async () => {
    const rows = makeRows(250);
    const { report, progress } = await runBulk(
      [
        unitActiveMock(idsOf(0, 100), true),
        unitActiveMock(idsOf(100, 200), true),
        unitActiveMock(idsOf(200, 250), true),
        ...REFRESH_MOCKS,
      ],
      "unit",
      { kind: "set-active", isActive: true },
      rows,
    );

    expect(progress).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
    expect(report.succeeded).toHaveLength(250);
    expect(report.failed).toHaveLength(0);
    expect(report.notExecuted).toHaveLength(0);
    expect(report.stopReason).toBeNull();
    // Index hasil mutasi dipetakan balik ke baris seleksi global (bukan per potongan).
    expect(report.succeeded[0].label).toBe("Entri 1");
    expect(report.succeeded[99].label).toBe("Entri 100");
    expect(report.succeeded[100].label).toBe("Entri 101");
    expect(report.succeeded[249].label).toBe("Entri 250");
  });

  it("reports failed rows with their label and the server dependency reason (FR-04)", async () => {
    const dependencyMessage =
      'Unit "Entri 2" masih dipakai 2 initiative dan 1 kontrak — pindahkan referensinya terlebih dahulu.';
    const { report } = await runBulk(
      [
        unitActiveMock(["e-1", "e-2"], false, [{ index: 1, message: dependencyMessage }]),
        ...REFRESH_MOCKS,
      ],
      "unit",
      { kind: "set-active", isActive: false },
      makeRows(2),
    );

    expect(report.succeeded.map((entry) => entry.label)).toEqual(["Entri 1"]);
    expect(report.failed).toEqual([{ rowNumber: 2, label: "Entri 2", reason: dependencyMessage }]);
    expect(report.notExecuted).toHaveLength(0);
  });

  it("stops after a whole-chunk failure and reports the remaining rows as not executed", async () => {
    const { report } = await runBulk(
      [
        {
          request: {
            query: BulkSetUnitActiveDocument,
            variables: { ids: idsOf(0, 100), isActive: true },
          },
          error: new Error("koneksi terputus"),
        },
        ...REFRESH_MOCKS,
      ],
      "unit",
      { kind: "set-active", isActive: true },
      makeRows(120),
    );

    expect(report.stopReason).toBe("Gagal menjalankan aksi massal.");
    expect(report.succeeded).toHaveLength(0);
    expect(report.failed).toHaveLength(0);
    expect(report.notExecuted).toHaveLength(120);
  });

  it("sends chapterId null when releasing the owner chapter via bulkSetJobRoleChapter", async () => {
    const { report } = await runBulk(
      [
        {
          request: {
            query: BulkSetJobRoleChapterDocument,
            variables: { ids: ["r-1"], chapterId: null },
          },
          result: {
            data: {
              bulkSetJobRoleChapter: {
                __typename: "BulkJobRoleResult",
                succeeded: [{ __typename: "BulkJobRoleItemResult", index: 0 }],
                failed: [],
              },
            },
          },
        },
        ...REFRESH_MOCKS,
      ],
      "jobRole",
      { kind: "change-select", value: "" },
      [{ id: "r-1", label: "Backend Engineer" }],
    );

    expect(report.succeeded.map((entry) => entry.label)).toEqual(["Backend Engineer"]);
  });
});
