import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Cloudflare Pages compatibility with edge runtime
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
