import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 
  // Enable SWC minification
  swcMinify: true,
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

};

export default nextConfig;