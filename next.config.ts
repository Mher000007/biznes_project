import type { NextConfig } from "next";
import path from "path";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001/api";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api', 'import'],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
