import type { NextConfig } from "next";

// Ensure Prisma query engine binaries in src/generated/prisma are included in all server bundles
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // Apply globally: copy Prisma client assets into all serverless/route bundles
    "/": [
      "src/generated/prisma/**",
    ],
  },
};

export default nextConfig;
