import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api', 'import'],
  },
};

export default nextConfig;
