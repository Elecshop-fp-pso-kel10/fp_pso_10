module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    // Include both main and test tsconfigs so e2e files are parsed correctly
    project: ["tsconfig.json", "tsconfig.spec.json"],
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    ".eslintrc.js",
    "dist",
    "node_modules",
  ],
  rules: {
    // Allow variables/args/caught errors prefixed with _ to be unused
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ],
    // Allow @ts-ignore (used in image-generation.service.ts) —
    // swap to @ts-expect-error only where the line is always an error
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-ignore": "allow-with-description",
        "ts-expect-error": "allow-with-description"
      }
    ]
  },
};