import { validateClientEnv } from '@rescue-link/config';

// Validate web client environment variables at Next.js build/startup time
validateClientEnv(process.env);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@rescue-link/schema', '@rescue-link/config'],

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
