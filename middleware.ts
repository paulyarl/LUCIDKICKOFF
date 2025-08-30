import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Add security headers
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Build dynamic CSP allowing trusted third-parties
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const posthogOrigin = 'https://app.posthog.com'
  const posthogCdn = 'https://cdn.posthog.com'
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  const connectSrc = [
    "'self'",
    'https:',
    'wss:',
    posthogOrigin,
    posthogHost,
    supabaseUrl,
    // Supabase Realtime websockets if present
    supabaseUrl.replace('https://', 'wss://'),
  ]
    .filter(Boolean)
    .join(' ')

  const csp = [
    `default-src 'self'`,
    // Inline scripts are allowed only with our per-request nonce
    `script-src 'self' 'nonce-${nonce}' ${posthogCdn}`,
    // Allow inline styles for Tailwind runtime classes
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' https: data: blob: ${posthogOrigin}`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // For service worker and PWA assets
    `worker-src 'self' blob:`,
    `object-src 'none'`,
  ].join('; ')

  // Comprehensive Security Headers (prod only)
  const isProd = process.env.NODE_ENV === 'production'
  if (isProd) {
    response.headers.set('Content-Security-Policy', csp)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
    response.headers.set('Permissions-Policy', [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=(self)',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'hid=() ',
      'interest-cohort=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=() ',
      'picture-in-picture=(self)',
      'publickey-credentials-get=(self)',
      'screen-wake-lock=()',
      'serial=()',
      'usb=()',
      'xr-spatial-tracking=()'
    ].join(', '))
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  } else {
    // Minimal dev-safe header to avoid blank pages due to COOP/COEP/HSTS
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }
  
  return response
}
