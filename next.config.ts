import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If you are hosting on a subdomain like sub.domain.com, you don't need basePath.
  // But if it's domain.com/subfolder, then you'd need: basePath: '/subfolder',
};

export default nextConfig;
