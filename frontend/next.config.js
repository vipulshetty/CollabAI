/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    unoptimized: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  reactStrictMode: true,
  swcMinify: true
}

module.exports = nextConfig
