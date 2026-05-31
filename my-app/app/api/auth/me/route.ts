import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";

export async function GET(req: NextRequest) {
  const rateLimitRes = await withRateLimit(req, "auth_me", 30, 60);
  if (!rateLimitRes.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Refactored to use authenticated Supabase Client to test RLS
  try {
    const { createAuthenticatedClient } = await import("@/lib/supabase-client");
    const supabase = await createAuthenticatedClient();
    
    // Test query against access_logs to verify RLS allows read access
    let logsCount = 0;
    if (supabase) {
      const { count } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true });
      logsCount = count || 0;
    }

    return NextResponse.json({ 
      user: admin,
      rls_enabled: !!supabase,
      accessible_logs_count: logsCount
    });
  } catch (err) {
    console.error("[auth/me] Error using Supabase Client:", err);
    return NextResponse.json({ user: admin, rls_enabled: false });
  }
}
