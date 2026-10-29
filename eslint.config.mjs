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
      "no-nested-ternary": "error",
      "react/no-multi-comp": "error",
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "react/no-multi-comp": "off",
      "max-lines": "off",
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
