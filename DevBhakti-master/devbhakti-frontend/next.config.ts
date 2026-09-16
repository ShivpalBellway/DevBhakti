import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
        // destination: 'http://localhost:5001/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
        // destination: 'http://localhost:5001/uploads/:path*',
      },
      // ── Deep Linking: Serve .well-known files via backend ──────────────────
      // Android verifies:  GET https://devbhakti.com/.well-known/assetlinks.json
      // iOS verifies:      GET https://devbhakti.com/.well-known/apple-app-site-association
      {
        source: '/.well-known/:path*',
        destination: 'http://localhost:5000/.well-known/:path*',
      },
      // Smart redirect: /app/* → backend smart deep link handler
      {
        source: '/app/:path*',
        destination: 'http://localhost:5000/app/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        // iOS MUST receive Content-Type: application/json for AASA
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
};

export default nextConfig;






