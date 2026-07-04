import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["@prisma/client"],
  cacheComponents: true,
  experimental: {
    proxyClientMaxBodySize: "1200mb",
    serverActions: {
      bodySizeLimit: "2048mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'eqsjhhpagpiyzhxzmjmd.supabase.co',
      },
    ],
  },
};

let finalConfig = nextConfig;

if (process.env.ANALYZE === "true") {
  try {
    const withBundleAnalyzer = require("@next/bundle-analyzer")({
      enabled: true,
    });
    finalConfig = withBundleAnalyzer(finalConfig);
  } catch (err) {
    console.warn("Bundle analyzer not installed, skipping.");
  }
}

export default withSerwist(finalConfig);
