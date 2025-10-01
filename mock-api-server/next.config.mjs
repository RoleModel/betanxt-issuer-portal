// @ts-check
const nextConfig = () => {
  /**
   * @type {import('next').NextConfig}
   **/
  const config = {
    output: 'standalone',
    eslint: {
      ignoreDuringBuilds: true,
    },
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }

  return config
}

export default nextConfig
