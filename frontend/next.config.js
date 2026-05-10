/** @type {import('next').NextConfig} */

/** Origem da API (fotos em /files/...): next/image exige remotePatterns para hosts externos. */
function remotePatternsFromApiUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!raw) return []
  try {
    const u = new URL(raw)
    return [
      {
        protocol: u.protocol === 'https:' ? 'https' : 'http',
        hostname: u.hostname,
        port: u.port || '',
        pathname: '/**',
      },
    ]
  } catch {
    return []
  }
}

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-XSS-Protection',          value: '1; mode=block' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'geolocation=(), microphone=(), camera=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8080', pathname: '/**' },
      ...remotePatternsFromApiUrl(),
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
