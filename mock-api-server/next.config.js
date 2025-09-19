// @ts-check
/* eslint-disable @typescript-eslint/explicit-function-return-type */

/**
 * Next.js configuration
 * @returns {import('next').NextConfig}
 */
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
    /**
     * Configure headers for CORS
     * @returns {Promise<Array<{source: string, headers: Array<{key: string, value: string}>}>>}
     */
    async headers() {
      return [
        {
          // Apply to all API routes
          source: '/api/:path*',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*', // Allow all origins in development
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value:
                'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
            },
          ],
        },
      ]
    },
  }

  return config
}

export default nextConfig
