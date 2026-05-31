// lib/supabase-client.ts — Supabase Client for handling user-specific JWTs to enforce RLS
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAdminFromCookie } from './auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[SECURITY] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
}

/**
 * Creates an authenticated Supabase client for the current Admin user.
 * This ensures that Row-Level Security (RLS) policies are correctly evaluated 
 * in the database according to the active user session.
 */
export async function createAuthenticatedClient(): Promise<SupabaseClient | null> {
  const admin = await getAdminFromCookie();
  if (!admin) return null;

  // Supabase GoTrue Custom JWT support requires signing tokens using the Supabase JWT secret.
  // Assuming 'JWT_SECRET' in our system is identical to Supabase's JWT secret,
  // we can retrieve the raw cookie and forward it, but since we use a custom JWT structure,
  // it is best to use the Service Role key for backend logic that we authorize at the application layer,
  // OR we can pass the standard admin.id as a custom header if we use a DB function.
  // However, for standard Custom JWT integration, we can pass our own token.
  
  // Note: To make Supabase RLS work perfectly with our Custom JWT, 
  // the 'JWT_SECRET' in .env.local MUST MATCH your Supabase project's JWT secret.
  
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('smartaccess_admin_token')?.value;

  if (!token) return null;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

/**
 * Creates an admin/service-role Supabase client.
 * WARNING: This client BYPASSES ALL Row-Level Security (RLS) policies.
 * Use this only for background tasks, cron jobs, or hardware IoT communications (ESP32).
 */
export function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
