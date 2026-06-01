import { sbSelect } from "./supabase-edge";

export interface RateLimitEdgeOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitEdgeResult {
  success: boolean;
  count: number;
  resetTime: number;
}

/**
 * Edge-compatible rate limiter using Supabase REST API (fetch).
 * Safe to run in Vercel Edge Runtime / Next.js Middleware.
 */
export async function rateLimitEdge(options: RateLimitEdgeOptions): Promise<RateLimitEdgeResult> {
  const { key, limit, windowMs } = options;
  const now = Date.now();
  const defaultResetTime = now + windowMs;

  const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  try {
    // 1. Fetch current rate limit status
    const rows = await sbSelect("rate_limits", { key: `eq.${key}` });
    let count = 1;
    let resetTime = defaultResetTime;

    if (rows && rows.length > 0) {
      const current = rows[0] as { count: number; reset_time: string | number };
      const currentResetTime = Number(current.reset_time);

      if (now < currentResetTime) {
        // Within window -> increment
        count = current.count + 1;
        resetTime = currentResetTime;
      } else {
        // Window expired -> reset
        count = 1;
        resetTime = defaultResetTime;
      }
    }

    // 2. Upsert the updated rate limit record back to Supabase
    const url = new URL(`${SUPABASE_URL}/rest/v1/rate_limits`);
    await fetch(url.toString(), {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        key,
        count,
        reset_time: resetTime,
      }),
    });

    return {
      success: count <= limit,
      count,
      resetTime,
    };
  } catch (error) {
    console.error("[RateLimitEdge] Error checking rate limit:", error);
    // In case of database error, fail-open to ensure service availability
    return {
      success: true,
      count: 1,
      resetTime: defaultResetTime,
    };
  }
}
