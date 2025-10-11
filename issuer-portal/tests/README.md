# Playwright Tests

This directory contains end-to-end tests for the Issuer Portal application.

## Running Tests

### Prerequisites

1. Make sure both the issuer-portal and mock-api-server are running:

   ```bash
   npm run dev
   ```

2. Ensure the database is seeded with test data:
   ```bash
   npm run seed
   ```

### Running All Tests

```bash
npm run test
```

### Running Specific Tests

```bash
# Run only notification tests
npm run test notifications.spec.ts

# Run tests in headed mode (see browser)
npm run test --headed

# Run tests in UI mode (interactive)
npm run test --ui

# Run tests with specific browser
npm run test --project=chromium
npm run test --project=firefox
npm run test --project=webkit
```

### Debugging Tests

```bash
# Debug mode - opens Playwright Inspector
npm run test --debug

# Debug a specific test
npm run test notifications.spec.ts --debug
```

## Test Structure

### E2E Tests (`/e2e`)

- `notifications.spec.ts` - Tests for the notification system including:
  - Notification bell display and unread count
  - Opening/closing notification popover
  - Navigation when clicking different notification types
  - Marking notifications as read
  - Mark all as read functionality

### Helpers (`/helpers`)

- `auth.ts` - Authentication helper functions:
  - `loginAs(page, user)` - Log in as a specific test user
  - `logout(page)` - Log out the current user

## Writing New Tests

1. Create a new test file in the appropriate directory
2. Import necessary helpers and Playwright test utilities
3. Use `test.describe()` to group related tests
4. Use `test.beforeEach()` for common setup
5. Write individual tests with `test()`

Example:

```typescript
import { expect, test } from '@playwright/test'

import { loginAs } from '../helpers/auth'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'mike')
  })

  test('should do something', async ({ page }) => {
    // Your test code here
    await expect(page.locator('selector')).toBeVisible()
  })
})
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** before interacting: `await page.waitForSelector()`
3. **Use proper assertions** with `expect()`
4. **Keep tests independent** - each test should be able to run on its own
5. **Use descriptive test names** that explain what is being tested
6. **Clean up after tests** if they create data

## Common Selectors

- App Bar: `[data-testid="app-bar"]`
- Notification Bell: `svg[data-testid="NotificationsOutlinedIcon"]`
- Avatar/User Menu: `.MuiAvatar-root`
- Buttons: `page.getByRole('button', { name: 'Button Text' })`
- Links: `page.getByRole('link', { name: 'Link Text' })`
- Headings: `page.getByRole('heading', { name: 'Heading Text' })`

## Troubleshooting

### Tests are flaky

- Add explicit waits: `await page.waitForSelector()`
- Increase timeout: `{ timeout: 30000 }`
- Check for race conditions in the application

### Can't find elements

- Use Playwright Inspector: `npm run test --debug`
- Check if element is in shadow DOM or iframe
- Verify the element is visible and not covered

### Tests fail in CI but pass locally

- Check for environment differences
- Ensure test data is consistent
- Add screenshots on failure for debugging
