/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  reactStrictMode: true,
  transpilePackages: ['@rescue-link/schema'],

  async rewrites() {
    const apiOrigin = process.env.RESCUE_LINK_API_ORIGIN || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
