/** @type {import('next').NextConfig} */
// Force rebuild - 2025-12-05
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://affiliate-backend-production-df21.up.railway.app' : 'http://localhost:3001'),
  },
}

module.exports = nextConfig

