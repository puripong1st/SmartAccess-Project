// proxy.ts — Route protection & Rate limiting in Next.js 16
// หมายเหตุ: proxy รันบน Node.js runtime เสมอ จึงไม่ต้อง (และห้าม) ประกาศ `export const runtime`
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";
import { getClientIp } from "./lib/client-ip";
import { rateLimitEdge } from "./lib/rate-limit-edge";

// V07 fix: security headers applied to all non-ESP32 responses
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
};

function applySecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  // Skip ESP32 routes — they have their own CORS headers
  if (pathname.startsWith("/api/esp32")) return response;
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// Define the sensitive path configurations from former middleware.ts
const SENSITIVE_ROUTES = [
  {
    prefix: "/api/auth",
    limit: 10,
    windowMs: 60 * 1000,
    endpointName: "auth-limit",
  },
  {
    prefix: "/api/esp32",
    limit: 60,
    windowMs: 60 * 1000,
    endpointName: "esp32-limit",
  },
  {
    prefix: "/api/students",
    limit: 20,
    windowMs: 60 * 1000,
    endpointName: "students-limit",
  },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check rate limit for API routes
  if (pathname.startsWith("/api/")) {
    const routeConfig = SENSITIVE_ROUTES.find((route) =>
      pathname.startsWith(route.prefix)
    );

    if (routeConfig) {
      // Resolve the client's actual IP securely (anti-spoofing)
      const ip = getClientIp(request);

      // Apply rate limiting
      const rateLimitKey = `${routeConfig.endpointName}:${ip}`;
      const { success, count, resetTime } = await rateLimitEdge({
        key: rateLimitKey,
        limit: routeConfig.limit,
        windowMs: routeConfig.windowMs,
      });

      if (!success) {
        console.warn(
          `[SECURITY] Rate Limit Exceeded on ${pathname} from IP: ${ip}. Request Count: ${count}`
        );
        
        const retryAfter = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));

        return new NextResponse(
          JSON.stringify({
            error: "Too Many Requests",
            message: "ระบบควบคุมอัตราการส่งข้อมูลตรวจพบปริมาณคำขอเกินกำหนด โปรดลองใหม่ในภายหลัง",
            retryAfterSeconds: retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": routeConfig.limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": resetTime.toString(),
              "Retry-After": retryAfter.toString(),
            },
          }
        );
      }
    }
  }

  // 2. Protect admin dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    const token = request.cookies.get("smartaccess_admin_token")?.value;
    if (!token) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/admin/login", request.url)), pathname);
    }
    const payload = verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("smartaccess_admin_token");
      return applySecurityHeaders(response, pathname);
    }
  }

  // Redirect /admin to /admin/dashboard (if logged in) or /admin/login
  if (pathname === "/admin" || pathname === "/admin/") {
    const token = request.cookies.get("smartaccess_admin_token")?.value;
    if (token && verifyToken(token)) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/admin/dashboard", request.url)), pathname);
    }
    return applySecurityHeaders(NextResponse.redirect(new URL("/admin/login", request.url)), pathname);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response, pathname);
}

export const config = {
  matcher: ["/admin", "/admin/", "/admin/dashboard/:path*", "/api/:path*"],
};

