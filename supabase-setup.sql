-- AWOS Dashboard - Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sensor_readings table if it doesn't exist
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Core meteorological data
    temperature DECIMAL(5,2),           -- Celsius
    humidity DECIMAL(5,2),              -- Percentage (0-100)
    pressure DECIMAL(7,2),              -- hPa (hectopascals)
    
    -- Wind data
    wind_speed DECIMAL(5,2),            -- m/s
    wind_direction DECIMAL(5,2),        -- degrees (0-360)
    wind_gust DECIMAL(5,2),             -- m/s
    
    -- Additional weather data
    dew_point DECIMAL(5,2),             -- Celsius
    visibility DECIMAL(8,2),            -- meters
    
    -- Precipitation data
    precipitation_1h DECIMAL(6,2),      -- mm
    precipitation_3h DECIMAL(6,2),      -- mm
    precipitation_6h DECIMAL(6,2),      -- mm
    precipitation_24h DECIMAL(6,2),     -- mm
    
    -- Weather conditions
    weather_code INTEGER,
    weather_description TEXT,
    
    -- Cloud data
    cloud_coverage DECIMAL(5,2),        -- percentage (0-100)
    cloud_base DECIMAL(8,2),            -- feet
    
    -- Pressure data
    sea_level_pressure DECIMAL(7,2),    -- hPa
    altimeter_setting DECIMAL(6,2),     -- inHg
    
    -- System status
    battery_voltage DECIMAL(4,2),       -- volts
    solar_panel_voltage DECIMAL(4,2),   -- volts
    signal_strength INTEGER,            -- dBm
    
    -- Data quality
    data_quality TEXT DEFAULT 'good',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_station_timestamp 
ON sensor_readings (station_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
ON sensor_readings (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_station 
ON sensor_readings (station_id);

-- Create users table if it doesn't exist (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alerts table for weather alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    alert_type TEXT NOT NULL, -- 'warning', 'error', 'info'
    severity TEXT NOT NULL,   -- 'low', 'medium', 'high'
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Create index for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_station_active 
ON alerts (station_id, is_active, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to sensor_readings" ON sensor_readings;
DROP POLICY IF EXISTS "Allow public insert to sensor_readings" ON sensor_readings;
DROP POLICY IF EXISTS "Allow public read access to alerts" ON alerts;

-- Create policies for public read access (for your app)
CREATE POLICY "Allow public read access to sensor_readings" 
ON sensor_readings FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert to sensor_readings" 
ON sensor_readings FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public read access to alerts" 
ON alerts FOR SELECT 
TO anon, authenticated
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_sensor_readings_updated_at ON sensor_readings;
CREATE TRIGGER update_sensor_readings_updated_at 
BEFORE UPDATE ON sensor_readings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO sensor_readings (
    station_id, 
    temperature, 
    humidity, 
    pressure, 
    wind_speed, 
    wind_direction,
    data_quality
) VALUES (
    'VCBI',
    26.5,
    68.2,
    1013.2,
    3.4,
    245.0,
    'good'
) ON CONFLICT DO NOTHING;

-- Enable Realtime for sensor_readings table
ALTER TABLE sensor_readings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;

-- Show success message
SELECT 'Database setup completed successfully!' as status;

-- Show table info
SELECT 
    tablename,
    tableowner,
    tablespace
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sensor_readings', 'users', 'alerts');

SELECT 'Setup Summary:' as info
UNION ALL
SELECT '✅ sensor_readings table created with indexes'
UNION ALL  
SELECT '✅ users table created for authentication'
UNION ALL
SELECT '✅ alerts table created for notifications'
UNION ALL
SELECT '✅ Row Level Security enabled'
UNION ALL
SELECT '✅ Public read/write policies created'
UNION ALL
SELECT '✅ Realtime enabled for sensor_readings'
UNION ALL
SELECT '✅ Sample data inserted';
