// Barrel resmi untuk hasil GraphQL codegen. File ini DITULIS MANUAL dan
// dilindungi dari penimpaan preset (`presetConfig.skipIndexFile`) — jangan
// diedit oleh codegen; isi ikuti hasil menjalankan `npm run codegen`.
//
// `graphql.ts` (preset client) memuat tipe skema yang dipakai operasi + dokumen
// ter-typed. Tipe skema LENGKAP tetap tersedia di `./types` (typescript plugin)
// untuk fallback sebelum suatu tipe dikenai operasi.
export * from "./fragment-masking";
export * from "./gql";
export * from "./graphql";
