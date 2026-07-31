import core from "ultracite/eslint/core";
import next from "ultracite/eslint/next";
import react from "ultracite/eslint/react";

const typescriptConfig = core.find(
  (config) => config.plugins?.["@typescript-eslint"]
);
const configuredNext = next.map((config) => ({
  ...config,
  rules: config.rules?.["@next/next/no-html-link-for-pages"]
    ? {
        ...config.rules,
        "@next/next/no-html-link-for-pages": ["error", "issuer-portal/app"],
      }
    : config.rules,
}));

const asWarning = (setting) => {
  if (setting === "error" || setting === 2) {
    return "warn";
  }

  if (Array.isArray(setting) && (setting[0] === "error" || setting[0] === 2)) {
    return ["warn", ...setting.slice(1)];
  }

  return setting;
};

const warningOnly = (config) => {
  if (!config.rules) {
    return config;
  }

  return {
    ...config,
    rules: Object.fromEntries(
      Object.entries(config.rules).map(([rule, setting]) => [
        rule,
        asWarning(setting),
      ])
    ),
  };
};

export default [
  {
    ignores: [
      ".claude/**",
      ".cursor/**",
      ".github/hooks/**",
      ".vscode/**",
      "client-theming/**",
      "supabase/**",
      "base.js",
      "**/.next/**",
      "**/dist/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/coverage/**",
      "**/app/.well-known/**",
      "**/*.json",
      "**/*.tsbuildinfo",
      "**/types/api.ts",
      "**/utils/supabase/database.types.ts",
      "**/domain-models/generated-schema.ts",
    ],
  },
  ...core.map(warningOnly),
  warningOnly({
    ...typescriptConfig,
    files: ["**/*.tsx"],
  }),
  ...react.map(warningOnly),
  ...configuredNext.map(warningOnly),
  {
    files: ["**/eslint.config.{js,mjs}"],
    rules: {
      "import-x/no-rename-default": "off",
    },
  },
  {
    // These rules autofix to JS features that do not exist in our runtime
    // (Node 24 / current browsers), so applying them breaks working code.
    // `Iterator.concat` and `Iterator.zip` are still TC39 stage-2 proposals.
    rules: {
      "unicorn/prefer-iterator-concat": "off",
      "unicorn/prefer-iterator-helpers": "off",
      "unicorn/prefer-iterator-to-array": "off",
      "unicorn/prefer-iterator-to-array-at-end": "off",
    },
  },
];
