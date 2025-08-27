-- Setup TimescaleDB extension and hypertable
-- Run this after your initial Drizzle migration

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert sensor_readings table to hypertable
-- The time column must be the first argument and should be the timestamp column
SELECT create_hypertable('sensor_readings', 'timestamp', if_not_exists => TRUE);

-- Create additional indexes for better query performance
CREATE INDEX IF NOT EXISTS sensor_readings_runway_timestamp_idx 
    ON sensor_readings (runway, timestamp DESC);

CREATE INDEX IF NOT EXISTS sensor_readings_device_timestamp_idx 
    ON sensor_readings (device_id, timestamp DESC);

-- Create indexes for common sensor data queries
CREATE INDEX IF NOT EXISTS sensor_readings_wind_speed_idx 
    ON sensor_readings (wind_speed) WHERE wind_speed IS NOT NULL;

CREATE INDEX IF NOT EXISTS sensor_readings_temperature_idx 
    ON sensor_readings (temperature) WHERE temperature IS NOT NULL;

CREATE INDEX IF NOT EXISTS sensor_readings_pressure_idx 
    ON sensor_readings (pressure) WHERE pressure IS NOT NULL;

-- Set chunk time interval (optional, default is 7 days)
-- Adjust based on your data ingestion rate
SELECT set_chunk_time_interval('sensor_readings', INTERVAL '1 day');

-- Enable compression (optional, good for older data)
ALTER TABLE sensor_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'runway'
);

-- Set up automatic compression policy (compress data older than 7 days)
SELECT add_compression_policy('sensor_readings', INTERVAL '7 days');

-- Set up data retention policy (optional - delete data older than 1 year)
-- Uncomment the line below if you want automatic data retention
-- SELECT add_retention_policy('sensor_readings', INTERVAL '1 year');
