/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (process.env.VERCEL !== '1') return [];
    const renderOrigin = 'https://vss75-erp.onrender.com';
    return {
      beforeFiles: [
        { source: '/api/:path*', destination: `${renderOrigin}/api/:path*` },
        { source: '/auth/erp/:path*', destination: `${renderOrigin}/auth/erp/:path*` },
        { source: '/admin/:path*', destination: `${renderOrigin}/admin/:path*` },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
