const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

export default nextConfig
