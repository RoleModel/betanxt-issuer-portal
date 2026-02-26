import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
// @ts-expect-error The eslint-plugin-no-only-tests package doesn't have types
import noOnlyTests from 'eslint-plugin-no-only-tests'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    ignores: [
      'dist/**/*',
      'test-results',
      'playwright-report',
      'playwright',
      '**/generated-schema.ts',
      '**/api-schema-types.ts',
      '**/database.types.ts',
      '.next',
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'no-only-tests': noOnlyTests,
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-base-to-string': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'off', // TODO: Re-enable this rule and consistently use 'interface' instead of 'type' everywhere
      'no-only-tests/no-only-tests': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': [
        'warn',
        {
          ignoreMixedLogicalExpressions: true,
        },
      ],
    },
  },
]
