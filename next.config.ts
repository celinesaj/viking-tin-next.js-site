import type { NextConfig } from 'next';

const upstream =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '') || '';
const browserBase = process.env.NEXT_PUBLIC_API_BROWSER_BASE?.trim() || '';

/** True if `browserBase` would steal Next.js admin routes under `/dashboard/*`. */
function browserBaseShadowsDashboardUi(base: string): boolean {
  const b = base.replace(/\/+$/, '') || '/';
  return b === '/dashboard' || b.startsWith('/dashboard/');
}

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright', 'playwright-core'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      'swiper',
      'date-fns',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  async rewrites() {
    if (!browserBase.startsWith('/') || !/^https?:\/\//i.test(upstream)) {
      return [];
    }
    if (browserBaseShadowsDashboardUi(browserBase)) {
      console.warn(
        '[next.config] NEXT_PUBLIC_API_BROWSER_BASE must not be `/dashboard` (or under `/dashboard/…`) — those URLs are used by the admin App Router. Rewrites skipped.',
      );
      return [];
    }
    return [
      {
        source: `${browserBase}/:path*`,
        destination: `${upstream}/:path*`,
      },
    ];
  },
};

export default nextConfig;
