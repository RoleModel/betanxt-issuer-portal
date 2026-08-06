import baseConfig from "../eslint.config.mjs";

const typescriptEslint = baseConfig.find(
  (config) => config.plugins?.["@typescript-eslint"]
)?.plugins["@typescript-eslint"];

export default [
  ...baseConfig,
  // Ignore auto-generated files
  {
    ignores: ["types/api.ts"],
  },
  // Issuer Portal specific overrides
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      // Disable overly strict type checking rules for development velocity
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/only-throw-error": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      // Neither app enables the React Compiler (next.config.ts disables it
      // deliberately — it forces babel-loader under Turbopack and stalled
      // route compilation). This rule assumes the compiler is on and tells
      // you to delete useMemo/useCallback, which would reintroduce the
      // re-render cost manual memoization exists to avoid.
      "react-doctor/react-compiler-no-manual-memoization": "off",
      // Object literal keys frequently mirror backend enum values verbatim
      // (e.g. status maps keyed by AWAITING_DRAFT/APPROVED/...), so allow
      // UPPER_CASE there alongside the usual formats.
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "default",
          format: ["camelCase", "PascalCase", "snake_case", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "objectLiteralProperty",
          format: ["camelCase", "PascalCase", "snake_case", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: [
            "classProperty",
            "enumMember",
            "objectLiteralProperty",
            "typeProperty",
          ],
          format: null,
          modifiers: ["requiresQuotes"],
        },
      ],
    },
  },
  // Test file overrides
  {
    files: ["**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // References to test fixtures mistakenly trigger this rule
    },
  },
];
