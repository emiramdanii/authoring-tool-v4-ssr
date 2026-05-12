import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'localhost:8080',
    '.space.chatglm.site',
    '.space-z.ai',
  ],
};

export default nextConfig;
