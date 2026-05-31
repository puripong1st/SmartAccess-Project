// scripts/apply-rls.js
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
require('@next/env').loadEnvConfig(process.cwd());

async function applyRLS() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('No POSTGRES_URL found in .env.local');
    process.exit(1);
  }

  const connectionConfig = parse(connectionString);
  const sslConfig = process.env.SUPABASE_CA_CERT ? {
    ca: process.env.SUPABASE_CA_CERT.replace(/\\n/g, "\\n"),
    rejectUnauthorized: true
  } : {
    rejectUnauthorized: false
  };

  const pool = new Pool({
    ...connectionConfig,
    ssl: sslConfig
  });

  console.log('Applying Row-Level Security (RLS) policies...');

  try {
    // 1. Enable RLS on tables
    await pool.query('ALTER TABLE students ENABLE ROW LEVEL SECURITY;');
    await pool.query('ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;');
    await pool.query('ALTER TABLE esp32_heartbeats ENABLE ROW LEVEL SECURITY;');

    // 2. Policy for students
    // Assume custom JWT contains "role" and "id" matching the payload.
    // If auth.role() = 'authenticated', and the payload role is admin, they can see all.
    // NOTE: For custom JWTs, Supabase stores custom claims in `auth.jwt()`.
    await pool.query(`
      DROP POLICY IF EXISTS "Admins can view all students" ON students;
      CREATE POLICY "Admins can view all students" 
      ON students 
      FOR ALL 
      USING (
        (auth.jwt() ->> 'role')::text IN ('owner', 'door_operator', 'log_viewer')
      );
    `);

    // 3. Policy for access_logs
    // Nobody can delete access logs except 'owner' or service_role
    await pool.query(`
      DROP POLICY IF EXISTS "Admins can insert and view logs" ON access_logs;
      CREATE POLICY "Admins can insert and view logs"
      ON access_logs
      FOR SELECT
      USING (
        (auth.jwt() ->> 'role')::text IN ('owner', 'door_operator', 'log_viewer')
      );

      DROP POLICY IF EXISTS "Only owners can delete logs" ON access_logs;
      CREATE POLICY "Only owners can delete logs"
      ON access_logs
      FOR DELETE
      USING (
        (auth.jwt() ->> 'role')::text = 'owner'
      );
    `);

    // 4. Policy for esp32_heartbeats
    await pool.query(`
      DROP POLICY IF EXISTS "Admins can view heartbeats" ON esp32_heartbeats;
      CREATE POLICY "Admins can view heartbeats"
      ON esp32_heartbeats
      FOR ALL
      USING (
        (auth.jwt() ->> 'role')::text IN ('owner', 'door_operator', 'log_viewer')
      );
    `);

    console.log('RLS Policies applied successfully!');
  } catch (err) {
    console.error('Error applying RLS:', err);
  } finally {
    await pool.end();
  }
}

applyRLS();
