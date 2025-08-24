/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: false, // désactive Turbopack côté code
  },
};
export default nextConfig;
