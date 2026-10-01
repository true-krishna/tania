import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Code Generator config — sumber tunggal SDL adalah kontrak:
 * `contracts/schema.graphql` (schema-first, lihat contracts/api-conventions.md).
 *
 * Keluaran di `src/generated/graphql/` TIDAK diedit manual — regenerate lewat
 * `npm run codegen` (gate CI: `generate check`, plan.md §10.3).
 *
 * - `types.ts` — seluruh tipe skema (typescript plugin), dipakai FE sejak W0
 *   untuk meng-typify data sebelum operasi dibuat.
 * - preset `client` — `gql()` + fragment masking + (saat operasi ada) hooks;
 *   dokumen operasi diambil dari folder `src/features` (berkas `.graphql`).
 */
const config: CodegenConfig = {
  schema: "specs/001-employee-digital-talent-management/contracts/schema.graphql",
  documents: [
    "src/features/**/*.graphql",
  ],
  ignoreNoDocuments: true,
  generates: {
    "src/generated/graphql/types.ts": {
      plugins: ["typescript"],
      config: {
        scalars: {
          UUID: "string",
          DateTime: "string",
          Date: "string",
        },
        enumsAsTypes: true,
        maybeValue: "T | null | undefined",
      },
    },
    "src/generated/graphql/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: "getFragmentData" },
        // index.ts ditulis manual (barrel lengkap), jangan ditimpa preset.
        skipIndexFile: true,
      },
      config: {
        scalars: {
          UUID: "string",
          DateTime: "string",
          Date: "string",
        },
      },
    },
  },
};

export default config;