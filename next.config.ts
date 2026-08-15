import type { NextConfig } from "next";

// Dev/HMR needs eval; production stays strict (no unsafe-eval).
const scriptSrc = process.env.NODE_ENV === "production" ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Robots-Tag", value: "index, follow" },
];

const nextConfig: NextConfig = {
    devIndicators: false,
    async headers() {
        return [
            { source: "/:path*", headers: securityHeaders },
            { source: "/:all*(png|webp|svg|ico|jpg|jpeg|woff2|woff|ttf)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
        ];
    },
};

export default nextConfig;
