/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Wyłączamy żeby zatrzymać duplikacje w development
  // Performance optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Bundle optimization
  experimental: {
    optimizePackageImports: ['@near-wallet-selector/core', '@near-wallet-selector/modal-ui', 'near-api-js'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Source maps configuration
  productionBrowserSourceMaps: false,
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://free.rpc.fastnear.com https://test.api.fastnear.com https://api.near.org https://rpc.mainnet.near.org https://rpc.testnet.near.org",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob: https://i.near.social https://ui-avatars.com https://ipfs.near.social",
              "connect-src 'self' https://free.rpc.fastnear.com https://test.api.fastnear.com https://api.near.org https://rpc.mainnet.near.org https://rpc.testnet.near.org https://api.openai.com https://api.near.social wss://free.rpc.fastnear.com wss://test.api.fastnear.com",
              "frame-src 'self' https://near.social",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
      };
    }
    
    // Bundle optimization
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            near: {
              test: /[\\/]node_modules[\\/]@near[\\/]/,
              name: 'near-vendor',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
