// Workspace-specific ESLint overrides for mock-api-server
// Inherits from root eslint.config.mjs
import baseConfig from '../eslint.config.mjs'

export default [
  ...baseConfig,
  // Mock API Server specific overrides
  {
    rules: {
      // Disable overly strict type checking rules for development velocity
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/only-throw-error': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/dot-notation': 'off', // Disable problematic extension rule
      '@typescript-eslint/no-empty-function': 'off', // Disable problematic extension rule
      '@next/next/no-html-link-for-pages': ['error', 'mock-api-server/app'],
    },
  },
  // Test file overrides
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
