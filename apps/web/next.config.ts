import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance: use SWC for minification (faster than default terser)
  swcMinify: true,
  // Performance: reduce webpack file-watching overhead in Docker bind mounts
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // Poll every 1000ms for file changes (Docker bind mount compatibility)
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
        ],
      }
    }
    return config
  },
}

export default nextConfig
