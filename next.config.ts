import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Cloudflare Pages compatibility
  output: "export" as const,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
