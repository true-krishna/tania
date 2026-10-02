import type { CodegenConfig } from "@graphql-codegen/cli";

/**
 * GraphQL Code Generator — sumber SDL adalah skema yang **dilayani** backend:
 * `tania-backend/graph/schema.graphqls` (constitution 1.1.1: codegen menargetkan
 * SDL yang dilayani, bukan kontrak desain).
 *
 * Keluaran di `src/generated/graphql/` TIDAK diedit manual — regenerate lewat
 * `npm run codegen` (gate CI: `generate check`, plan.md §10.3).
 *
 * - `types.ts` — seluruh tipe skema (typescript plugin), dipakai FE sejak W0
 *   untuk meng-typify data sebelum operasi dibuat.
 * - preset `client` — `gql()` + fragment masking + (saat operasi ada) hooks;
 *   dokumen operasi diambil dari folder `src/features` (berkas `.graphql`).
 *
 * Scalars mengikuti SDL yang dilayani (`Time`/`Date`/`JSON`, identitas `ID`).
 * `contracts/schema.graphql` adalah kontrak desain (target) yang konvergen ke
 * SDL ini dan bukan sumber generate.
 */
const config: CodegenConfig = {
  schema: "../tania-backend/graph/schema.graphqls",
  documents: [
    "src/features/**/*.graphql",
  ],
  ignoreNoDocuments: true,
  generates: {
    "src/generated/graphql/types.ts": {
      plugins: ["typescript"],
      config: {
        scalars: {
          Time: "string",
          Date: "string",
          JSON: "unknown",
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
          Time: "string",
          Date: "string",
          JSON: "unknown",
        },
      },
    },
  },
};

export default config;