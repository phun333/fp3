import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fp3/shared-types", "@fp3/validation"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
