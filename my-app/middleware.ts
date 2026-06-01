import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import { rateLimitEdge } from "@/lib/rate-limit-edge";

// Define the sensitive path configurations
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the current request is targeting a sensitive endpoint
  const routeConfig = SENSITIVE_ROUTES.find((route) =>
    pathname.startsWith(route.prefix)
  );

  if (routeConfig) {
    // 2. Resolve the client's actual IP securely (anti-spoofing)
    const ip = getClientIp(request);

    // 3. Apply Edge-compatible PostgreSQL rate limiting
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

  return NextResponse.next();
}

// Ensure the middleware only runs on API routes to avoid performance overhead on static pages
export const config = {
  matcher: "/api/:path*",
};
