"use client";

import { useMutation } from "@apollo/client";
import {
  BulkSetChapterActiveDocument,
  BulkSetJobRoleActiveDocument,
  BulkSetJobRoleChapterDocument,
  BulkSetProjectActiveDocument,
  BulkSetProjectUnitDocument,
  BulkSetUnitActiveDocument,
  ChaptersDocument,
  JobRolesDocument,
  ProjectsDocument,
  UnitsDocument,
} from "@/generated/graphql";
import type { MasterDataImportEntity } from "./masterDataImportTemplate";
import { refetch } from "./useMasterDataMutations";
import {
  importRowsInChunks,
  normalizeChunk,
  type MergedImportReport,
  type WireChunkResult,
} from "./useMasterDataImport";

export type MasterDataBulkAction =
  | { kind: "set-active"; isActive: boolean }
  | { kind: "change-select"; value: string };

export type MasterDataBulkSelectionRow = { id: string; label: string };

export type MasterDataBulkRunner = (
  entity: MasterDataImportEntity,
  action: MasterDataBulkAction,
  rows: readonly MasterDataBulkSelectionRow[],
  onProgress?: (chunkIndex: number, chunkTotal: number) => void,
) => Promise<MergedImportReport>;

/**
 * Aksi massal master data (TAN-351) — enam mutasi perubahan sama &
 * nonaktif/aktif massal TAN-349. Seleksi yang melebihi batas 100 id per
 * operasi (FR-06) dipecah menjadi potongan berurutan dengan pola yang sama
 * seperti impor massal TAN-350 ("Opsi A", thread TAN-348), lalu hasilnya
 * digabung menjadi satu laporan per baris; bila sebuah potongan gagal utuh,
 * sisa baris dilaporkan belum dieksekusi.
 */
export function useMasterDataBulkActions(): { run: MasterDataBulkRunner } {
  const [bulkSetUnitActive] = useMutation(BulkSetUnitActiveDocument, {
    refetchQueries: refetch(UnitsDocument),
  });
  const [bulkSetProjectActive] = useMutation(BulkSetProjectActiveDocument, {
    refetchQueries: refetch(ProjectsDocument),
  });
  const [bulkSetJobRoleActive] = useMutation(BulkSetJobRoleActiveDocument, {
    refetchQueries: refetch(JobRolesDocument),
  });
  const [bulkSetChapterActive] = useMutation(BulkSetChapterActiveDocument, {
    refetchQueries: refetch(ChaptersDocument),
  });
  const [bulkSetJobRoleChapter] = useMutation(BulkSetJobRoleChapterDocument, {
    refetchQueries: refetch(JobRolesDocument),
  });
  const [bulkSetProjectUnit] = useMutation(BulkSetProjectUnitDocument, {
    refetchQueries: refetch(ProjectsDocument),
  });

  async function run(
    entity: MasterDataImportEntity,
    action: MasterDataBulkAction,
    rows: readonly MasterDataBulkSelectionRow[],
    onProgress?: (chunkIndex: number, chunkTotal: number) => void,
  ): Promise<MergedImportReport> {
    const shared = {
      rows: rows.map((row, position) => ({ ...row, rowNumber: position + 1 })),
      describeRow: (row: MasterDataBulkSelectionRow) => row.label,
      onProgress,
      fallbackMessage: "Gagal menjalankan aksi massal.",
    };
    const runChunked = (mutate: (ids: string[]) => Promise<WireChunkResult>) =>
      importRowsInChunks({
        ...shared,
        toVariables: (row: MasterDataBulkSelectionRow) => row.id,
        importChunk: async (ids) => normalizeChunk(await mutate(ids)),
      });

    if (action.kind === "set-active") {
      const { isActive } = action;
      switch (entity) {
        case "unit":
          return runChunked(async (ids) => {
            const { data } = await bulkSetUnitActive({ variables: { ids, isActive } });
            return data?.bulkSetUnitActive;
          });
        case "project":
          return runChunked(async (ids) => {
            const { data } = await bulkSetProjectActive({ variables: { ids, isActive } });
            return data?.bulkSetProjectActive;
          });
        case "jobRole":
          return runChunked(async (ids) => {
            const { data } = await bulkSetJobRoleActive({ variables: { ids, isActive } });
            return data?.bulkSetJobRoleActive;
          });
        case "chapter":
          return runChunked(async (ids) => {
            const { data } = await bulkSetChapterActive({ variables: { ids, isActive } });
            return data?.bulkSetChapterActive;
          });
      }
    }

    switch (entity) {
      case "project":
        return runChunked(async (ids) => {
          const { data } = await bulkSetProjectUnit({
            variables: { ids, unitId: action.value },
          });
          return data?.bulkSetProjectUnit;
        });
      case "jobRole":
        return runChunked(async (ids) => {
          const { data } = await bulkSetJobRoleChapter({
            variables: { ids, chapterId: action.value || null },
          });
          return data?.bulkSetJobRoleChapter;
        });
      default:
        throw new Error(`Perubahan sama tidak tersedia untuk ${entity}.`);
    }
  }

  return { run };
}
