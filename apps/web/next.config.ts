import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance: reduce webpack file-watching overhead in Docker bind mounts.
  // The monorepo root is mounted as /app — without broad ignores, webpack scans
  // everything (api-nest dist, prisma, openspec, proxy, etc.) every poll cycle.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 3000, // Poll every 3s (down from 1s) — 3x fewer syscalls
        aggregateTimeout: 500,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',              // nest build output
          '**/apps/api-nest/**',     // entire backend
          '**/apps/api-express/**',  // old backend
          '**/proxy/**',             // proxy layer
          '**/prisma/**',            // DB schema/migrations
          '**/openspec/**',          // SDD artifacts
          '**/scripts/**',           // build scripts
          '**/*.log',
          '**/*.sql',
        ],
      }
    }
    return config
  },
}

export default nextConfig
