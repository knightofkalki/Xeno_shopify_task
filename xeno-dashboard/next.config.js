/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://xeno-shopify-task-pra7-git-main-boardlys-projects.vercel.app',
  },
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
