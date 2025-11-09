# ESP32 to Dashboard Troubleshooting Guide

## Problem Summary
Your ESP32 was sending data successfully (visible in Serial Monitor) but the web dashboard wasn't updating with the latest readings.

## Root Causes Identified

### 1. **Missing Fields in API Schema**
❌ **Problem**: The API validation schema didn't include all the fields your ESP32 was sending
- Missing: `utcDate`, `voltage`, `current`, `power`, `powerStatus`, `commMode`

✅ **Fixed**: Updated the Zod schema in `/app/api/esp32/route.ts` to accept all ESP32 fields

### 2. **Data Type Mismatches**
❌ **Problem**: ESP32 might have been sending numbers as strings in some cases
- The API expects: `temperature: number`, `humidity: number`, etc.
- ESP32 might send: `"29.4"` instead of `29.4`

✅ **Fixed**: Created robust `extractNumberFloat()` and `extractNumberInt()` functions that properly parse numeric values

### 3. **Insufficient Logging**
❌ **Problem**: Hard to diagnose what data the API was receiving
✅ **Fixed**: Added comprehensive logging to show all incoming ESP32 data fields

---

## What Was Changed

### 1. Next.js API Updates (`/app/api/esp32/route.ts`)

```typescript
// BEFORE: Limited schema
const ESP32DataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    pressure: z.number(),
    // ... missing fields
});

// AFTER: Complete schema
const ESP32DataSchema = z.object({
    temperature: z.number(),
    humidity: z.number(),
    pressure: z.number(),
    dewPoint: z.number(),
    windSpeed: z.number(),
    windDirection: z.number(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    utcDate: z.string().optional(),      // ← Added
    utcTime: z.string().optional(),      // ← Added
    voltage: z.number().optional(),       // ← Added
    current: z.number().optional(),       // ← Added
    power: z.number().optional(),         // ← Added
    powerStatus: z.string().optional(),   // ← Added
    commMode: z.string().optional(),      // ← Added
    stationId: z.string().default('VCBI-ESP32'),
});
```

### 2. Enhanced Logging

```typescript
console.log('📡 Received ESP32 data:', {
    stationId: body.stationId,
    utcDate: body.utcDate,
    utcTime: body.utcTime,
    temperature: `${body.temperature}°C`,
    humidity: `${body.humidity}%`,
    pressure: `${body.pressure} hPa`,
    windSpeed: `${body.windSpeed} m/s`,
    windDirection: `${body.windDirection}°`,
    voltage: body.voltage ? `${body.voltage}V` : 'N/A',
    current: body.current ? `${body.current}A` : 'N/A',
    power: body.power ? `${body.power}W` : 'N/A',
    powerStatus: body.powerStatus || 'N/A',
    commMode: body.commMode || 'N/A',
    lat: body.lat,
    lng: body.lng
})
```

### 3. Database Field Mapping

Since your database schema doesn't have dedicated `voltage`, `current`, `power` columns, the data is stored as:
- `voltage` → `battery_voltage`
- `current` → `solar_voltage` (reusing this field)
- `power`, `powerStatus`, `commMode`, `utcDate`, `utcTime` → stored in `qc_flags` JSON field

### 4. New ESP32 Code (`esp32-Receiver-WiFi-FIXED.ino`)

**Key improvements:**
- ✅ Sends proper numeric types (not strings)
- ✅ Better error handling
- ✅ Detailed debug output
- ✅ Validation before sending data
- ✅ Success/error counters
- ✅ Improved number extraction functions

---

## How to Test the Fix

### Step 1: Deploy Updated API to Vercel

```bash
cd "d:\profosional projects\awos-dashboard"
git add .
git commit -m "Fix ESP32 API to accept all sensor fields"
git push
```

Wait for Vercel to deploy (check https://vercel.com/dashboard)

### Step 2: Upload Fixed ESP32 Code

1. Open Arduino IDE
2. Load: `scripts/esp32-Receiver-WiFi-FIXED.ino`
3. Verify Wi-Fi credentials are correct:
   ```cpp
   const char* ssid     = "SakuriA52s";
   const char* password = "sanji614";
   ```
4. Upload to ESP32
5. Open Serial Monitor (115200 baud)

### Step 3: Monitor Serial Output

You should see:
```
✅ OLED initialized
[WiFi] ✅ Connected → IP: 192.168.1.XXX
[NextJS] Endpoint: https://awos-dashboard.vercel.app/api/esp32
[Web] ✅ Server started on port 80
[Nano] ⬇️ Temp: 29.4 °C, Hum: 70 %
[NextJS] 📤 Sending POST:
{"stationId":"VCBI-ESP32","temperature":29.4,"humidity":70.0,...}
[NextJS] 📥 HTTP 201
[NextJS] ✅ POST success!
[NextJS] Data confirmed received by server
```

### Step 4: Check Vercel Logs

1. Go to: https://vercel.com/your-project/logs
2. Look for: `📡 Received ESP32 data:`
3. Verify all fields are present

### Step 5: Check Dashboard

1. Open: https://awos-dashboard.vercel.app/dashboard
2. You should see real-time data updating every 10 seconds
3. Check browser console (F12) for any errors

---

## Debugging Checklist

### ✅ ESP32 Side

- [ ] ESP32 connected to Wi-Fi (check Serial Monitor)
- [ ] ESP32 receiving data from Nano (see `[Nano] ⬇️` messages)
- [ ] ESP32 successfully POSTing to Next.js (see `[NextJS] ✅ POST success!`)
- [ ] No HTTP errors (should be `HTTP 201` or `HTTP 202`)
- [ ] `nextJSPostSuccess` counter increasing
- [ ] Can access ESP32 web interface at its IP address

### ✅ Next.js API Side

- [ ] Deployment successful on Vercel
- [ ] API endpoint responding: `https://awos-dashboard.vercel.app/api/esp32`
- [ ] Vercel logs show `📡 Received ESP32 data:`
- [ ] No validation errors in logs
- [ ] Database insert successful (`✅ ESP32 data stored successfully`)

### ✅ Dashboard Side

- [ ] Dashboard loading at `/dashboard`
- [ ] Browser console shows no errors
- [ ] Real-time connection established (check for WebSocket messages)
- [ ] `lastUpdate` timestamp updating
- [ ] Sensor values changing on display

---

## Common Issues & Solutions

### Issue 1: "Validation failed" Error

**Symptom**: Vercel logs show Zod validation errors

**Solution**: 
- Check that ESP32 is sending numbers, not strings
- Verify field names match exactly (case-sensitive)
- Use the FIXED Arduino code which ensures proper types

### Issue 2: Data in Serial Monitor but not on Dashboard

**Symptom**: ESP32 shows successful POST, but dashboard shows old data

**Possible causes:**
1. **Station ID mismatch**: 
   - ESP32 sends: `"VCBI-ESP32"`
   - Dashboard expects: `"VCBI"`
   - **Solution**: Dashboard now tries multiple station ID variations

2. **Realtime subscription not working**:
   - Check Supabase realtime is enabled
   - Dashboard has polling fallback (check every 5 seconds)

3. **Browser cache**:
   - Hard refresh: `Ctrl + Shift + R`
   - Clear site data in DevTools

### Issue 3: "Database timeout" Error

**Symptom**: API returns 202 instead of 201

**What it means**: Data received but database write is slow/failing

**Solution**:
- Check Supabase dashboard for connection limits
- Verify RLS policies allow inserts
- Check database connection string

### Issue 4: ESP32 Can't Connect to Wi-Fi

**Symptoms**: Serial shows connection attempts timing out

**Solutions**:
1. Verify SSID and password
2. Check 2.4GHz band (ESP32 doesn't support 5GHz)
3. Move ESP32 closer to router
4. Check if network has MAC filtering

### Issue 5: Nano Data Not Parsing

**Symptom**: ESP32 receives data but all values show "N/A"

**Solution**:
- Check Nano's output format matches expected readable format
- Verify Serial2 baud rate (9600)
- Check TX/RX pin connections
- Enable debug output to see raw received strings

---

## Testing Without Hardware

You can test the API directly using curl:

```bash
curl -X POST https://awos-dashboard.vercel.app/api/esp32 \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "VCBI-ESP32",
    "temperature": 28.5,
    "humidity": 65.0,
    "pressure": 1013.2,
    "dewPoint": 20.1,
    "windSpeed": 3.4,
    "windDirection": 245,
    "lat": 7.180756,
    "lng": 79.884124,
    "voltage": 12.5,
    "current": 2.3,
    "power": 28.75,
    "powerStatus": "Battery",
    "commMode": "WiFi",
    "utcDate": "2024-01-15",
    "utcTime": "10:30:00"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "ESP32 data received and stored successfully",
  "responseTime": "245ms"
}
```

---

## Real-time Monitoring Commands

### Watch Vercel Logs Live
```bash
vercel logs --follow
```

### Monitor ESP32 via Serial
```bash
# Windows
arduino-cli monitor -p COM3 -c baudrate=115200

# Linux/Mac
arduino-cli monitor -p /dev/ttyUSB0 -c baudrate=115200
```

### Check Database Records
```sql
-- In Supabase SQL Editor
SELECT 
    station_id,
    timestamp,
    temperature,
    humidity,
    pressure,
    wind_speed,
    wind_direction,
    battery_voltage,
    qc_flags
FROM sensor_readings
WHERE station_id = 'VCBI-ESP32'
ORDER BY timestamp DESC
LIMIT 10;
```

---

## Performance Optimization

### Recommended Intervals

```cpp
const unsigned long nextJSPostInterval = 10000;  // 10s = optimal
const unsigned long dataSendInterval   = 30000;  // 30s = SD logging
const unsigned long oledUpdateInterval = 1000;   // 1s = UI refresh
```

**Why 10 seconds for Next.js?**
- Balances real-time updates with API quota limits
- Prevents overwhelming the database
- Gives enough time for data processing
- Supabase free tier: ~50,000 requests/month = ~1.67 per minute = 16 seconds minimum

### Reducing Data Transfer

If you need to reduce API calls:
```cpp
const unsigned long nextJSPostInterval = 30000;  // 30s
```

Or implement smart posting (only when values change significantly):
```cpp
if (abs(temperature.toFloat() - lastTemperature) > 0.5) {
    postToNextJS();
    lastTemperature = temperature.toFloat();
}
```

---

## Next Steps

1. ✅ Upload the fixed ESP32 code
2. ✅ Deploy the updated API to Vercel  
3. 🔍 Monitor Serial output for successful POSTs
4. 🔍 Check Vercel logs for incoming data
5. 🔍 Verify dashboard updates in real-time
6. 📊 Monitor for 1 hour to ensure stability

---

## Support Resources

- **Vercel Logs**: https://vercel.com/dashboard → Your Project → Logs
- **Supabase Dashboard**: https://app.supabase.com → Your Project
- **ESP32 Local Interface**: `http://[ESP32-IP-ADDRESS]`
- **API Health Check**: `https://awos-dashboard.vercel.app/api/esp32` (GET)

---

## File Locations

- ✅ **Fixed ESP32 Code**: `scripts/esp32-Receiver-WiFi-FIXED.ino`
- ✅ **Updated API**: `app/api/esp32/route.ts`
- 📝 **This Guide**: `ESP32_TROUBLESHOOTING_GUIDE.md`

---

**Version**: 2.2-FIXED  
**Last Updated**: 2024-01-15  
**Status**: ✅ Ready for deployment
