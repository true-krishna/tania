import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  allowedDevOrigins: [
    "**.trycloudflare.com",
    "**.ngrok-free.dev"
  ],
};

export default nextConfig;
