import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  allowedDevOrigins: ['**.trycloudflare.com'],
};

export default nextConfig;
