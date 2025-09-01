-- SQL migration: Move sensor_readings table from public to api schema
-- Run this in Supabase SQL editor or via psql. Make a backup before running.

BEGIN;

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Move table
ALTER TABLE IF EXISTS public.sensor_readings SET SCHEMA public;

-- If you have related sequences (serial PKs), move them too
-- Example: ALTER SEQUENCE IF EXISTS public.sensor_readings_id_seq SET SCHEMA public;

COMMIT;

-- Note: After running this, PostgREST (Supabase) that expects the `api` schema will find the table.
-- If your project uses row-level security policies or grants, review and reapply as necessary.
