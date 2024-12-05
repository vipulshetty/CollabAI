import { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle WebSocket-related externals
    if (!isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }

    // Add aliases for easier imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve('./components'),
      '@/hooks': path.resolve('./hooks'),
      '@/context': path.resolve('./context'),
      '@/utils': path.resolve('./utils'),
      '@/types': path.resolve('./types'),
    };

    return config;
  },

  async headers() {
    return [
      {
        source: "/api/socket",
        headers: [
          { 
            key: "Access-Control-Allow-Origin", 
            value: process.env.FRONTEND_URL || "http://localhost:3000" 
          },
          { 
            key: "Access-Control-Allow-Methods", 
            value: "GET,POST,OPTIONS" 
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization"
          }
        ],
      }
    ];
  },

  // Image optimization and external image domains
  images: {
    domains: [
      'lh3.googleusercontent.com', 
      'avatars.githubusercontent.com',
      'ui-avatars.com'
    ],
  },

  // Environment variables
  env: {
    SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3001',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Moved serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: ['simple-peer', 'socket.io'],

  // Remove problematic rewrites
  // async rewrites() {
  //   return [
  //     // Commented out due to invalid destination
  //   ];
  // },

  // TypeScript and type checking
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development'
  },

  // Compress and optimize builds
  compress: true,
};

export default nextConfig;