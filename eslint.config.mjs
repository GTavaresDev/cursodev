import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";
import jest from "eslint-plugin-jest";

const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "node_modules/**",
      "out/**",
      "build/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["tests/**/*.js", "**/*.test.js"],
    ...jest.configs["flat/recommended"],
  },
];

export default config;
