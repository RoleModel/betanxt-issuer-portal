// Strict overlay ESLint flat config.
// Usage: `npm run lint:strict` (will fail on warnings elevated here)
// Strategy: Import base config, then append stricter rule overrides without
// mutating the original export.
import baseConfig from './eslint.config.mjs'

const strictRules = {
  rules: {
    // Re‑enable unused vars as errors (underscore opt-out remains)
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    // Treat remaining any as TODOs – escalate to error in strict mode
    '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: false }],
    // Disallow empty blocks except explicit catch with comment
    'no-empty': [
      'error',
      {
        allowEmptyCatch: false,
      },
    ],
  },
}

const strictConfig = [
  ...baseConfig,
  // Append strict block last so it wins on rule precedence
  strictRules,
]

export default strictConfig
