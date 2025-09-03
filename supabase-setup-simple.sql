-- AWOS Dashboard - Simplified Supabase Setup
-- Run this in your Supabase SQL Editor (Simpler version)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS sensor_readings CASCADE;
-- DROP TABLE IF EXISTS alerts CASCADE; 
-- DROP TABLE IF EXISTS users CASCADE;

-- Create sensor_readings table
CREATE TABLE sensor_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Core meteorological data
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2), 
    pressure DECIMAL(7,2),
    wind_speed DECIMAL(5,2),
    wind_direction DECIMAL(5,2),
    wind_gust DECIMAL(5,2),
    dew_point DECIMAL(5,2),
    
    -- System status
    battery_voltage DECIMAL(4,2),
    data_quality TEXT DEFAULT 'good',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create essential indexes
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings (timestamp DESC);
CREATE INDEX idx_sensor_readings_station ON sensor_readings (station_id);

-- Create users table for authentication
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create simple policies for public access
CREATE POLICY "Public read sensor_readings" 
ON sensor_readings FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Public insert sensor_readings" 
ON sensor_readings FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public read alerts" 
ON alerts FOR SELECT 
TO anon, authenticated
USING (true);

-- Insert test data
INSERT INTO sensor_readings (
    station_id, temperature, humidity, pressure, wind_speed, wind_direction
) VALUES (
    'VCBI', 26.5, 68.2, 1013.2, 3.4, 245.0
);

-- Enable Realtime
ALTER TABLE sensor_readings REPLICA IDENTITY FULL;

-- Show success
SELECT 'Simple database setup completed!' as status;
SELECT COUNT(*) as sensor_readings_count FROM sensor_readings;
