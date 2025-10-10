import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: false,
  transpilePackages: [
    '@rolemodel/betanxt-design-system',
    '@mui/x-data-grid',
    '@mui/x-data-grid-pro',
    '@mui/x-date-pickers',
  ],
}

export default nextConfig
