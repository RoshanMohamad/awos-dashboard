# 🔌 ESP32 to Dashboard Connection Map

## Complete Data Flow Path

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PHYSICAL HARDWARE                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  Arduino Nano (Transmitter)                          │
    │  - Collects sensor data (temp, humidity, etc.)       │
    │  - Sends readable format via Serial                  │
    └──────────────────────────────────────────────────────┘
                                  │
                     Serial2 (9600 baud, readable format)
                     "Temp: 29.4 °C, Hum: 70%, ..."
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  ESP32 (Receiver)                                    │
    │  File: scripts/esp32-Receiver-WiFi-FIXED.ino        │
    │                                                       │
    │  Line 317: handleSerialInput()                       │
    │  - Parses readable format                            │
    │  - Extracts values to variables                      │
    │                                                       │
    │  Line 436: postToNextJS()                            │
    │  - Converts to JSON with numbers                     │
    │  - HTTP POST every 10 seconds                        │
    └──────────────────────────────────────────────────────┘
                                  │
                      WiFi (HTTPS POST)
                      Every 10 seconds
                                  │
                                  ▼

┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET / CLOUD                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  Vercel Deployment                                   │
    │  URL: https://awos-dashboard.vercel.app              │
    └──────────────────────────────────────────────────────┘
                                  │
                    POST /api/esp32
                    Content-Type: application/json
                    {
                      "stationId": "VCBI",
                      "temperature": 29.4,
                      "humidity": 70,
                      ...
                    }
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  Next.js API Route                                   │
    │  File: app/api/esp32/route.ts                        │
    │                                                       │
    │  Line 31: POST() function                            │
    │  Line 36: console.log('📡 Received ESP32 data')      │
    │  Line 57: Validates with Zod schema                  │
    │  Line 62: Transforms to database format              │
    │  Line 91: SensorReadingModel.createServerSide()      │
    └──────────────────────────────────────────────────────┘
                                  │
                       Stores in memory +
                       Saves to database
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  Supabase PostgreSQL Database                        │
    │  Table: sensor_readings                              │
    │                                                       │
    │  Columns (snake_case):                               │
    │  - station_id = "VCBI"                               │
    │  - temperature = 29.4                                │
    │  - humidity = 70                                     │
    │  - pressure = 1013.2                                 │
    │  - wind_speed = 3.4                                  │
    │  - wind_direction = 245                              │
    │  - timestamp = NOW()                                 │
    │  - battery_voltage = 12.5                            │
    │  - qc_flags = {power, powerStatus, commMode}         │
    └──────────────────────────────────────────────────────┘
                                  │
                    Realtime broadcast
                    (Supabase Realtime)
                                  │
                                  ▼

┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  React Dashboard Page                                │
    │  File: app/dashboard/page.tsx                        │
    │  URL: /dashboard                                     │
    │                                                       │
    │  Line 6: <Dashboard />                               │
    └──────────────────────────────────────────────────────┘
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  Dashboard Component                                 │
    │  File: components/dashboard.tsx                      │
    │                                                       │
    │  Line 15: selectedRunway = "02"                      │
    │  Line 24: getStationId("02") → "VCBI"                │
    │  Line 61: <LiveDashboard runway="VCBI" />            │
    └──────────────────────────────────────────────────────┘
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  Live Dashboard Component                            │
    │  File: components/live-dashboard.tsx                 │
    │                                                       │
    │  Line 14: useRealtimeSensorData(runway)              │
    └──────────────────────────────────────────────────────┘
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  Realtime Sensor Data Hook                           │
    │  File: hooks/use-realtime-sensor-data.ts             │
    │                                                       │
    │  🔧 FIXED Line 459: Listens to ALL inserts           │
    │  Line 466: Filters for station_id variations         │
    │  Line 483: transformReading() → SensorData           │
    │  Line 486: setSensorData() → Updates UI              │
    │                                                       │
    │  Two data sources:                                   │
    │  1. Realtime subscription (primary)                  │
    │  2. Polling every 5s (fallback)                      │
    └──────────────────────────────────────────────────────┘
                                  │
                        Updates every 10s
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────┐
    │  Dashboard UI Updates                                │
    │                                                       │
    │  - Wind compass rotates                              │
    │  - Temperature gauge moves                           │
    │  - Pressure gauge updates                            │
    │  - Humidity display changes                          │
    │  - "Last updated" timestamp refreshes                │
    └──────────────────────────────────────────────────────┘
```

---

## 🔗 Key Connection Points

### 1️⃣ ESP32 → Next.js API
```cpp
// File: scripts/esp32-Receiver-WiFi-FIXED.ino
// Line 54
const char* NEXTJS_BASE_URL = "https://awos-dashboard.vercel.app";
const char* NEXTJS_ESP32_PATH = "/api/esp32";

// Line 436: postToNextJS()
http.begin(url);  // HTTPS POST
http.addHeader("Content-Type", "application/json");
int code = http.POST(payload);  // Send JSON data
```

### 2️⃣ Next.js API → Database
```typescript
// File: app/api/esp32/route.ts
// Line 31: POST function receives data
// Line 91: Save to database
const savedReading = await SensorReadingModel.createServerSide(sensorReading);

// File: models/sensorReading.ts
// Line 154: Insert with retry logic
const result = await supabase
    .from('sensor_readings')
    .insert(sensorData)
    .select()
    .single();
```

### 3️⃣ Database → Dashboard (Realtime)
```typescript
// File: hooks/use-realtime-sensor-data.ts
// Line 459: Subscribe to realtime updates
const channel = supabase
    .channel(`sensor-readings-all`)
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_readings',
    }, (payload) => {
        // Check if station_id matches
        const variations = ['VCBI', 'VCBI-ESP32', ...];
        if (variations.includes(reading.station_id)) {
            setSensorData(transformReading(reading));  // Update UI
        }
    })
```

### 4️⃣ Dashboard → UI Components
```tsx
// File: components/live-dashboard.tsx
// Line 14: Get real-time data
const { sensorData } = useRealtimeSensorData(runway);

// Line 33: Use data in UI
const weatherData = sensorData || defaultValues;

// Lines 100+: Display in gauges
<div>Temperature: {weatherData.temperature}°C</div>
<WindCompass direction={weatherData.windDirection} />
```

---

## 🕐 Timing & Intervals

| Component | Interval | Purpose |
|-----------|----------|---------|
| Arduino Nano | Continuous | Collects sensor data |
| ESP32 Serial | Continuous | Receives from Nano |
| ESP32 → API | **10 seconds** | POSTs data to Next.js |
| Database Insert | Immediate | Saves to Supabase |
| Realtime Broadcast | Instant | Pushes to subscribers |
| Dashboard Update | **Instant** | React re-renders |
| Polling Fallback | 5 seconds | If realtime fails |
| OLED Display | 1 second | Local ESP32 screen |

---

## 📊 Data Format Transformations

### Stage 1: Arduino Nano Output (Readable)
```
Temp: 29.4 °C, Hum: 70 %, Press: 1013.2 hPa, ...
```

### Stage 2: ESP32 JSON (HTTP POST)
```json
{
  "stationId": "VCBI",
  "temperature": 29.4,
  "humidity": 70.0,
  "pressure": 1013.2,
  "dewPoint": 20.1,
  "windSpeed": 3.4,
  "windDirection": 245
}
```

### Stage 3: Database (snake_case)
```sql
INSERT INTO sensor_readings (
  station_id,
  temperature,
  humidity,
  pressure,
  wind_speed,
  wind_direction,
  timestamp
) VALUES (
  'VCBI',
  29.4,
  70.0,
  1013.2,
  3.4,
  245,
  '2024-01-15T10:30:00Z'
)
```

### Stage 4: Dashboard (camelCase TypeScript)
```typescript
interface SensorData {
  runway: 'VCBI',
  temperature: 29.4,
  humidity: 70.0,
  pressure: 1013.2,
  windSpeed: 3.4,
  windDirection: 245,
  timestamp: Date
}
```

---

## 🔍 How to Verify Each Connection Point

### ✅ Test 1: ESP32 → API
**Check ESP32 Serial Monitor:**
```
[NextJS] 📤 Sending POST:
[NextJS] 📥 HTTP 201
[NextJS] ✅ POST success!
```

**Or check Vercel logs:**
```
📡 Received ESP32 data: {stationId: 'VCBI', temperature: 29.4}
```

### ✅ Test 2: API → Database
**Query Supabase:**
```sql
SELECT * FROM sensor_readings 
WHERE timestamp > NOW() - INTERVAL '1 minute'
ORDER BY timestamp DESC;
```

**Or use debug endpoint:**
```
https://awos-dashboard.vercel.app/api/debug/check-data
```

### ✅ Test 3: Database → Dashboard
**Browser Console (F12):**
```
🔴 REALTIME UPDATE RECEIVED for VCBI
🔴 Matching station_id: VCBI
🟢 DASHBOARD REALTIME UPDATE: {temp: 29.4, ...}
```

### ✅ Test 4: Dashboard → UI
**Visual Check:**
- Wind compass rotating
- Temperature gauge moving
- "Last updated" showing recent time
- Values match ESP32 Serial Monitor

---

## 🚨 Common Connection Issues

| Issue | Where to Check | Fix |
|-------|----------------|-----|
| ESP32 can't reach API | Serial Monitor shows errors | Check WiFi, URL |
| API rejects data | Vercel logs show 400 error | Check JSON format |
| Database insert fails | Vercel logs show DB error | Check Supabase config |
| Dashboard not updating | Browser console | Check station_id match |

---

## 🔧 Debug Commands

### Check ESP32 Status
```cpp
// Open Serial Monitor @ 115200 baud
// Look for:
[WiFi] ✅ Connected
[NextJS] ✅ POST success!
```

### Check API Status
```bash
curl https://awos-dashboard.vercel.app/api/esp32
```

### Check Database Status
```bash
curl https://awos-dashboard.vercel.app/api/debug/check-data
```

### Check Dashboard Status
```javascript
// In browser console:
console.log('Realtime subscribed:', window.supabase);
```

---

## 📁 Key Files Reference

| Component | File Path | Key Function |
|-----------|-----------|--------------|
| ESP32 Code | `scripts/esp32-Receiver-WiFi-FIXED.ino` | `postToNextJS()` |
| API Endpoint | `app/api/esp32/route.ts` | `POST()` |
| Database Model | `models/sensorReading.ts` | `createServerSide()` |
| Realtime Hook | `hooks/use-realtime-sensor-data.ts` | `useRealtimeSensorData()` |
| Dashboard | `components/live-dashboard.tsx` | `LiveDashboard` |
| Main Page | `app/dashboard/page.tsx` | Entry point |

---

**Connection Status**: ✅ Fully mapped  
**Update Frequency**: Every 10 seconds  
**Latency**: < 2 seconds end-to-end
