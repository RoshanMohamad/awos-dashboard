# 🚀 Quick Setup & Testing Guide

## 1️⃣ Deploy to Vercel (2 minutes)

```bash
cd "d:\profosional projects\awos-dashboard"
git add .
git commit -m "Fix: ESP32 API now accepts all sensor fields"
git push origin main
```

✅ Wait for Vercel deployment to complete (~1 minute)

---

## 2️⃣ Upload ESP32 Code (5 minutes)

1. **Open Arduino IDE**
2. **Load file**: `scripts/esp32-Receiver-WiFi-FIXED.ino`
3. **Select Board**: ESP32 Dev Module
4. **Select Port**: Your COM port (e.g., COM3)
5. **Click Upload** ⬆️

---

## 3️⃣ Verify ESP32 Working

Open **Serial Monitor** (115200 baud), you should see:

```
✅ OLED initialized
[WiFi] Connecting...
[WiFi] ✅ Connected → IP: 192.168.1.XX
[NextJS] Endpoint: https://awos-dashboard.vercel.app/api/esp32
[Web] ✅ Server started on port 80
System initialization complete
Waiting for READABLE data from Arduino Nano...

[Nano] ⬇️ Temp: 29.4 °C, Hum: 70 %
[NextJS] 📤 Sending POST:
{"stationId":"VCBI-ESP32","temperature":29.4,"humidity":70.0,...}
[NextJS] 📥 HTTP 201
[NextJS] Response: {"success":true,"message":"ESP32 data received..."}
[NextJS] ✅ POST success!
[NextJS] Data confirmed received by server
```

### ✅ Success Indicators:
- `[WiFi] ✅ Connected`
- `[Nano] ⬇️` messages appearing (data from Nano)
- `[NextJS] HTTP 201` or `202` (not 400 or 500)
- `[NextJS] ✅ POST success!`

### ❌ Error Indicators:
- `[WiFi] ❌ Failed to connect` → Check SSID/password
- `[NextJS] HTTP 400` → Validation error (check field types)
- `[NextJS] HTTP 500` → Server error (check Vercel logs)
- `[NextJS] ❌ POST error: -1` → Network/timeout issue

---

## 4️⃣ Check Vercel Logs

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click **Logs** tab
4. Look for:
   ```
   📡 Received ESP32 data: {
     stationId: 'VCBI-ESP32',
     temperature: 29.4,
     humidity: 70,
     ...
   }
   ✅ ESP32 data stored successfully in 245ms: <uuid>
   ```

---

## 5️⃣ Test Dashboard

1. Open: https://awos-dashboard.vercel.app/dashboard
2. **Press F12** (open DevTools)
3. Go to **Console** tab
4. Look for:
   ```
   🔄 Refreshing data for runway: VCBI
   ✅ Found data with station ID: VCBI-ESP32
   🟢 DASHBOARD REALTIME UPDATE: { temp: 29.4, humidity: 70, ... }
   ```

5. **Check the gauges update** every 10-15 seconds

---

## 6️⃣ Quick Test via Browser

Open ESP32's web interface:
```
http://[YOUR_ESP32_IP]
```

You should see:
- System status table (green if all OK)
- Weather data updating
- Next.js POST Success counter increasing
- Auto-refreshes every 10 seconds

---

## 🔧 Quick Fixes

### Issue: Dashboard not updating

**Fix 1**: Hard refresh browser
```
Ctrl + Shift + R
```

**Fix 2**: Check station ID
Open browser console and run:
```javascript
// Check what data is available
fetch('/api/esp32')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Fix 3**: Force database query
```sql
-- In Supabase SQL Editor
SELECT * FROM sensor_readings 
WHERE timestamp > NOW() - INTERVAL '5 minutes'
ORDER BY timestamp DESC;
```

### Issue: ESP32 showing errors

**Quick Reset:**
1. Unplug ESP32
2. Wait 5 seconds
3. Plug back in
4. Monitor serial output

### Issue: Validation errors

Check the POST payload in Serial Monitor:
```json
{"stationId":"VCBI-ESP32","temperature":29.4,...}
```

Make sure:
- ✅ Numbers are numbers (not strings)
- ✅ No `NaN` or `null` values
- ✅ All required fields present

---

## 📊 Success Metrics

After 5 minutes of running:
- ✅ ESP32 `nextJSPostSuccess` > 30 (at 10s intervals)
- ✅ Vercel logs show multiple successful inserts
- ✅ Dashboard shows recent timestamp (< 30 seconds old)
- ✅ Gauges move when values change

---

## 🆘 Still Having Issues?

### Check these in order:

1. **ESP32 Serial Monitor**
   - Is it receiving Nano data? (`[Nano] ⬇️`)
   - Is Wi-Fi connected?
   - Are POSTs successful? (HTTP 201/202)

2. **Vercel Logs**
   - Are requests arriving?
   - Any validation errors?
   - Database insert successful?

3. **Browser Console (F12)**
   - Any JavaScript errors?
   - WebSocket connected?
   - Data being fetched?

4. **Supabase Dashboard**
   - Are new rows appearing in `sensor_readings`?
   - Check timestamp of latest record
   - Verify `station_id` = "VCBI-ESP32"

---

## 📞 Debug Info Collection

If still not working, gather this info:

```bash
# ESP32 Info
- IP Address: [from Serial Monitor]
- nextJSPostSuccess: [from Serial Monitor or web interface]
- nextJSPostErrors: [from Serial Monitor or web interface]
- Last successful POST time: [from Serial Monitor]

# API Info
- Vercel deployment URL: https://awos-dashboard.vercel.app
- Last deployment time: [check Vercel dashboard]
- Recent error logs: [copy from Vercel]

# Database Info
- Latest record timestamp: [from Supabase query]
- Total records today: [from Supabase query]
- Station ID in use: [from Supabase query]
```

---

## ✅ Expected Timeline

- **0:00** - Upload ESP32 code
- **0:30** - ESP32 boots and connects to Wi-Fi
- **0:40** - First data received from Nano
- **0:50** - First POST to Next.js (should succeed)
- **1:00** - Dashboard should show first update
- **5:00** - Multiple successful POSTs, dashboard updating regularly

---

**Total Setup Time**: ~10 minutes  
**First Dashboard Update**: ~1 minute after ESP32 boot  
**Update Frequency**: Every 10 seconds

---

**Status**: ✅ Ready to test  
**Version**: 2.2-FIXED
