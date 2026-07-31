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
