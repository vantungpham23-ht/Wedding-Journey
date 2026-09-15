/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  distDir: "dist",
  images: { unoptimized: true },
  // Static export friendly: keep client-side routing intact.
  trailingSlash: true,
};

module.exports = nextConfig;
