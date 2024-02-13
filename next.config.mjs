/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["typeorm"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
