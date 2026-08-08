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

// Relax filename + key-order rules where the preset already configures them, so
// the override lives in the same config object that loads the plugin (flat
// config requires that). Allows camelCase hooks, PascalCase components, and
// kebab-case utilities, and drops the counterproductive alphabetical key order.
const relaxConventionRules = (config) => {
  if (!config.rules) {
    return config;
  }

  const rules = { ...config.rules };
  let isChanged = false;

  if ("unicorn/filename-case" in rules) {
    rules["unicorn/filename-case"] = [
      "warn",
      { cases: { camelCase: true, kebabCase: true, pascalCase: true } },
    ];
    isChanged = true;
  }

  if ("github/filenames-match-regex" in rules) {
    rules["github/filenames-match-regex"] = [
      "warn",
      "^[a-zA-Z0-9]+([-.][a-zA-Z0-9]+)*$",
    ];
    isChanged = true;
  }

  // The preset allows only camelCase/PascalCase/snake_case for every
  // identifier. Two of its consequences are pure churn here: module-level
  // constants are written SCREAMING_SNAKE throughout the codebase, and unused
  // callback parameters are prefixed with an underscore because that is what
  // `no-unused-vars` looks for. Quoted properties are exempted outright — a
  // key like "/accounts/{accountId}" cannot follow an identifier convention.
  if ("@typescript-eslint/naming-convention" in rules) {
    rules["@typescript-eslint/naming-convention"] = [
      "warn",
      {
        format: ["camelCase", "PascalCase", "snake_case", "UPPER_CASE"],
        leadingUnderscore: "allow",
        selector: "default",
      },
      {
        format: null,
        modifiers: ["requiresQuotes"],
        selector: [
          "classProperty",
          "enumMember",
          "objectLiteralProperty",
          "typeProperty",
        ],
      },
    ];
    isChanged = true;
  }

  if ("sort-keys" in rules) {
    rules["sort-keys"] = "off";
    isChanged = true;
  }

  // Relax `strict-boolean-expressions` to allow nullable strings/booleans/objects
  // in conditionals (e.g. `if (someString)`), which is idiomatic and not a source
  // of bugs here. It still flags the genuinely risky cases like a bare `any` or a
  // number used as a condition.
  if ("@typescript-eslint/strict-boolean-expressions" in rules) {
    rules["@typescript-eslint/strict-boolean-expressions"] = [
      "warn",
      {
        allowNullableBoolean: true,
        allowNullableObject: true,
        allowNullableString: true,
        allowNumber: false,
        allowString: true,
      },
    ];
    isChanged = true;
  }

  return isChanged ? { ...config, rules } : config;
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
      "**/domain-models/api/generated.ts",
      "**/source-manifest.generated.ts",
    ],
  },
  {
    // eslint-plugin-compat falls back to browserslist's `defaults`, which still
    // includes Opera Mini — a browser with no `fetch`, no `Promise` and no
    // `URL`. Every compat warning in this codebase was that one browser, and
    // the portal does not support it. Set here rather than as a `browserslist`
    // key in package.json so the linter's target list does not also become
    // Next.js's compile target.
    settings: { browsers: ["defaults", "not op_mini all"] },
  },
  ...core.map(warningOnly).map(relaxConventionRules),
  relaxConventionRules(
    warningOnly({
      ...typescriptConfig,
      files: ["**/*.tsx"],
    })
  ),
  ...react.map(warningOnly).map(relaxConventionRules),
  ...configuredNext.map(warningOnly).map(relaxConventionRules),
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
      "typescript-eslint/no-misused-promises": "off",
    },
  },
  {
    // `sort-keys` is a core rule (no plugin), so it is safe to turn off here for
    // any file the preset transforms above did not already cover.
    rules: {
      "sort-keys": "off",
    },
  },
];
