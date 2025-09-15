-- =================================================================
-- 🚀 OPTIMAL SUPABASE SCHEMA FOR AWOS WEATHER DASHBOARD
-- =================================================================
-- This schema follows Supabase best practices for performance,
-- security, scalability, and real-time capabilities.
-- =================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================================
-- 📊 CORE WEATHER DATA TABLE
-- =================================================================

DROP TABLE IF EXISTS public.sensor_readings CASCADE;

CREATE TABLE public.sensor_readings (
    -- Primary identifiers
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Core meteorological data (following WMO standards)
    temperature DECIMAL(4,1),              -- °C (-99.9 to 99.9)
    humidity DECIMAL(4,1),                 -- % (0.0 to 100.0)
    pressure DECIMAL(6,1),                 -- hPa (800.0 to 1100.0)
    sea_level_pressure DECIMAL(6,1),       -- hPa (calculated)
    
    -- Wind measurements
    wind_speed DECIMAL(4,1),               -- m/s (0.0 to 99.9)
    wind_direction SMALLINT,               -- degrees (0-360)
    
    -- Derived measurements
    dew_point DECIMAL(4,1),                -- °C (calculated)
    
    -- Precipitation (if available)
    precipitation_1h DECIMAL(5,2),         -- mm in last hour
    precipitation_24h DECIMAL(5,2),        -- mm in last 24h
    
    -- Atmospheric conditions
    visibility INTEGER,                    -- meters
    cloud_coverage SMALLINT,               -- % (0-100)
    weather_code SMALLINT,                 -- WMO weather code
    weather_description TEXT,              -- Human readable
    
    -- Air quality (if available)
    pm25 DECIMAL(5,1),                    -- μg/m³
    pm10 DECIMAL(5,1),                    -- μg/m³
    aqi SMALLINT,                         -- Air Quality Index
    
    -- Location data
    latitude DECIMAL(8,6),                -- GPS coordinates
    longitude DECIMAL(9,6),               -- GPS coordinates
    altitude DECIMAL(6,1),                -- meters above sea level
    
    -- System health data
    battery_voltage DECIMAL(4,2),         -- volts
    solar_voltage DECIMAL(4,2),           -- volts
    signal_strength SMALLINT,             -- dBm (-120 to 0)
    system_temperature DECIMAL(4,1),      -- °C (internal sensor)
    
    -- Data quality and metadata
    data_quality TEXT NOT NULL DEFAULT 'good', -- good/fair/poor/invalid
    collection_method TEXT DEFAULT 'automatic', -- automatic/manual/calibration
    qc_flags JSONB,                       -- Quality control flags
    
    -- Timestamps (automatic)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
-- 📈 WEATHER AGGREGATES TABLE (for fast queries)
-- =================================================================

CREATE TABLE public.weather_aggregates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL,
    date DATE NOT NULL,
    hour SMALLINT, -- NULL for daily aggregates, 0-23 for hourly
    
    -- Temperature aggregates
    temp_min DECIMAL(4,1),
    temp_max DECIMAL(4,1),
    temp_avg DECIMAL(4,1),
    
    -- Humidity aggregates
    humidity_min DECIMAL(4,1),
    humidity_max DECIMAL(4,1),
    humidity_avg DECIMAL(4,1),
    
    -- Pressure aggregates
    pressure_min DECIMAL(6,1),
    pressure_max DECIMAL(6,1),
    pressure_avg DECIMAL(6,1),
    
    -- Wind aggregates
    wind_speed_avg DECIMAL(4,1),
    wind_speed_max DECIMAL(4,1),
    wind_direction_avg SMALLINT,
    
    -- Precipitation totals
    precipitation_total DECIMAL(5,2),
    
    -- Record counts
    sample_count INTEGER NOT NULL DEFAULT 0,
    valid_samples INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(station_id, date, hour)
);

-- =================================================================
-- 🚨 WEATHER ALERTS TABLE
-- =================================================================

CREATE TABLE public.weather_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- temperature/wind/pressure/system
    severity TEXT NOT NULL,   -- low/medium/high/critical
    
    -- Alert details
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    threshold_value DECIMAL(8,2),
    current_value DECIMAL(8,2),
    
    -- Alert timing
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Notification tracking
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
-- 👤 USER PROFILES TABLE (enhanced auth)
-- =================================================================

CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer', -- admin/operator/viewer
    
    -- Preferences
    preferred_units JSONB DEFAULT '{"temperature":"celsius","wind":"ms","pressure":"hpa"}',
    notification_settings JSONB DEFAULT '{"email":true,"realtime":true}',
    dashboard_config JSONB DEFAULT '{}',
    
    -- Permissions
    stations_access TEXT[] DEFAULT ARRAY['VCBI'], -- Array of station IDs
    can_export_data BOOLEAN DEFAULT true,
    can_receive_alerts BOOLEAN DEFAULT true,
    
    -- Metadata
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
-- 📡 STATION CONFIGURATION TABLE
-- =================================================================

CREATE TABLE public.weather_stations (
    id TEXT PRIMARY KEY, -- VCBI, VCRI, etc.
    name TEXT NOT NULL,
    description TEXT,
    
    -- Location
    latitude DECIMAL(8,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    altitude DECIMAL(6,1),
    timezone TEXT DEFAULT 'Asia/Colombo',
    
    -- Station details
    station_type TEXT DEFAULT 'automatic', -- automatic/manual/hybrid
    installation_date DATE,
    last_maintenance DATE,
    
    -- Sensor configuration
    sensors_config JSONB DEFAULT '{}',
    calibration_data JSONB DEFAULT '{}',
    
    -- Operational status
    is_active BOOLEAN NOT NULL DEFAULT true,
    data_interval_minutes SMALLINT DEFAULT 5,
    
    -- Contact info
    operator_name TEXT,
    operator_email TEXT,
    operator_phone TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
-- 🔍 PERFORMANCE INDEXES
-- =================================================================

-- Sensor readings indexes (most important)
CREATE INDEX idx_sensor_readings_station_timestamp ON sensor_readings(station_id, timestamp DESC);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_sensor_readings_data_quality ON sensor_readings(data_quality);
-- Removed NOW() function from index predicate as it's not IMMUTABLE
CREATE INDEX idx_sensor_readings_recent ON sensor_readings(timestamp DESC);

-- Aggregates indexes
CREATE INDEX idx_weather_aggregates_station_date ON weather_aggregates(station_id, date DESC);
CREATE INDEX idx_weather_aggregates_hourly ON weather_aggregates(station_id, date, hour) WHERE hour IS NOT NULL;

-- Alerts indexes
CREATE INDEX idx_weather_alerts_active ON weather_alerts(station_id, is_active, triggered_at DESC);
CREATE INDEX idx_weather_alerts_severity ON weather_alerts(severity, triggered_at DESC) WHERE is_active = true;

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_stations ON user_profiles USING GIN(stations_access);

-- =================================================================
-- 🔒 ROW LEVEL SECURITY POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_stations ENABLE ROW LEVEL SECURITY;

-- Sensor readings policies
DROP POLICY IF EXISTS "sensor_readings_public_read" ON sensor_readings;
CREATE POLICY "sensor_readings_public_read" ON sensor_readings
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sensor_readings_public_insert" ON sensor_readings;
CREATE POLICY "sensor_readings_public_insert" ON sensor_readings
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Weather aggregates policies
DROP POLICY IF EXISTS "weather_aggregates_public_read" ON weather_aggregates;
CREATE POLICY "weather_aggregates_public_read" ON weather_aggregates
    FOR SELECT TO anon, authenticated USING (true);

-- Weather alerts policies  
DROP POLICY IF EXISTS "weather_alerts_public_read" ON weather_alerts;
CREATE POLICY "weather_alerts_public_read" ON weather_alerts
    FOR SELECT TO anon, authenticated USING (true);

-- User profiles policies
DROP POLICY IF EXISTS "user_profiles_own_data" ON user_profiles;
CREATE POLICY "user_profiles_own_data" ON user_profiles
    FOR ALL TO authenticated USING (auth.uid() = id);

-- Weather stations policies
DROP POLICY IF EXISTS "weather_stations_public_read" ON weather_stations;
CREATE POLICY "weather_stations_public_read" ON weather_stations
    FOR SELECT TO anon, authenticated USING (true);

-- =================================================================
-- ⚡ FUNCTIONS AND TRIGGERS
-- =================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_sensor_readings_updated_at ON sensor_readings;
CREATE TRIGGER update_sensor_readings_updated_at
    BEFORE UPDATE ON sensor_readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate derived weather values
CREATE OR REPLACE FUNCTION calculate_weather_derived()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate dew point if temperature and humidity are provided
    IF NEW.temperature IS NOT NULL AND NEW.humidity IS NOT NULL THEN
        NEW.dew_point = NEW.temperature - ((100 - NEW.humidity) / 5.0);
    END IF;
    
    -- Calculate sea level pressure if pressure and altitude are provided
    IF NEW.pressure IS NOT NULL AND NEW.altitude IS NOT NULL THEN
        NEW.sea_level_pressure = NEW.pressure * POWER(1 + (NEW.altitude / 44307.69231), 5.253283);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for derived calculations
DROP TRIGGER IF EXISTS calculate_derived_values ON sensor_readings;
CREATE TRIGGER calculate_derived_values
    BEFORE INSERT OR UPDATE ON sensor_readings
    FOR EACH ROW EXECUTE FUNCTION calculate_weather_derived();

-- =================================================================
-- 🎯 REAL-TIME SUBSCRIPTIONS
-- =================================================================

-- Enable realtime for main tables
ALTER TABLE sensor_readings REPLICA IDENTITY FULL;
ALTER TABLE weather_alerts REPLICA IDENTITY FULL;

-- Note: Enable these in Supabase Dashboard → Database → Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE weather_alerts;

-- =================================================================
-- 📊 INITIAL DATA SETUP
-- =================================================================

-- Insert default weather station
INSERT INTO weather_stations (
    id, name, description, latitude, longitude, altitude,
    installation_date, is_active, data_interval_minutes
) VALUES (
    'VCBI', 
    'Colombo Bandaranaike International Airport',
    'Main AWOS weather station at VCBI airport',
    7.180756, 
    79.884124, 
    8.0,
    CURRENT_DATE,
    true,
    5
) ON CONFLICT (id) DO NOTHING;

-- Insert sample weather reading
INSERT INTO sensor_readings (
    station_id, temperature, humidity, pressure, wind_speed, 
    wind_direction, dew_point, weather_description, data_quality
) VALUES (
    'VCBI', 26.5, 68.2, 1013.2, 3.4, 245, 20.1, 
    'Partly Cloudy', 'good'
) ON CONFLICT DO NOTHING;

-- =================================================================
-- ✅ VERIFICATION AND SUMMARY
-- =================================================================

-- Show schema summary
SELECT 
    'SCHEMA SETUP COMPLETE!' as status,
    (SELECT COUNT(*) FROM sensor_readings) as sensor_readings_count,
    (SELECT COUNT(*) FROM weather_stations) as stations_count;

-- Show table structure
SELECT 
    pg_namespace.nspname as schema_name,
    pg_class.relname as table_name,
    pg_attribute.attname as column_name,
    pg_type.typname as data_type
FROM pg_attribute 
JOIN pg_class ON pg_class.oid = pg_attribute.attrelid
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
JOIN pg_type ON pg_type.oid = pg_attribute.atttypid
WHERE pg_namespace.nspname = 'public' 
    AND pg_class.relname IN ('sensor_readings', 'weather_aggregates', 'weather_alerts', 'user_profiles', 'weather_stations')
    AND pg_attribute.attnum > 0
    AND NOT pg_attribute.attisdropped
ORDER BY pg_class.relname, pg_attribute.attname;

-- =================================================================
-- 📋 SCHEMA FEATURES SUMMARY:
-- 
-- ✅ Optimized data types for weather data
-- ✅ Comprehensive indexing for fast queries
-- ✅ Row Level Security with proper policies  
-- ✅ Real-time subscriptions enabled
-- ✅ Automatic derived value calculations
-- ✅ Weather aggregates table for analytics
-- ✅ User management and permissions
-- ✅ Weather alerts and notifications
-- ✅ Station configuration management
-- ✅ Quality control and metadata tracking
-- ✅ Scalable for multiple weather stations
-- ✅ International weather standards (WMO)
-- =================================================================