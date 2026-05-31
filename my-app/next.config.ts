import type { NextConfig } from "next";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

const supabaseHost = process.env.POSTGRES_HOST
  ? `https://${process.env.POSTGRES_HOST}`
  : "https://*.supabase.co";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Next.js App Router ships inline bootstrap/hydration scripts without nonces by default.
  // 'strict-dynamic' would cause modern browsers to ignore 'self' and 'unsafe-inline',
  // blocking those inline scripts and leaving the app stuck on a loading spinner.
  // 'unsafe-eval' เปิดเฉพาะตอน dev เท่านั้น — Next.js/React ใช้ eval() สำหรับ error overlay/source map
  // ในโหมด dev (production ไม่ใช้ eval) จึงไม่กระทบความปลอดภัยของระบบจริง
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  // FCM Web SDK ต้องต่อหลาย endpoint: firebaseinstallations (FID), fcmregistrations (ออกโทเคน),
  // fcm/googleapis (ส่งข้อความ), oauth2 (token), และ wss สำหรับ Realtime/SSE บางกรณี
  `connect-src 'self' ${supabaseHost} https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://firebaseinstallations.googleapis.com https://www.googleapis.com https://oauth2.googleapis.com`,
  "manifest-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
];

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.2.49"],
  serverExternalPackages: ["pg", "pdfkit", "bcryptjs", "jsonwebtoken", "qrcode"],
  // gzip responses to cut bandwidth on the free Vercel tier
  compress: true,
  // Source maps bloat the build output and aren't needed in production
  productionBrowserSourceMaps: false,
  // Drop console.* (except warn/error) from the production client bundle
  compiler: {
    removeConsole: isProduction ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Service Worker ต้องส่งด้วย correct scope — ไม่ cache
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/firebase-messaging-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  turbopack: {
    // CRITICAL: A stray package-lock.json at C:\Users\aunkh\ causes Turbopack
    // to use the home directory as workspace root, scanning thousands of files
    // and causing OOM crashes. This locks the root to this project folder.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
