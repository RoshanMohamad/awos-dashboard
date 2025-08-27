-- Create sensor_readings table
CREATE TABLE sensor_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    station_id VARCHAR(50) DEFAULT 'VCBI' NOT NULL,
    
    -- Temperature readings (Celsius)
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    
    -- Pressure readings (hPa)
    pressure DECIMAL(7,2),
    
    -- Wind readings
    wind_speed DECIMAL(5,2), -- knots
    wind_direction INTEGER, -- degrees (0-360)
    wind_gust DECIMAL(5,2), -- knots
    
    -- Visibility (meters)
    visibility INTEGER,
    
    -- Precipitation
    precipitation_1h DECIMAL(5,2), -- mm in last hour
    precipitation_3h DECIMAL(5,2), -- mm in last 3 hours
    precipitation_6h DECIMAL(5,2), -- mm in last 6 hours
    precipitation_24h DECIMAL(5,2), -- mm in last 24 hours
    
    -- Weather conditions
    weather_code INTEGER,
    weather_description TEXT,
    
    -- Cloud information
    cloud_coverage INTEGER, -- percentage (0-100)
    cloud_base INTEGER, -- feet
    
    -- Additional meteorological data
    dew_point DECIMAL(5,2), -- Celsius
    sea_level_pressure DECIMAL(7,2), -- hPa
    altimeter_setting DECIMAL(7,2), -- inHg
    
    -- System status
    battery_voltage DECIMAL(4,2),
    solar_panel_voltage DECIMAL(4,2),
    signal_strength INTEGER, -- dBm
    
    -- Quality indicators
    data_quality VARCHAR(20) DEFAULT 'good',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_sensor_readings_station_id ON sensor_readings(station_id);
CREATE INDEX idx_sensor_readings_created_at ON sensor_readings(created_at DESC);

-- Create a composite index for common queries
CREATE INDEX idx_sensor_readings_station_time ON sensor_readings(station_id, timestamp DESC);

-- Add a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sensor_readings_updated_at 
    BEFORE UPDATE ON sensor_readings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read sensor readings" 
    ON sensor_readings FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sensor readings" 
    ON sensor_readings FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Create policy for service role (for API ingestion)
CREATE POLICY "Allow service role full access" 
    ON sensor_readings FOR ALL 
    USING (auth.role() = 'service_role');
