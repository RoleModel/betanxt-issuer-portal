// Workspace-specific ESLint overrides for mock-api-server
// Inherits from root eslint.config.mjs

import { baseConfig } from '../eslint.config.mjs'

export default [
  ...baseConfig,
  // Mock API Server specific overrides
  {
    rules: {
      '@typescript-eslint/only-throw-error': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@next/next/no-html-link-for-pages': ['error', 'mock-api-server/app'],
    },
  },
  // Test file overrides (more strict than base config)
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]
