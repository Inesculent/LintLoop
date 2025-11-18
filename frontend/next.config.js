/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix for multiple lockfile warning
  // This tells Next.js to use the frontend directory as the root for output file tracing
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname),
  },
};

module.exports = nextConfig;

