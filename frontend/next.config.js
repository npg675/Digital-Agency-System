/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverActions: {
    bodySizeLimit: '500mb',
  },
  experimental: {
    middlewareClientMaxBodySize: '500mb',
  },
};

module.exports = nextConfig;
