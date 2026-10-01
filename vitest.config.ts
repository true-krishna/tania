import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // Utilitas murni memakai node; komponen React memakai pragma env jsdom
    // (lihat src/test/setup.ts). Reuse runner yang sudah ada (plan.md §10).
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"],
  },
});