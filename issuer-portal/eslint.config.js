import rootConfig from '../eslint.config.mjs'

export default [
  ...rootConfig,
  {
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/only-throw-error': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // References to test fixtures mistakenly trigger this rule
    },
  },
]
