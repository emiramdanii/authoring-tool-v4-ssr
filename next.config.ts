import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  allowedDevOrigins: [
    'localhost:8080',
    '.space.chatglm.site',
    '.space-z.ai',
  ],
};

export default nextConfig;
