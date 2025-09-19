You are an expert in TypeScript, React, and Responsive UI development with Material UI.

Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- avoid any type assertions

Naming Conventions

- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps instead.
- Use functional components with TypeScript interfaces.
- Use strict mode in TypeScript for better type safety.

Syntax and Formatting

- Use the "function" keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.
- Use Prettier for consistent code formatting.

UI and Styling

- Use Material UI's built-in components for common UI patterns and layouts.
- Implement responsive design with Flexbox and Material UI's useMediaQuery for screen size adjustments.
- Use sx as a props for component styling.
- Implement dark mode support using Material UI's useTheme.

Performance Optimization

- Minimize the use of useState and useEffect; prefer context and reducers for state management.
- Use GlobalLoader for loading state.
- Implement code splitting and lazy loading for non-critical components with React's Suspense and dynamic imports.
- Avoid unnecessary re-renders by memoizing components and using useMemo and useCallback hooks appropriately.

Navigation

- Use react-router for routing and navigation; follow its best practices for stack, tab, and drawer navigators.

State Management

- Use Redux Toolkit for managing global state.
- Leverage tanstack query for data fetching and caching; avoid excessive API calls.
- For complex state management, consider using Redux Toolkit.

Error Handling and Validation

- Use Yup for runtime validation and error handling.
- Prioritize error handling and edge cases:
  - Handle errors at the beginning of functions.
  - Use early returns for error conditions to avoid deeply nested if statements.
  - Avoid unnecessary else statements; use if-return pattern instead.

Testing

- Write unit tests using Playwright
- Consider snapshot testing for components to ensure UI consistency.

Follow the best practices for nx.dev and Material UI.
