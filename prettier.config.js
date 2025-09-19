const config = {
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  endOfLine: 'lf',
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  printWidth: 90,
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^@mui/(.*)$',
    '^@mediant/(.*)$',
    '^@/components/(.*)$',
    '^@/data-filtering/(.*)$',
    '^@/domain-models/(.*)$',
    '^@/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}

export default config
