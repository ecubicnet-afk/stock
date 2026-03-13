import type { NextConfig } from 'next';

const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isStaticExport ? { output: 'export' } : {}),
  ...(!isStaticExport
    ? {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
              ],
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
