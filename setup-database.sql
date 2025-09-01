-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sensor_readings table in the public schema
CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    
    -- Weather measurements
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2) CHECK (humidity >= 0 AND humidity <= 100),
    pressure DECIMAL(7,2),
    wind_speed DECIMAL(6,2) CHECK (wind_speed >= 0),
    wind_direction INTEGER CHECK (wind_direction >= 0 AND wind_direction <= 360),
    wind_gust DECIMAL(6,2) CHECK (wind_gust >= 0),
    visibility INTEGER,
    
    -- Precipitation data
    precipitation_1h DECIMAL(7,2) CHECK (precipitation_1h >= 0),
    precipitation_3h DECIMAL(7,2) CHECK (precipitation_3h >= 0),
    precipitation_6h DECIMAL(7,2) CHECK (precipitation_6h >= 0),
    precipitation_24h DECIMAL(7,2) CHECK (precipitation_24h >= 0),
    
    -- Weather conditions
    weather_code INTEGER,
    weather_description TEXT,
    
    -- Cloud data
    cloud_coverage DECIMAL(5,2) CHECK (cloud_coverage >= 0 AND cloud_coverage <= 100),
    cloud_base INTEGER,
    
    -- Additional meteorological data
    dew_point DECIMAL(5,2),
    sea_level_pressure DECIMAL(7,2),
    altimeter_setting DECIMAL(6,4),
    
    -- System status
    battery_voltage DECIMAL(5,2) CHECK (battery_voltage >= 0),
    solar_panel_voltage DECIMAL(5,2) CHECK (solar_panel_voltage >= 0),
    signal_strength INTEGER,
    
    -- Data quality
    data_quality TEXT NOT NULL DEFAULT 'good',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON public.sensor_readings (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_station_id ON public.sensor_readings (station_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_station_timestamp ON public.sensor_readings (station_id, timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.sensor_readings
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Allow insert for authenticated users and anon (for API ingestion)
CREATE POLICY "Allow insert for authenticated users" ON public.sensor_readings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Allow update for authenticated users
CREATE POLICY "Allow update for authenticated users" ON public.sensor_readings
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow delete for authenticated users
CREATE POLICY "Allow delete for authenticated users" ON public.sensor_readings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_sensor_readings_updated_at 
    BEFORE UPDATE ON public.sensor_readings 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.sensor_readings (
    station_id,
    timestamp,
    temperature,
    humidity,
    pressure,
    wind_speed,
    wind_direction,
    data_quality
) VALUES
(
    'VCBI',
    NOW() - INTERVAL '1 hour',
    28.5,
    65.2,
    1013.25,
    12.5,
    270,
    'good'
),
(
    'VCBI',
    NOW() - INTERVAL '30 minutes',
    29.1,
    63.8,
    1012.8,
    15.2,
    275,
    'good'
),
(
    'VCBI',
    NOW(),
    29.8,
    62.1,
    1012.3,
    18.7,
    280,
    'good'
)
ON CONFLICT DO NOTHING;
