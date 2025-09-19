# Quickstart Guide: New Project Setup

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- Supabase account and project set up
- Git installed

## Initial Setup

### 1. Clone and Initialize Project

```bash
# Clone the repository
git clone <repository-url> issuer-portal
cd issuer-portal

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local.development
```

### 2. Supabase Project Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and API keys from the project settings
   - Copy the database URL from the database settings

2. **Configure Database Access**:
   - Use Supabase MCP to adjust database according to `data-model.md`
   - Note the connection pooling settings for production use

### 3. Environment Configuration

Edit `.env.local.development` with configuration:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application
NODE_ENV="development"
PORT=3000

# Email (optional for development)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@issuerportal.com"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push database schema to Supabase
npx prisma db push

# Seed the database with initial data
npx prisma db seed
```

### 5. Start Development Server

```bash
# Start the development server
npm run dev

# Server will be available at http://localhost:3000
```

## Verification Tests

### 1. Application Startup Test

**Objective**: Verify the application starts successfully

**Steps**:

1. Navigate to `http://localhost:3000`
2. Verify the home page loads without errors
3. Check browser console for any JavaScript errors
4. Verify the BetaNXT design system styles are applied

**Expected Result**: Clean home page with proper styling and no console errors

### 2. Authentication Flow Test

**Objective**: Verify user authentication works correctly

**Steps**:

1. Navigate to `/auth/login`
2. Attempt login with invalid credentials
3. Verify error message displays
4. Login with seeded admin credentials:
   - Email: `admin@issuerportal.com`
   - Password: `AdminPass123`
5. Verify redirect to dashboard
6. Check user profile in navigation
7. Logout and verify redirect to home page

**Expected Result**: Complete authentication flow works with proper error handling

### 3. Role-Based Access Test

**Objective**: Verify role-based permissions work correctly

**Steps**:

1. Login as admin user
2. Navigate to `/admin/users` - should be accessible
3. Navigate to `/admin/roles` - should be accessible
4. Logout and login as regular user:
   - Email: `user@issuerportal.com`
   - Password: `UserPass123`
5. Attempt to navigate to `/admin/users` - should be forbidden
6. Verify access to `/events` - should be accessible

**Expected Result**: Admin routes protected, appropriate access based on role

### 4. Event Management Test

**Objective**: Verify basic event management functionality

**Steps**:

1. Login as event manager:
   - Email: `manager@issuerportal.com`
   - Password: `ManagerPass123`
2. Navigate to `/events`
3. Click "Create Event" button
4. Fill out event form:
   - Title: "Test Event"
   - Description: "Test event description"
   - Start Date: Tomorrow at 10:00 AM
   - End Date: Tomorrow at 12:00 PM
   - Location: "Conference Room A"
5. Submit form
6. Verify event appears in events list
7. Click on event to view details
8. Edit event and change title to "Updated Test Event"
9. Verify changes are saved

**Expected Result**: Complete CRUD operations work for events

**Expected Result**: Event registration and cancellation work correctly

### 6. Design System Integration Test

**Objective**: Verify BetaNXT design system components work correctly

**Steps**:

1. Navigate through different pages
2. Verify consistent styling across components:
   - Buttons use design system variants
   - Forms use design system inputs
   - Navigation uses design system components
   - Colors match design system palette
3. Test responsive design on different screen sizes
4. Verify dark/light mode toggle (if implemented)

**Expected Result**: Consistent design system implementation across the application

### 7. API Contract Test

**Objective**: Verify API endpoints match OpenAPI specification

**Steps**:

1. Run Playwright tests that intercept network requests:
   ```bash
   npm run test:e2e -- --grep "API Contract"
   ```
2. Verify API requests match OpenAPI spec:
   - Correct HTTP methods and endpoints
   - Proper request/response formats
   - Appropriate status codes
   - Required headers present
3. Test error scenarios with Playwright:
   - Invalid data submission forms
   - Unauthorized access attempts
   - Non-existent resource requests
4. Review test results and network logs

**Expected Result**: All API calls conform to OpenAPI specification and Playwright tests pass

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Run tests before pushing
npm run test:e2e

# Push and create PR
git push origin feature/new-feature-name
```

### 2. Testing Commands

```bash
# Run E2E tests with Playwright
npm run test:e2e

# Run E2E tests in headed mode (with browser UI)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# Generate Playwright test report
npm run test:e2e:report
```

### 3. Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Build application
npm run build
```

## Troubleshooting

### Common Issues

**Database Connection Error**:

- Verify Supabase project is active
- Check DATABASE_URL and Supabase credentials in `.env.local`
- Ensure Supabase project has proper network access configured

**Authentication Not Working**:

- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

**Design System Styles Missing**:

- Verify @rolemodel/betanxt-design-system is installed
- Check theme provider is properly configured
- Restart development server

**Build Errors**:

- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

### Getting Help

1. Check the console for error messages
2. Review the application logs
3. Verify environment configuration
4. Check database connectivity
5. Consult the API documentation at `/api-docs`

## Next Steps

After completing the quickstart:

1. **Explore the Codebase**: Review the project structure and understand the architecture
2. **Read Documentation**: Check the `/docs` directory for detailed guides
3. **Run Tests**: Execute the full test suite to ensure everything works
4. **Customize Configuration**: Adjust settings for your specific needs
5. **Deploy**: Follow the deployment guide for production setup (Vercel + Supabase)

## Success Criteria

✅ Application starts without errors  
✅ Authentication flow works correctly  
✅ Role-based access control functions properly  
✅ Event management CRUD operations work  
✅ Event registration system functions  
✅ Design system integration is consistent  
✅ API contracts are properly implemented  
✅ All tests pass successfully

When all verification tests pass, the project foundation is ready for feature development!
