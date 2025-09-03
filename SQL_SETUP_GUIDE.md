# 🔧 SQL Setup Guide - Step by Step

## ❌ Error Fixed: Syntax Error at "ON"

The error was caused by improper `CREATE POLICY` syntax. I've fixed it in the updated SQL file.

## 🎯 **Two Options to Setup Your Database:**

### **Option 1: Use Fixed Complete Setup (Recommended)**

File: `supabase-setup.sql` (now fixed)

### **Option 2: Use Simple Setup (If you want minimal tables)**

File: `supabase-setup-simple.sql` (minimal, no syntax errors)

## 🚀 **How to Run the SQL Script:**

### Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard/project/qxivgtnfvyorrtnqmmsz
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run the SQL (Choose One Method)

**Method A: Copy-Paste All at Once**

1. Copy entire content from `supabase-setup.sql`
2. Paste into SQL Editor
3. Click **Run**

**Method B: Run Section by Section (Safer)**

```sql
-- 1. First run extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Then run table creation
CREATE TABLE sensor_readings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id TEXT NOT NULL DEFAULT 'VCBI',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    pressure DECIMAL(7,2),
    wind_speed DECIMAL(5,2),
    wind_direction DECIMAL(5,2),
    wind_gust DECIMAL(5,2),
    dew_point DECIMAL(5,2),
    visibility DECIMAL(8,2),
    precipitation_1h DECIMAL(6,2),
    precipitation_3h DECIMAL(6,2),
    precipitation_6h DECIMAL(6,2),
    precipitation_24h DECIMAL(6,2),
    weather_code INTEGER,
    weather_description TEXT,
    cloud_coverage DECIMAL(5,2),
    cloud_base DECIMAL(8,2),
    sea_level_pressure DECIMAL(7,2),
    altimeter_setting DECIMAL(6,2),
    battery_voltage DECIMAL(4,2),
    solar_panel_voltage DECIMAL(4,2),
    signal_strength INTEGER,
    data_quality TEXT DEFAULT 'good',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Then run indexes
CREATE INDEX idx_sensor_readings_station_timestamp
ON sensor_readings (station_id, timestamp DESC);

CREATE INDEX idx_sensor_readings_timestamp
ON sensor_readings (timestamp DESC);

-- 4. Enable RLS and create policies
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to sensor_readings"
ON sensor_readings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert to sensor_readings"
ON sensor_readings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 5. Insert test data
INSERT INTO sensor_readings (
    station_id, temperature, humidity, pressure, wind_speed, wind_direction, data_quality
) VALUES (
    'VCBI', 26.5, 68.2, 1013.2, 3.4, 245.0, 'good'
);

-- 6. Enable realtime
ALTER TABLE sensor_readings REPLICA IDENTITY FULL;
```

### Step 3: Verify Setup

Run this query to check if everything worked:

```sql
-- Check if table exists and has data
SELECT COUNT(*) as total_records FROM sensor_readings;

-- Check table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sensor_readings';

-- Check policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'sensor_readings';
```

## 🔍 **Expected Results:**

After successful setup, you should see:

- ✅ `sensor_readings` table created
- ✅ At least 1 test record inserted
- ✅ Policies created for public access
- ✅ Indexes created for performance

## ❌ **If You Get More Errors:**

### Common Issues & Fixes:

**Error: "relation already exists"**

```sql
-- Check if table exists first
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'sensor_readings'
);
```

**Error: "policy already exists"**

```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public read access to sensor_readings" ON sensor_readings;
DROP POLICY IF EXISTS "Allow public insert to sensor_readings" ON sensor_readings;
```

**Error: "permission denied"**

- Make sure you're logged into the correct Supabase project
- Check you have admin access to the database

## 🧪 **Test Your Setup:**

After running the SQL, test the API endpoint:

```bash
curl -X POST "https://awos-dashboard.vercel.app/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 27.5,
    "humidity": 70.0,
    "pressure": 1012.0,
    "stationId": "VCBI"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Sensor reading stored successfully"
}
```

## 📊 **Next Steps After Database Setup:**

1. ✅ **Database tables created**
2. ⏳ **Add Vercel environment variables** (if not done yet)
3. ⏳ **Redeploy your app**
4. ⏳ **Test ESP32 integration**
5. ⏳ **Verify real-time updates**

The fixed SQL script will work without syntax errors!
