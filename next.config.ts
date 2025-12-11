import type { NextConfig } from "next";

interface WebpackRule {
  test?: { test?: (value: string) => boolean };
  issuer?: unknown;
  resourceQuery?: { not?: unknown[] };
  exclude?: RegExp;
}

const nextConfig: NextConfig = {
  // Note: Remove "standalone" for Cloudflare Pages - it requires edge-compatible output
  /* config options here */
  transpilePackages: ["@telegram-apps/telegram-ui"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  compress: true,

  webpack: (config, { dev, isServer }) => {
    const fileLoaderRule = config.module.rules.find(
      (rule: WebpackRule | string) =>
        typeof rule === "object" && rule !== null && rule.test?.test?.(".svg")
    ) as WebpackRule | undefined;

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },

      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: ["@svgr/webpack"],
      }
    );

    fileLoaderRule.exclude = /\.svg$/i;

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: "all",
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              enforce: true,
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  async rewrites() {
    return [
      {
        // source: "/wallet/:any*",
        // destination: "/inapp-wallet/:any*",
        source: "/wallet/:any*",
        destination: "/:any*",
      },
    ];
  },
  sassOptions: {
    includePaths: ["./lib/wallet/styles", "./lib/wallet"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000,
  },
  poweredByHeader: false,
  generateEtags: false,
};

export default nextConfig;
