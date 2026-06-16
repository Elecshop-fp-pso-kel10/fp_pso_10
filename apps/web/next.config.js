/*
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
*/

const nextConfig = {
  transpilePackages: ['@apps/shared'],

  // Required for Docker / Azure App Service deployment
  // Generates a self-contained build in .next/standalone
  output: 'standalone',

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

  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;