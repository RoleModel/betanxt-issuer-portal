import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

// Root flat config array export required by ESLint 9+ (Next.js expects an array)
const eslintConfig = [
  // Next.js configuration - explicitly configure for App Router
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
    settings: {
      next: {
        rootDir: './issuer-portal'
      }
    }
  }, {
    baseDirectory: __dirname + '/issuer-portal'
  }),
  {
    ignores: [
      'node_modules/**',
      '**/.next/**',
      '.vercel/**',
      '**/out/**',
      '**/build/**',
      '**/next-env.d.ts',
      '**/coverage/**',
      '**/dist/**',
      '**/generated-schema.ts',
      '**/database.types.ts',
      '**/api-schema-types.ts',
      '**/public/**/*.min.js',
      '**/public/**/*.worker.js',
      '**/playwright-report/**',
      '**/test-results/**',
      'prettier.config.js',
      'specs/global.d.ts',
      '**/eslint.config.js',
      'issuer-portal/next.config.js',
      'supabase/*.ts',
      'supabase/*.js',
      'scripts/**/*.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        project: [
          './tsconfig.json',
          './issuer-portal/tsconfig.json',
          './mock-api-server/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // TEMPORARY: Disable due to crash in @typescript-eslint/no-unused-expressions
      // TypeError: Cannot read properties of undefined (reading 'allowShortCircuit')
      // Likely version mismatch between core eslint rule and wrapper. Re-enable after deps alignment.
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      // Disable rules with ESLint 9 compatibility issues
      '@next/next/no-duplicate-head': 'off',
      '@next/next/no-page-custom-font': 'off',
      // Configure no-html-link-for-pages for App Router (App Router doesn't need this rule)
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]

export default eslintConfig
