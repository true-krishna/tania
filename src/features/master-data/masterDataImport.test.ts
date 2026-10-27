import { describe, expect, it, vi } from "vitest";
import {
  importRowsInChunks,
  MASTER_DATA_IMPORT_MAX_ROWS,
  type ChunkOutcome,
} from "./useMasterDataImport";

type TestRow = { rowNumber: number; name: string };

function makeRows(count: number, firstRowNumber = 2): TestRow[] {
  return Array.from({ length: count }, (_, i) => ({
    rowNumber: firstRowNumber + i,
    name: `Baris ${firstRowNumber + i}`,
  }));
}

function successfulChunk(size: number): ChunkOutcome {
  return { succeeded: Array.from({ length: size }, (_, index) => index), failed: [] };
}

describe("importRowsInChunks (TAN-350 — pemecahan potongan ≤100 baris, FR-06)", () => {
  it("keeps the per-operation limit at 100 rows", () => {
    expect(MASTER_DATA_IMPORT_MAX_ROWS).toBe(100);
  });

  it("runs a file within the limit as one operation", async () => {
    const rows = makeRows(80);
    const chunkSizes: number[] = [];
    const report = await importRowsInChunks({
      rows,
      describeRow: (row) => row.name,
      toVariables: (row) => ({ name: row.name }),
      importChunk: async (variables) => {
        chunkSizes.push(variables.length);
        return successfulChunk(variables.length);
      },
    });
    expect(chunkSizes).toEqual([80]);
    expect(report.succeeded).toHaveLength(80);
    expect(report.failed).toHaveLength(0);
    expect(report.notExecuted).toHaveLength(0);
    expect(report.stopReason).toBeNull();
  });

  it("splits a file above the limit into sequential chunks of at most 100 rows (Opsi A)", async () => {
    const rows = makeRows(250);
    const chunkSizes: number[] = [];
    const report = await importRowsInChunks({
      rows,
      describeRow: (row) => row.name,
      toVariables: (row) => ({ name: row.name }),
      importChunk: async (variables) => {
        chunkSizes.push(variables.length);
        return successfulChunk(variables.length);
      },
    });
    expect(chunkSizes).toEqual([100, 100, 50]);
    expect(report.succeeded).toHaveLength(250);
    expect(report.stopReason).toBeNull();
  });

  it("maps chunk-local indexes back to file rowNumbers in the merged report", async () => {
    const rows = makeRows(120);
    const report = await importRowsInChunks({
      rows,
      describeRow: (row) => row.name,
      toVariables: (row) => ({ name: row.name }),
      importChunk: async (variables) =>
        variables.length === 100
          ? successfulChunk(100)
          : { succeeded: [1], failed: [{ index: 0, message: 'Kode Unit "C102" sudah terdaftar.' }] },
    });
    expect(report.succeeded).toHaveLength(101);
    expect(report.succeeded.at(-1)).toEqual({ rowNumber: 103, label: "Baris 103" });
    expect(report.failed).toEqual([
      { rowNumber: 102, label: "Baris 102", reason: 'Kode Unit "C102" sudah terdaftar.' },
    ]);
    expect(report.notExecuted).toHaveLength(0);
  });

  it("reports each chunk's progress while running", async () => {
    const rows = makeRows(250);
    const onProgress = vi.fn();
    await importRowsInChunks({
      rows,
      describeRow: (row) => row.name,
      toVariables: (row) => ({ name: row.name }),
      importChunk: async (variables) => successfulChunk(variables.length),
      onProgress,
    });
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
    expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
  });

  it("stops on a chunk-level failure and reports the remaining rows as not executed", async () => {
    const rows = makeRows(250);
    const chunkSizes: number[] = [];
    const report = await importRowsInChunks({
      rows,
      describeRow: (row) => row.name,
      toVariables: (row) => ({ name: row.name }),
      importChunk: async (variables) => {
        chunkSizes.push(variables.length);
        if (chunkSizes.length === 2) throw new Error("network down");
        return successfulChunk(variables.length);
      },
    });
    expect(chunkSizes).toEqual([100, 100]);
    expect(report.succeeded).toHaveLength(100);
    expect(report.failed).toHaveLength(0);
    expect(report.notExecuted).toHaveLength(150);
    expect(report.notExecuted[0]).toEqual({ rowNumber: 102, label: "Baris 102" });
    expect(report.notExecuted.at(-1)).toEqual({ rowNumber: 251, label: "Baris 251" });
    expect(report.stopReason).toBe("Gagal mengimpor data massal.");
  });

  it("honors a smaller maxRowsPerChunk", async () => {
    const rows = makeRows(5);
    const chunkSizes: number[] = [];
    await importRowsInChunks({
      rows,
      describeRow: (row) => row.name,
      toVariables: (row) => ({ name: row.name }),
      importChunk: async (variables) => {
        chunkSizes.push(variables.length);
        return successfulChunk(variables.length);
      },
      maxRowsPerChunk: 2,
    });
    expect(chunkSizes).toEqual([2, 2, 1]);
  });

  it("runs nothing for an empty row list", async () => {
    const importChunk = vi.fn(async () => successfulChunk(0));
    const report = await importRowsInChunks({
      rows: [],
      describeRow: (row: TestRow) => row.name,
      toVariables: (row: TestRow) => ({ name: row.name }),
      importChunk,
    });
    expect(importChunk).not.toHaveBeenCalled();
    expect(report.succeeded).toHaveLength(0);
    expect(report.failed).toHaveLength(0);
    expect(report.notExecuted).toHaveLength(0);
    expect(report.stopReason).toBeNull();
  });
});
