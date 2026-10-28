"use client";

import { ApolloError, useMutation } from "@apollo/client";
import {
  ChaptersDocument,
  ImportChaptersDocument,
  ImportJobRolesDocument,
  ImportProjectsDocument,
  ImportUnitsDocument,
  JobRolesDocument,
  ProjectsDocument,
  UnitsDocument,
} from "@/generated/graphql";
import type { BulkMasterDataErrorCode } from "@/generated/graphql/types";
import { BULK_MASTER_DATA_ERROR_LABEL, errorMessage } from "@/lib/errors";
import { refetch } from "./useMasterDataMutations";
import {
  MASTER_DATA_IMPORT_TEMPLATES,
  type MasterDataImportEntity,
  type MasterDataImportRow,
} from "./masterDataImportTemplate";

/**
 * Batas baris per operasi impor (FR-06) — ditegakkan server. Klien memecah
 * hasil baca templat menjadi potongan maksimum 100 baris (keputusan pemilik
 * produk "Opsi A", thread TAN-348 2026-10-27) lalu memanggil mutasi impor
 * berurutan per potongan; berkas >100 baris tidak ditolak di sisi klien.
 */
export const MASTER_DATA_IMPORT_MAX_ROWS = 100;

export type ChunkOutcome = {
  succeeded: readonly number[];
  failed: readonly { index: number; message: string }[];
};

export type ImportRowEntry = { rowNumber: number; label: string };

export type MergedImportReport = {
  succeeded: readonly ImportRowEntry[];
  failed: readonly (ImportRowEntry & { reason: string })[];
  /** Baris yang belum tereksekusi — operasi dihentikan sebelum gilirannya. */
  notExecuted: readonly ImportRowEntry[];
  /** Alasan penghentian impor (null bila seluruh potongan selesai dijalankan). */
  stopReason: string | null;
};

type WireChunkResult = {
  succeeded?: ReadonlyArray<{ index: number } | null> | null;
  failed?: ReadonlyArray<{
    index: number;
    error?: { code: BulkMasterDataErrorCode; message: string } | null | undefined;
  }> | null;
} | null | undefined;

function normalizeChunk(result: WireChunkResult): ChunkOutcome {
  return {
    succeeded: (result?.succeeded ?? []).flatMap((item) => (item ? [item.index] : [])),
    failed: (result?.failed ?? []).flatMap((item) => {
      if (!item) return [];
      const message =
        item.error?.message ??
        (item.error ? BULK_MASTER_DATA_ERROR_LABEL[item.error.code] : "Baris gagal diproses.");
      return [{ index: item.index, message }];
    }),
  };
}

/**
 * Menjalankan impor massal per potongan (maksimum `maxRowsPerChunk` baris) dan
 * menggabungkan hasil seluruh potongan menjadi satu laporan per baris yang
 * dikunci ke `rowNumber` hasil baca templat. Potongan dipanggil berurutan;
 * bila sebuah potongan gagal utuh (mis. gangguan jaringan), eksekusi
 * dihentikan dan sisa baris dilaporkan "belum dieksekusi" — baris potongan
 * sebelumnya tetap terlapor apa adanya.
 */
export async function importRowsInChunks<
  Row extends { rowNumber: number },
  Vars,
>(options: {
  rows: readonly Row[];
  describeRow: (row: Row) => string;
  toVariables: (row: Row) => Vars;
  importChunk: (variables: Vars[]) => Promise<ChunkOutcome>;
  maxRowsPerChunk?: number;
  onProgress?: (chunkIndex: number, chunkTotal: number) => void;
}): Promise<MergedImportReport> {
  const {
    rows,
    describeRow,
    toVariables,
    importChunk,
    maxRowsPerChunk = MASTER_DATA_IMPORT_MAX_ROWS,
    onProgress,
  } = options;

  const succeeded: ImportRowEntry[] = [];
  const failed: (ImportRowEntry & { reason: string })[] = [];
  let stopReason: string | null = null;

  const chunkTotal = Math.max(1, Math.ceil(rows.length / maxRowsPerChunk));
  for (let start = 0; start < rows.length && !stopReason; start += maxRowsPerChunk) {
    const chunk = rows.slice(start, start + maxRowsPerChunk);
    onProgress?.(Math.floor(start / maxRowsPerChunk) + 1, chunkTotal);
    try {
      const outcome = await importChunk(chunk.map(toVariables));
      for (const index of outcome.succeeded) {
        const row = chunk[index];
        if (row) succeeded.push({ rowNumber: row.rowNumber, label: describeRow(row) });
      }
      for (const failure of outcome.failed) {
        const row = chunk[failure.index];
        if (row) failed.push({ rowNumber: row.rowNumber, label: describeRow(row), reason: failure.message });
      }
    } catch (err) {
      stopReason = errorMessage(err instanceof ApolloError ? err : null, "Gagal mengimpor data massal.");
      break;
    }
  }

  const notExecuted: ImportRowEntry[] = [];
  if (stopReason) {
    const accounted = new Set([...succeeded, ...failed].map((entry) => entry.rowNumber));
    for (const row of rows) {
      if (!accounted.has(row.rowNumber)) {
        notExecuted.push({ rowNumber: row.rowNumber, label: describeRow(row) });
      }
    }
  }

  return { succeeded, failed, notExecuted, stopReason };
}

export type MasterDataImportRunner = (
  entity: MasterDataImportEntity,
  rows: readonly MasterDataImportRow[],
  onProgress?: (chunkIndex: number, chunkTotal: number) => void,
) => Promise<MergedImportReport>;

/**
 * Impor master data massal (TAN-350) — empat mutasi impor TAN-348 dengan
 * pembagian potongan 100 baris di klien. Setiap mutasi menyegarkan daftar
 * entitasnya sendiri (`refetchQueries` per dokumen query, variabel sama
 * dengan pemakaian halaman) sehingga daftar terbarui tanpa langkah manual.
 */
export function useMasterDataBulkImport(): { run: MasterDataImportRunner } {
  const [importUnits] = useMutation(ImportUnitsDocument, { refetchQueries: refetch(UnitsDocument) });
  const [importProjects] = useMutation(ImportProjectsDocument, {
    refetchQueries: refetch(ProjectsDocument),
  });
  const [importJobRoles] = useMutation(ImportJobRolesDocument, {
    refetchQueries: refetch(JobRolesDocument),
  });
  const [importChapters] = useMutation(ImportChaptersDocument, {
    refetchQueries: refetch(ChaptersDocument),
  });

  async function run(
    entity: MasterDataImportEntity,
    rows: readonly MasterDataImportRow[],
    onProgress?: (chunkIndex: number, chunkTotal: number) => void,
  ): Promise<MergedImportReport> {
    const config = MASTER_DATA_IMPORT_TEMPLATES[entity];
    const shared = { rows, onProgress, describeRow: (row: MasterDataImportRow) => config.describeRow(row.values) };
    switch (entity) {
      case "unit":
        return importRowsInChunks({
          ...shared,
          toVariables: (row) => ({ code: row.values.code ?? "", name: row.values.name ?? "" }),
          importChunk: async (variables) =>
            normalizeChunk((await importUnits({ variables: { input: { rows: variables } } })).data?.importUnits),
        });
      case "project":
        return importRowsInChunks({
          ...shared,
          toVariables: (row) => ({ name: row.values.name ?? "", unit: row.values.unit ?? "" }),
          importChunk: async (variables) =>
            normalizeChunk(
              (await importProjects({ variables: { input: { rows: variables } } })).data?.importProjects,
            ),
        });
      case "jobRole":
        return importRowsInChunks({
          ...shared,
          toVariables: (row) => ({ name: row.values.name ?? "", chapter: row.values.chapter || undefined }),
          importChunk: async (variables) =>
            normalizeChunk(
              (await importJobRoles({ variables: { input: { rows: variables } } })).data?.importJobRoles,
            ),
        });
      case "chapter":
        return importRowsInChunks({
          ...shared,
          toVariables: (row) => ({ name: row.values.name ?? "" }),
          importChunk: async (variables) =>
            normalizeChunk(
              (await importChapters({ variables: { input: { rows: variables } } })).data?.importChapters,
            ),
        });
    }
  }

  return { run };
}
