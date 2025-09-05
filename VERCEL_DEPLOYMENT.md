# AWOS Dashboard - Vercel Deployment Guide

## Overview

This guide helps you deploy the AWOS Dashboard to Vercel with complete functionality including database, authentication, and real-time features.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Supabase Account](https://supabase.com/dashboard)
- [GitHub Account](https://github.com) (for source code)

## Step 1: Prepare Your Supabase Project

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `awos-dashboard`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Wait for project initialization (2-3 minutes)

### 1.2 Get Project Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJ`)
   - **service_role key** (starts with `eyJ`)

### 1.3 Set Up Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL script:

```sql
-- Create sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    station_id TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    pressure REAL,
    wind_speed REAL,
    wind_direction REAL,
    wind_gust REAL,
    visibility REAL,
    precipitation_1h REAL,
    precipitation_3h REAL,
    precipitation_6h REAL,
    precipitation_24h REAL,
    weather_code INTEGER,
    weather_description TEXT,
    cloud_coverage REAL,
    cloud_base REAL,
    dew_point REAL,
    sea_level_pressure REAL,
    altimeter_setting REAL,
    battery_voltage REAL,
    solar_panel_voltage REAL,
    signal_strength REAL,
    data_quality TEXT DEFAULT 'good',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_station_id ON sensor_readings(station_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_station_timestamp ON sensor_readings(station_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access" ON sensor_readings
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON sensor_readings
    FOR INSERT WITH CHECK (true);

-- Create real-time subscription
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
```

## Step 2: Deploy to Vercel

### 2.1 Deploy from GitHub

1. **Option A: Use Deploy Button**
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RoshanMohamad/awos-dashboard)

2. **Option B: Manual Deployment**
   1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
   2. Click "New Project"
   3. Import your GitHub repository
   4. Configure project settings

### 2.2 Configure Environment Variables

**CRITICAL**: Add these environment variables in Vercel:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development**:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration  
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NODE_ENV=production

# Database URL (for Prisma/direct connections if needed)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

> ⚠️ **Important**: Replace placeholder values with your actual Supabase credentials

### 2.3 Deploy and Test

1. **Deploy**: Click "Deploy" in Vercel
2. **Wait**: Build process takes 2-5 minutes
3. **Test**: Visit your deployed URL
4. **Verify**: Check that no environment variable errors appear

## Step 3: Configure Authentication (Optional)

### 3.1 Set Up Google OAuth

1. **Google Cloud Console**:
   1. Go to [Google Cloud Console](https://console.cloud.google.com/)
   2. Create/select a project
   3. Enable Google+ API
   4. Create OAuth 2.0 credentials

2. **Configure Redirect URLs**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   https://your-app.vercel.app/auth/callback
   ```

3. **Add to Vercel Environment Variables**:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Configure in Supabase**:
   1. Go to **Authentication** → **Providers**
   2. Enable Google provider
   3. Add your Google credentials

## Step 4: Test Your Deployment

### 4.1 Basic Functionality

1. **Visit your app**: `https://your-app.vercel.app`
2. **Check health**: `https://your-app.vercel.app/api/health`
3. **Test data ingestion**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/ingest \
     -H "Content-Type: application/json" \
     -d '{
       "stationId": "TEST001",
       "temperature": 25.5,
       "humidity": 60.2,
       "pressure": 1013.25
     }'
   ```

### 4.2 Dashboard Features

- ✅ **Real-time Dashboard**: Live weather data display
- ✅ **Historical Charts**: Temperature, humidity, pressure trends
- ✅ **Multi-station Support**: Multiple weather stations
- ✅ **Responsive Design**: Mobile and desktop friendly
- ✅ **Dark/Light Mode**: Theme switching
- ✅ **PWA Features**: Installable app

## Step 5: Connect IoT Devices

### 5.1 Update ESP32 Configuration

```cpp
// Update in your ESP32 code
const char* INGEST_URL = "https://your-app.vercel.app/api/ingest";
const char* STATION_ID = "YOUR_STATION_ID";
```

### 5.2 MQTT Integration (Optional)

1. **Set up MQTT broker** (AWS IoT, HiveMQ, or self-hosted)
2. **Configure MQTT bridge**:
   ```bash
   MQTT_BROKER_URL=mqtt://your-broker
   API_BASE_URL=https://your-app.vercel.app
   ```
3. **Run bridge**: `npm run mqtt-bridge`

## Step 6: Monitoring and Maintenance

### 6.1 Health Monitoring

- **Health endpoint**: `https://your-app.vercel.app/api/health`
- **Database health**: `https://your-app.vercel.app/api/db/health`
- **Vercel monitoring**: Built-in analytics and logs

### 6.2 Database Maintenance

1. **Monitor usage** in Supabase Dashboard
2. **Set up backups** (automatic in Supabase)
3. **Review performance** and optimize queries if needed

### 6.3 Updates and Scaling

1. **Automatic deployments**: Push to main branch
2. **Preview deployments**: Pull requests get preview URLs
3. **Scaling**: Vercel scales automatically
4. **Custom domains**: Add in Vercel project settings

## Troubleshooting

### Common Issues

1. **Build Errors**:
   - ❌ Missing environment variables
   - ✅ Add all required variables in Vercel

2. **Database Connection**:
   - ❌ Wrong Supabase credentials
   - ✅ Double-check URL and keys

3. **CORS Issues**:
   - ❌ API calls from different domain
   - ✅ Update CORS settings in Next.js config

4. **Performance Issues**:
   - ❌ Too many database queries
   - ✅ Implement caching and optimize queries

### Getting Help

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **GitHub Issues**: Report bugs and feature requests
- **Community**: Join discussions and get help

## Production Checklist

- [ ] ✅ Environment variables configured
- [ ] ✅ Database schema created
- [ ] ✅ SSL certificate active (automatic with Vercel)
- [ ] ✅ Custom domain configured (optional)
- [ ] ✅ Authentication working (if enabled)
- [ ] ✅ IoT devices connected and sending data
- [ ] ✅ Monitoring and alerts set up
- [ ] ✅ Backup strategy implemented
- [ ] ✅ Team access configured

## Next Steps

1. **Customize Dashboard**: Modify charts and layouts
2. **Add More Sensors**: Extend data collection
3. **Set Up Alerts**: Notify on extreme weather
4. **Integrate with Other Services**: Weather APIs, notifications
5. **Scale IoT Network**: Add more weather stations

---

**🎉 Congratulations!** Your AWOS Dashboard is now live and ready for production use.

For support, visit: [GitHub Repository](https://github.com/RoshanMohamad/awos-dashboard)
