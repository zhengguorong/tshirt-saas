import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@tshirt/design", "@tshirt/order", "@tshirt/db", "@tshirt/production"],
  serverExternalPackages: ["@prisma/client", "sharp", "@resvg/resvg-js"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
