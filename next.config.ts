import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
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

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withSerwist(bundleAnalyzer(nextConfig));
