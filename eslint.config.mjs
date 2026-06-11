import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import jest from "eslint-plugin-jest";

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
  ...nextCoreWebVitals,
  {
    files: ["tests/**/*.js", "**/*.test.js"],
    ...jest.configs["flat/recommended"],
  },
];

export default config;
