// @ts-check

const nextConfig = () => {
  /**
   * @type {import('next').NextConfig}
   **/
  const config = {
    experimental: {
      globalNotFound: true,
    },
    output: 'standalone',
    productionBrowserSourceMaps: true,
    reactStrictMode: true,
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
    transpilePackages: [
      '@rolemodel/betanxt-design-system',
      '@mui/x-data-grid',
      '@mui/x-data-grid-pro',
      '@mui/x-date-pickers',
    ],
  }

  // Apply auth environment variables (no secrets here)
  config.env = {
    AUTH_TRUST_HOST: 'true',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH,
    NEXT_PUBLIC_BYPASS_USER_ID: process.env.NEXT_PUBLIC_BYPASS_USER_ID,
    NEXT_PUBLIC_BYPASS_USER_ROLE: process.env.NEXT_PUBLIC_BYPASS_USER_ROLE,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  }

  return config
}

export default nextConfig
