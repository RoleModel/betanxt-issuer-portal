# Test Setup Instructions

## Prerequisites

Before running the notification tests, ensure you have:

1. **Both servers running:**

   ```bash
   # From the root directory
   npm run dev
   ```

2. **Database seeded with test data:**

   ```bash
   # From the root directory
   npm run seed
   ```

3. **Environment variables configured:** Create `.env.local` in both `issuer-portal` and `mock-api-server` directories with:
   ```
   NEXT_PUBLIC_BYPASS_AUTH=true
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
   ```

## Running the Notification Tests

### Quick Test (Single Browser)

```bash
cd issuer-portal
npx playwright test notifications.spec.ts --project=chromium
```

### Full Test Suite

```bash
cd issuer-portal
npm run test
```

### Debug Mode (See Browser)

```bash
cd issuer-portal
npx playwright test notifications.spec.ts --project=chromium --headed --debug
```

### Generate Test Report

```bash
cd issuer-portal
npx playwright show-report
```

## Troubleshooting

### Tests fail with "Cannot find login button"

- Ensure the auth bypass is enabled in your environment
- Check that both servers are running on the correct ports

### Tests timeout

- Increase timeout in playwright.config.ts
- Check that the database is properly seeded
- Verify the mock API server is responding

### No notifications appear

- Run `npm run seed` to ensure test data exists
- Check the mock API server logs for errors
- Verify the notification API endpoints are working

## Test Data

The seed data creates notifications for test users:

- Mike Chen (Wendy's) - Has "Your Event Has Been Created" notifications
- Lisa Rodriguez (Paycom) - Has various notification types
- David Kim (Woodward) - Has meeting-related notifications
- Jenny Patel (Enliven) - Has document-related notifications

## Debugging Tips

1. **Take screenshots on failure:** Add to your test:

   ```typescript
   await page.screenshot({ path: "test-failure.png" });
   ```

2. **Check console logs:**

   ```typescript
   page.on("console", (msg) => console.log("Browser log:", msg.text()));
   ```

3. **Slow down tests:**

   ```typescript
   await page.waitForTimeout(1000); // Add pauses to see what's happening
   ```

4. **Use Playwright Inspector:**
   ```bash
   PWDEBUG=1 npx playwright test notifications.spec.ts
   ```
