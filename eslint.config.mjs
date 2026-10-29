import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noComments from "./eslint-local-rules/no-comments.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated GraphQL codegen output — never hand-edited (constitution:
    // generated clients), so it is excluded from lint (T031, zero warnings).
    "src/generated/**",
  ]),
  {
    rules: {
      "react/jsx-sort-props": ["error", { ignoreCase: true }],
      "@typescript-eslint/consistent-type-imports": "error",
      "react/jsx-no-useless-fragment": "error",
      "no-else-return": "error",
      "no-lonely-if": "error",
    },
  },
  {
    files: ["src/**/*.{tsx,jsx}", "design/**/*.{tsx,jsx}"],
    ignores: ["**/*.test.{tsx,jsx}", "src/generated/**"],
    plugins: {
      tania: {
        rules: {
          "no-comments": noComments,
        },
      },
    },
    rules: {
      "tania/no-comments": "error",
    },
  },
]);

export default eslintConfig;
