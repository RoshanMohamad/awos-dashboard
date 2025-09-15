-- QUICK SETUP: Essential schema only
-- Copy and paste this entire block into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the main sensor readings table
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperature DECIMAL(4,1),
    humidity DECIMAL(4,1),
    pressure DECIMAL(6,1),
    wind_speed DECIMAL(4,1),
    wind_direction SMALLINT,
    wind_gust DECIMAL(4,1),
    visibility DECIMAL(5,1),
    precipitation_1h DECIMAL(4,1),
    precipitation_3h DECIMAL(4,1), 
    precipitation_6h DECIMAL(4,1),
    precipitation_24h DECIMAL(4,1),
    weather_code SMALLINT,
    weather_description TEXT,
    cloud_coverage DECIMAL(3,1),
    cloud_base DECIMAL(6,1),
    dew_point DECIMAL(4,1),
    sea_level_pressure DECIMAL(6,1),
    altimeter_setting DECIMAL(6,1),
    battery_voltage DECIMAL(4,2),
    solar_panel_voltage DECIMAL(4,2),
    signal_strength SMALLINT,
    data_quality TEXT NOT NULL DEFAULT 'good',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_station ON sensor_readings(station_id);

-- Enable Row Level Security but allow public access
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "sensor_readings_public_read" ON sensor_readings;
DROP POLICY IF EXISTS "sensor_readings_public_insert" ON sensor_readings;

-- Create permissive policies for testing
CREATE POLICY "sensor_readings_public_read" ON sensor_readings
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "sensor_readings_public_insert" ON sensor_readings
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Insert sample data for testing
INSERT INTO sensor_readings (station_id, temperature, humidity, pressure, wind_speed, weather_description)
VALUES ('VCBI', 26.5, 68.2, 913.2, 3.4, 'Clear Sky')
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'SUCCESS: Database is ready!' as status, COUNT(*) as record_count FROM sensor_readings;