import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@apps/shared'],
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};


module.exports = nextConfig;

export default nextConfig;
