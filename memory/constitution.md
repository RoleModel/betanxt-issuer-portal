### # [PROJECT_NAME] Issuer Portal

### [PRINCIPLE_1_NAME]

I. TypeScript-First Development

[PRINCIPLE_1_DESCRIPTION]

All new code must be written in TypeScript with strict mode enabled
Target ES2022 with modern module resolution
Type safety is enforced at build time - no any types without explicit justification
Shared type definitions live in appropriate packages for cross-app consumption

### [PRINCIPLE_2_NAME]

II. Component-Driven Architecture

[PRINCIPLE_2_DESCRIPTION]

UI components built with Material UI 7.x as the foundation
Theme and custom components extend MUI patterns and live in @rolemodel/betanxt-deesign-system package

### [PRINCIPLE_3_NAME]

III. Test-Driven Quality Assurance

[PRINCIPLE_3_DESCRIPTION]

E2E Tests: Playwright for full user journey testing
Different strategies per application: Each app's complexity determines testing approach
CI Integration: All tests run automatically on PR creation with parallel execution

### [PRINCIPLE_4_NAME]

IV. Automated Code Quality (NON-NEGOTIABLE)

[PRINCIPLE_4_DESCRIPTION]

Prettier: Enforced code formatting with import sorting
ESLint: Strict linting rules with TypeScript integration
Pre-commit validation: All code must pass formatting and linting checks
Import organization: Specific import order enforced via Prettier plugin

### [PRINCIPLE_5_NAME]

V. Core Technologies

[PRINCIPLE_5_DESCRIPTION]

Language: TypeScript 5.8.2
Runtime: Node.js 22.15.x
Framework: Next.js 15.4.5 with React 19.0.0
Package Manager: npm 10.9.2 with workspaces
Build Tool: Turbo 2.5.5

### [PRINCIPLE_6_NAME]

VI. UI & Design System

[PRINCIPLE_6_DESCRIPTION]

- Component Library: Material UI 7.3.1 with MUI X Pro components
- Styling: Emotion for CSS-in-JS
- Design System: @rolemodel/betanxt-design-system integration
- Icons: Material UI Icons
- Charts: MUI X charts
- theme.vars.palette.primary.main is REQUIRED for any custom components
- always use theme.spacing(2) or 2 for new components
- always use Grid container Grid size={{xs: 12, md: 8,}} for page layouts
- never set sx on <Typporaphy> without consulting with team.
- Use semantic HTML and accessibility props like aria-\* attributes. For example, add aria-expanded to Accordion or aria-labelledby for dialog elements.
- While the sx prop is powerful, excessive inline styles can clutter code and reduce readability.
- Use the makeStyles or styled API for reusable and organized styling.

### [PRINCIPLE_7_NAME]

VII. Development Tools

[PRINCIPLE_7_DESCRIPTION]

Linting: ESLint 9.32.0 with TypeScript support
Formatting: Prettier 3.6.2 with import sorting
Testing: Cypress 14.2.0 (component) + Playwright (e2e)
Dependency Sync: Syncpack for version management across workspace

### [PRINCIPLE_8_NAME]

VIII. Project Structure

[PRINCIPLE_8_DESCRIPTION]

issuer-portal/
├── apps/
----├── mock-api-server/
--------├──app
--------├──domain-models
--------├──schemas
--------├──supabase
--------├──utils  
----├── issuer-portal/  
--------├──app
--------├───authentication
--------├──authorization
--------├──components
--------├──cypress
--------├──data-filtering
--------├──domain-models
--------├──node_modules
--------├──playwright
--------├──playwright-report
--------├──public
--------├──test-results
--------├──tests
--------├──utils

### [PRINCIPLE_9_NAME]

IX. Version Control Standards

[PRINCIPLE_9_DESCRIPTION]

Branching: Feature branches from master
Protection: Master branch requires PR approval and passing CI
Commit Messages: Descriptive commits encouraged
PR Template: Structured template requiring "Why?" and "What Changed" sections

### [PRINCIPLE_10_NAME]

X. Code Review Process

[PRINCIPLE_10_DESCRIPTION]

All code changes require pull request review
Automated labeling based on affected packages (MIC-Ops, CCS, MWM)
CI must pass before merge (linting, testing, Docker builds)
PR template enforces documentation of changes and rationale

### [PRINCIPLE_11_NAME]

XI. Continuous Integration Pipeline

[PRINCIPLE_11_DESCRIPTION]

Platform: GitHub Actions with Blacksmith runners
Stages:
Setup & Linting (Prettier, ESLint, package tests)
Docker build testing for affected apps
Application-specific test suites (component + e2e)
Automated PR labeling based on changed packages
Concurrency: Uses turbo's affected change detection for efficiency
Caching: Aggressive caching of dependencies and build artifacts

### [PRINCIPLE_12_NAME]

XII. Component Testing (Cypress)

[PRINCIPLE_12_DESCRIPTION]

Location: Co-located with components
Scope: Individual component behavior and props
Execution: npm run test:unit
Coverage: All UI components /components

### [PRINCIPLE_13_NAME]

XIII. End-to-End Testing (Playwright)

[PRINCIPLE_13_DESCRIPTION]

Framework: Playwright with Chromium browser
Environment: Dedicated test builds with NODE_ENV=test
Database: TBD
Execution: npm run test:e2e
Parallel: Matrix strategy for different test projects

### [PRINCIPLE_15_NAME]

XV. Configuration Management

[PRINCIPLE_15_DESCRIPTION]

Local: .env.local.development files (gitignored)
CI: GitHub Actions secrets
Production: Environment-specific deployment configs

### [PRINCIPLE_16_NAME]

XVI. TypeScript Configuration

[PRINCIPLE_16_DESCRIPTION]

{
"compilerOptions": {
"target": "es2022",
"strict": true,
"noEmit": true,
"jsx": "preserve",
"moduleResolution": "node"
}
}

### [PRINCIPLE_17_NAME]

XVII. Prettier Configuration

[PRINCIPLE_17_DESCRIPTION]

Line Length: 90 characters
Semicolons: Disabled
Quotes: Single quotes
Trailing Commas: ES5 style
Import Sorting: Enforced with specific order

### [PRINCIPLE_18_NAME]

XVIII. ESLint Rules

[PRINCIPLE_18_DESCRIPTION]

Base: @eslint/js recommended
TypeScript: typescript-eslint strict preset
React: eslint-plugin-react with hooks rules
Next.js: eslint-config-next
Testing: no-only-tests plugin

### [PRINCIPLE_19_NAME]

XIX. Authentication Provider

[PRINCIPLE_19_DESCRIPTION]

Service: Auth0 with Next.js integration
Bypass: Test mode available via environment variable
Session Management: @auth0/nextjs-auth0 library

### [PRINCIPLE_20_NAME]

XX. Authorization Pattern

[PRINCIPLE_20_DESCRIPTION]

JWT: Token-based with decode utilities
Route Protection: Next.js middleware for protected routes
API Security: Bearer token validation

### [PRINCIPLE_21_NAME]

XXI. State Management

[PRINCIPLE_21_DESCRIPTION]

Server State: SWR for data fetching and caching
Form State: React Hook Form with Zod validation
Client State: React state for UI interactions

### [PRINCIPLE_22_NAME]

XXII. API Integration

[PRINCIPLE_22_DESCRIPTION]

Type Safety: OpenAPI 3 schemas with TypeScript generation
Mock Servers: Prism-based mocking for development
Proxy Configuration: http-proxy-middleware for API routing

### [PRINCIPLE_23_NAME]

XXIII. Performance Standards

[PRINCIPLE_23_DESCRIPTION]

Bundle Optimization
Next.js: Automatic code splitting and tree shaking
Dynamic Imports: Lazy loading for large components
Asset Optimization: Automatic image and static asset optimization
Runtime Performance
React 19: Concurrent features and optimizations
MUI: Tree shaking and selective imports
MUI X Charts: Optimized data visualization rendering

### [PRINCIPLE_24_NAME]

XXIV. Error Boundaries

[PRINCIPLE_24_DESCRIPTION]

React: Error boundaries for component failure isolation
Next.js: Custom error pages for graceful degradation
API: Structured error responses with proper HTTP codes

### [PRINCIPLE_25_NAME]

XXV. Development Debugging

[PRINCIPLE_25_DESCRIPTION]

React DevTools: Component inspection
SWR DevTools: Network request monitoring
Hook Form DevTools: Form state debugging

### [PRINCIPLE_26_NAME]

XXVI. Accessibility Implementation

[PRINCIPLE_26_DESCRIPTION]

MUI Integration: Material UI's built-in accessibility features
Testing: axe-linter integration for automated accessibility testing
Playwrite: Playwrite axe plugin

### [PRINCIPLE_27_NAME]

XXVII. Browser Support

[PRINCIPLE_27_DESCRIPTION]

Target: "Last 2" versions of Chrome, Firefox, Edge, Safari
Progressive Enhancement: Graceful degradation for older browsers

### [PRINCIPLE_28_NAME]

XXVIII. Package Management

[PRINCIPLE_28_DESCRIPTION]

Syncpack: Automated version synchronization across workspace
Dependency Updates: Regular updates with compatibility testing
License Management: UNLICENSED private packages

### [PRINCIPLE_29_NAME]

XXIX. Breaking Changes

[PRINCIPLE_29_DESCRIPTION]

Versioning: Semantic versioning for internal packages
Migration: Coordinated updates across dependent packages
Communication: Clear documentation of breaking changes

### [PRINCIPLE_30_NAME]

XXX. Decision Making

[PRINCIPLE_30_DESCRIPTION]

Architecture: Team consensus on major architectural decisions
Tooling: Evidence-based evaluation of new tools
Performance: Measurable impact requirements for optimizations

### [PRINCIPLE_31_NAME]

XXXI. Dependency Updates

[PRINCIPLE_31_DESCRIPTION]

Frequency: Regular updates via syncpack
Testing: Full CI pipeline validation for updates
Security: Prompt security patch application

### [PRINCIPLE_32_NAME]

XXXII. Code Health

[PRINCIPLE_32_DESCRIPTION]

Refactoring: Continuous improvement following Boy Scout Rule
Technical Debt: Regular evaluation and prioritization
Documentation: Living documentation updated with changes

Version: 1.0.0 | Ratified: 2025-01-10 | Last Amended: 2025-01-10

This constitution reflects the actual practices implemented in the Issuer Portal codebase as of January 2025. All future development must adhere to these principles, with amendments requiring team consensus and documentation updates.
