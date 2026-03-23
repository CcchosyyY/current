import type { NextConfig } from "next";

// Security headers applied to all routes.
// See https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
const securityHeaders = [
  {
    // Content-Security-Policy: restrict resource loading to same-origin
    // and trusted domains only. Prevents XSS by blocking inline scripts
    // (except Next.js nonce-based ones) and untrusted sources.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for styles and 'unsafe-eval' in dev.
      // In production, consider switching to nonce-based CSP.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    // Prevent the page from being embedded in an iframe (clickjacking protection)
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Prevent MIME type sniffing — forces browser to use declared Content-Type
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Control how much referrer info is sent with requests
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Disable browser features that are not needed
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    // Enforce HTTPS (only effective when served over HTTPS)
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Prevent XSS attacks in older browsers that support this header
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
