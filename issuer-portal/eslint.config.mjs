// Workspace-specific ESLint configuration for issuer-portal
// Inherits from root eslint.config.mjs

import rootConfig from '../eslint.config.mjs'

export default [
  ...rootConfig,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      // Issuer portal specific rule overrides
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
            properties: false,
          },
        },
      ],
      // Make these warnings instead of errors for existing codebase
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      // Disable nullish coalescing operator preference
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
]
