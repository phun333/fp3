import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fp3/shared-types", "@fp3/validation"],
};

export default nextConfig;
