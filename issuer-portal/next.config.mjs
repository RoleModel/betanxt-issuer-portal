// @ts-check
import createBundleAnalyzer from '@next/bundle-analyzer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

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
    reactStrictMode: false,
    eslint: {
      // Disable ESLint during builds due to configuration issues
      ignoreDuringBuilds: true,
    },
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
    webpack: (config) => {
      // Only add aliases if they don't already exist
      if (!config.resolve.alias) {
        config.resolve.alias = {}
      }

      // Add path aliases to match tsconfig
      Object.assign(config.resolve.alias, {
        '@': path.resolve(__dirname),
        '@/components': path.resolve(__dirname, 'components'),
        '@/contexts': path.resolve(__dirname, 'contexts'),
        '@/hooks': path.resolve(__dirname, 'hooks'),
        '@/utils': path.resolve(__dirname, 'utils'),
        '@/types': path.resolve(__dirname, 'types'),
        '@/domain-models': path.resolve(__dirname, 'domain-models'),
      })

      return config
    },
    async rewrites() {
      return [
        {
          source: '/documents/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/documents/:path*`,
        },
      ]
    },
  }

  // Apply auth environment variables (no secrets here)
  config.env = {
    AUTH_TRUST_HOST: 'true',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH,
    NEXT_PUBLIC_BYPASS_USER_ID: process.env.NEXT_PUBLIC_BYPASS_USER_ID,
    NEXT_PUBLIC_BYPASS_USER_ROLE: process.env.NEXT_PUBLIC_BYPASS_USER_ROLE,
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  }

  return config
}

export default withBundleAnalyzer(nextConfig)
