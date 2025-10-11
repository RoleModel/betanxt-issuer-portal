import baseConfig from '../eslint.config.mjs'

export default [
  ...baseConfig,
  // Issuer Portal specific overrides
  {
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/only-throw-error': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  // Test file overrides
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // References to test fixtures mistakenly trigger this rule
    },
  },
]
