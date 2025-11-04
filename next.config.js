/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true' 
    ? '/Tesla-Proximity-Chat' 
    : '',
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true'
    ? '/Tesla-Proximity-Chat'
    : '',
}

module.exports = nextConfig
