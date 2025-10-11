import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/supabase/migrations/**',
      '**/supabase/functions/**',
      '**/*.config.{js,mjs,ts}',
      '**/next-env.d.ts',
      // Generated files
      '**/database.types.ts',
      '**/components.ts',
      '**/openapi-typescript-codegen/**',
      '**/generated-schema.ts',
      '**/api-schema-types.ts',
      '**/*.min.js',
      '**/*.worker.js',
      // Testing
      '**/playwright-report/**',
      '**/test-results/**',
      // Public assets
      '**/public/**/*.js',
      '**/public/**/*.min.js',
      // Config files that cause parsing errors
      'base.js',
      'nextJsConfig.js',
      'regenerate-schema.mjs',
      'scripts/fix-unused-vars.js',
      'specs/global.d.ts',
      // Misc
      '**/.DS_Store',
      '**/*.pem',
      '**/.env*.local',
      '**/.vercel/**',
      '**/*.tsbuildinfo',
      '**/out/**',
    ],
  },

  // TypeScript parser configuration
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...hooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // React configuration
      'react/prop-types': 'off', // TypeScript handles this
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Test files - more lenient rules
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
]
