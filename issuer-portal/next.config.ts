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
}

export default nextConfig
