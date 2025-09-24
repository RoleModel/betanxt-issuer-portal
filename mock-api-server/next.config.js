// @ts-check
const nextConfig = () => {
  /**
   * @type {import('next').NextConfig}
   **/
  const config = {
    output: 'standalone',
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }

  return config
}

export default nextConfig
