-- =================================================================
-- 🗄️ MINIMAL DATABASE SETUP - AWOS Dashboard
-- =================================================================
-- Copy this ENTIRE script and paste it into Supabase SQL Editor
-- =================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the main sensor_readings table
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Weather data
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    pressure DECIMAL(7,2),
    wind_speed DECIMAL(5,2),
    wind_direction DECIMAL(5,2),
    dew_point DECIMAL(5,2),
    weather_description TEXT,
    
    -- System info
    data_quality TEXT DEFAULT 'good',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
ON sensor_readings (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_station_time 
ON sensor_readings (station_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to sensor_readings" ON sensor_readings;
DROP POLICY IF EXISTS "Allow public insert access to sensor_readings" ON sensor_readings;

-- Create public access policies (for your app)
CREATE POLICY "Allow public read access to sensor_readings" 
ON sensor_readings FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to sensor_readings" 
ON sensor_readings FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Enable realtime (for live updates)
ALTER TABLE sensor_readings REPLICA IDENTITY FULL;

-- Insert test data
INSERT INTO sensor_readings (
    station_id, 
    temperature, 
    humidity, 
    pressure, 
    wind_speed, 
    wind_direction,
    dew_point,
    weather_description,
    data_quality
) VALUES (
    'VCBI',
    26.5,
    68.2,
    1013.2,
    3.4,
    245.0,
    20.1,
    'Partly Cloudy',
    'good'
) ON CONFLICT DO NOTHING;

-- Show success message
SELECT 
    'SUCCESS: Database setup completed!' as status,
    COUNT(*) as test_records
FROM sensor_readings 
WHERE station_id = 'VCBI';

-- =================================================================
-- ✅ SETUP COMPLETE! 
-- Your API endpoints should now work without errors.
-- Test: curl http://localhost:3000/api/readings/current
-- =================================================================