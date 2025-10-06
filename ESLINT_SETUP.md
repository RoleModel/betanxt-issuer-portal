# ESLint Configuration

## Overview

This project uses **ESLint 9** with the modern **flat config** format (`eslint.config.mjs`) for Next.js 15, React 19, and TypeScript 5.9.

## Configuration Structure

```
betanxt-issuer-portal/
├── eslint.config.mjs           # Root shared config
├── issuer-portal/
│   └── eslint.config.mjs       # Workspace-specific overrides
└── mock-api-server/
    └── eslint.config.js        # Workspace-specific overrides
```

## Dependencies

**Root workspace** (`package.json`):
- `eslint@^9.17.0` - ESLint 9 with flat config support
- `@eslint/js@^9.17.0` - Base JavaScript rules
- `typescript-eslint@^8.21.0` - TypeScript ESLint integration
- `@typescript-eslint/parser@^8.21.0` - TypeScript parser
- `@typescript-eslint/eslint-plugin@^8.21.0` - TypeScript rules
- `@next/eslint-plugin-next@^15.5.4` - Next.js specific rules
- `eslint-plugin-react@^7.37.3` - React rules
- `eslint-plugin-react-hooks@^5.1.0` - React Hooks rules

## Running ESLint

### From root (all workspaces):
```bash
npm run lint
```

### From specific workspace:
```bash
npm run lint --workspace=issuer-portal
npm run lint --workspace=mock-api-server
```

### Auto-fix issues:
```bash
npm run lint -- --fix
npm run lint --workspace=issuer-portal
```

## Key Rules Enabled

### TypeScript Safety
- `@typescript-eslint/no-unsafe-assignment` - Prevents unsafe `any` assignments
- `@typescript-eslint/no-floating-promises` - Requires promises to be awaited
- `@typescript-eslint/prefer-nullish-coalescing` - Use `??` over `||`
- `@typescript-eslint/consistent-type-imports` - Enforces `type` keyword for imports

### React
- `react-hooks/rules-of-hooks` - Enforces Hooks rules
- `react-hooks/exhaustive-deps` - Validates Hook dependencies

### Next.js
- All `@next/next/recommended` and `core-web-vitals` rules

## Ignored Patterns

The following are automatically ignored:
- `**/node_modules/**`
- `**/.next/**`
- `**/dist/**`
- `**/.turbo/**`
- `**/supabase/migrations/**`
- `**/*.config.{js,mjs,ts}`
- `**/next-env.d.ts`

## Migration from Old Setup

This setup replaces:
- ❌ `.eslintrc.json` (deprecated)
- ❌ `.eslintignore` (deprecated)
- ✅ Modern flat config `eslint.config.mjs`
- ✅ ESLint 9 with TypeScript 8

## Workspace-Specific Overrides

### issuer-portal
- More lenient `checksVoidReturn` for event handlers

### mock-api-server
- Warnings for `prefer-nullish-coalescing`
- Disabled `no-unused-expressions`
- Test files have relaxed rules

## Next Steps

1. **Fix type safety issues**: Address `@typescript-eslint/no-unsafe-*` errors
2. **Replace `||` with `??`**: Use nullish coalescing for safer defaults
3. **Await promises**: Fix floating promise warnings
4. **Remove unused imports**: Clean up unused variables

## Resources

- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [typescript-eslint](https://typescript-eslint.io/)
- [Next.js ESLint](https://nextjs.org/docs/app/api-reference/config/eslint)
