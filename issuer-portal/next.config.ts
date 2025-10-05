import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    globalNotFound: true,
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: false,
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
  async rewrites() {
    return [
      {
        source: '/documents/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/documents/:path*`,
      },
    ]
  },
  env: {
    AUTH_TRUST_HOST: 'true',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH,
    NEXT_PUBLIC_BYPASS_USER_ID: process.env.NEXT_PUBLIC_BYPASS_USER_ID,
    NEXT_PUBLIC_BYPASS_USER_ROLE: process.env.NEXT_PUBLIC_BYPASS_USER_ROLE,
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  },
}

export default nextConfig
