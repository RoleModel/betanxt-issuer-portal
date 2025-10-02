declare module '@eslint/eslintrc' {
  export class FlatCompat {
    constructor(options?: { baseDirectory?: string })
    config(...args: unknown[]): unknown[]
  }
}
