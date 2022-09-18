const isProduction = process.env.NODE_ENV === 'production'

const assetPrefix = isProduction ? '/ji' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  basePath: isProduction ? '/ji' : '',
  assetPrefix: isProduction ? '/ji' : '',
  env: {
    ASSET_PREFIX: assetPrefix
  }
}

module.exports = nextConfig
