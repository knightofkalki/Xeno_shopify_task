/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'https://xeno-shopify-service-5hy737wj7-boardlys-projects.vercel.app',
  },
  eslint: {
    // Warning: This disables ESLint checks during production builds
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
