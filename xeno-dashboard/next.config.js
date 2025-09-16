/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'https://xenoshopifytask-production.up.railway.app',
  },
  eslint: {
    // Warning: This disables ESLint checks during production builds
    ignoreDuringBuilds: false,
  },
  // Alternative CORS solution using rewrites (comment out env.NEXT_PUBLIC_API_URL if using this)
  // async rewrites() {
  //   return [
  //     {
  //       source: '/backend/:path*',
  //       destination: 'https://xeno-shopify-service-5hy737wj7-boardlys-projects.vercel.app/:path*',
  //     },
  //   ];
  // },
}

module.exports = nextConfig
