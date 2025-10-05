# Vercel Deployment Guide

## Environment Variables Required

You need to set the following environment variables in Vercel for successful deployment:

### 1. **MOTION_PLUS_TOKEN** (Required)

- Value: `fa867774eac8c0d3d3fd997cf10544073f6ef30d485303a0c4b88fe13d32b71a`
- Description: Authentication token for motion-plus package from motion.dev
- Add to: All environments (Production, Preview, Development)

### 2. **GITHUB_PACKAGES_TOKEN** (If using @rolemodel packages)

- Description: Personal access token for GitHub packages
- Add to: All environments

### 3. **Database Environment Variables** (Required)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. **NextAuth Configuration** (Required)

```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
```

## How to Add Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its value
4. Select which environments should have access (Production, Preview, Development)
5. Click "Save"

## Deployment Configuration

The project is configured with:

### `vercel.json`

```json
{
  "buildCommand": "cd issuer-portal && npm run build",
  "outputDirectory": "issuer-portal/.next",
  "installCommand": "./scripts/vercel-install.sh",
  "framework": "nextjs"
}
```

### Custom Install Script

The `scripts/vercel-install.sh` handles:

- GitHub packages authentication
- Motion-plus package installation with token
- Standard npm install

## Build Process

1. Vercel runs `./scripts/vercel-install.sh` which:
   - Configures GitHub packages authentication (if token provided)
   - Replaces motion-plus URL with authenticated version
   - Runs npm install

2. Build command runs `cd issuer-portal && npm run build`

3. Output is generated in `issuer-portal/.next`

## Troubleshooting

### Motion-plus Installation Fails

- Ensure `MOTION_PLUS_TOKEN` is set in Vercel environment variables
- Token should be added to all environments (Production, Preview, Development)

### Build Fails with TypeScript Errors

- All TypeScript errors have been fixed
- Ensure you're using Node.js 22.20.0 or higher (specified in package.json)

### GitHub Packages Authentication Fails

- Generate a personal access token with `read:packages` scope
- Add it as `GITHUB_PACKAGES_TOKEN` in Vercel

## Dependencies Added

- `jspdf` - PDF generation for reports
- `motion-plus` - Premium animation components from motion.dev

## Important Notes

1. **Do NOT commit tokens to repository** - All tokens should be in environment variables
2. The motion-plus package URL in package.json does NOT include the token - it's added dynamically during install
3. The custom install script handles token injection automatically

## Verification

After deployment, verify:

1. Application loads without errors
2. Animation components work (NumberCounter in dashboard)
3. PDF exports function correctly
4. Document uploads work

## Support

For issues with:

- Motion-plus: Check https://motion.dev documentation
- Deployment: Check Vercel build logs
- Application: Check browser console for errors
