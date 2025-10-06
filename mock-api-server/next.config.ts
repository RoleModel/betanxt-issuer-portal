import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove 'standalone' output for Vercel deployment
  // output: 'standalone',
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig
