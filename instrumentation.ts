/**
 * Turbopack resolves this monorepo from the workspace root. The mock API
 * server does not need runtime instrumentation, but Next.js still loads this
 * conventional entry point during development.
 */
export const register = (): void => {};
