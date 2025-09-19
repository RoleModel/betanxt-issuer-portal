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

  // Apply bypass auth environment variables if enabled
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    config.env = {
      NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH,
      NEXT_PUBLIC_BYPASS_USER_ID: process.env.NEXT_PUBLIC_BYPASS_USER_ID,
      NEXT_PUBLIC_BYPASS_USER_ROLE: process.env.NEXT_PUBLIC_BYPASS_USER_ROLE,
    }
  }

  return config
}

export default nextConfig
