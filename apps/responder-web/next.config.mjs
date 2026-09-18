import { validateClientEnv } from '@rescue-link/config';

// Validate web client environment variables at Next.js build/startup time
validateClientEnv(process.env);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  transpilePackages: ['@rescue-link/schema', '@rescue-link/config'],
};

export default nextConfig;
