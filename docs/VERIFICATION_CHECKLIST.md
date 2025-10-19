# AWOS Dashboard - Complete Local Verification Checklist

This checklist helps you verify that your AWOS Dashboard is working correctly in **100% offline mode** with ESP32 Ethernet connection.

**Last Updated:** October 19, 2025

---

## ✅ Pre-Installation Checklist

### Hardware Setup
- [ ] ESP32 development board available
- [ ] W5500 Ethernet module available
- [ ] SPI connections wired correctly (CS=GPIO5, MOSI=23, MISO=19, SCK=18)
- [ ] Power connections verified (3.3V to W5500, GND connected)
- [ ] OLED display connected (optional, SDA=21, SCL=22)
- [ ] 2x Ethernet cables available (Cat5e or better)
- [ ] Router with available Ethernet ports
- [ ] USB cable for programming ESP32

### Software Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Arduino IDE installed
- [ ] ESP32 board support added to Arduino IDE
- [ ] Required Arduino libraries installed (Ethernet, ArduinoJson, Adafruit GFX, SSD1306)

---

## 📡 Network Configuration Checklist

### Step 1: Detect PC IP Address
```cmd
ipconfig
```
- [ ] PC IP address identified (e.g., 192.168.1.100)
- [ ] Network adapter is Ethernet or WiFi
- [ ] IP is in format: 192.168.x.x or 10.0.x.x
- [ ] Write down IP: `____.____.____.____`

### Step 2: Select ESP32 IP Address
- [ ] Chosen unique IP on same subnet (e.g., 192.168.1.177)
- [ ] Verified IP is not in use: `ping 192.168.1.177` (should timeout)
- [ ] Write down ESP32 IP: `____.____.____.____`

### Step 3: Identify Router Gateway
- [ ] Gateway IP identified from ipconfig (usually 192.168.1.1)
- [ ] Router is pingable: `ping 192.168.1.1`
- [ ] Write down Gateway: `____.____.____.____`

---

## ⚙️ Configuration Checklist

### .env.local Configuration
- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_PC_IP` set to your PC IP
- [ ] `NEXT_PUBLIC_ESP32_IP` set to chosen ESP32 IP
- [ ] `NEXT_PUBLIC_GATEWAY_IP` set to router IP
- [ ] `NEXT_PUBLIC_SERVER_PORT` set to 3000
- [ ] `NEXT_PUBLIC_OFFLINE_MODE` set to true

### ESP32 Arduino Code Configuration
File: `scripts/esp32-Local-Ethernet.ino`

- [ ] Line 36: `serverIP` matches your PC IP
- [ ] Line 37: `esp32IP` matches chosen ESP32 IP
- [ ] Line 38: `gateway` matches router IP
- [ ] Line 39: `subnet` is 255.255.255.0
- [ ] Line 40: `dns` matches router IP
- [ ] Line 42: `SERVER_PORT` is 3000
- [ ] Line 43: `API_ENDPOINT` is "/api/esp32"

### Node.js Dependencies
```cmd
cd "d:\profosional projects\awos-dashboard"
npm install
```
- [ ] Dependencies installed without errors
- [ ] `node_modules` folder created
- [ ] No security vulnerabilities reported

---

## 🔥 Firewall Configuration Checklist

### Windows Firewall
```cmd
netsh advfirewall firewall add rule name="AWOS Dashboard Port 3000" dir=in action=allow protocol=TCP localport=3000
```
- [ ] Firewall rule added successfully
- [ ] Rule verified: `netsh advfirewall firewall show rule name="AWOS Dashboard Port 3000"`
- [ ] Inbound connections allowed on port 3000

### Test Firewall
```cmd
netstat -an | findstr :3000
```
- [ ] After starting server, port 3000 shows as LISTENING

---

## 🚀 Server Startup Checklist

### Start Development Server
```cmd
cd "d:\profosional projects\awos-dashboard"
npm run dev
```
- [ ] Server starts without errors
- [ ] Console shows: "✓ Ready on http://localhost:3000"
- [ ] No compilation errors
- [ ] Server responds to: `http://localhost:3000`

### Alternative: Use Batch File
```cmd
start-awos-server.bat
```
- [ ] Batch file runs successfully
- [ ] Shows network configuration
- [ ] Displays PC IP address
- [ ] Server starts automatically

### Browser Access
- [ ] `http://localhost:3000` shows login page
- [ ] `http://YOUR_PC_IP:3000` shows login page from same PC
- [ ] No JavaScript errors in browser console (F12)

---

## 🔐 Authentication Checklist

### Default Login
- Email: `admin@local.awos`
- Password: `admin123`

- [ ] Login page displays correctly
- [ ] Email field accepts input
- [ ] Password field accepts input
- [ ] "Sign In" button is clickable
- [ ] Login succeeds with default credentials
- [ ] Redirected to dashboard after login
- [ ] No authentication errors in console

### Session Management
- [ ] User remains logged in after page refresh
- [ ] Session token stored in browser (check Application tab in DevTools)
- [ ] Logout works correctly
- [ ] After logout, redirected to login page

---

## 🔌 ESP32 Hardware Checklist

### Physical Connections
- [ ] ESP32 connected to PC via USB
- [ ] Ethernet cable connected: Router → W5500 module
- [ ] W5500 LED indicator lights up when cable connected
- [ ] Power LED on ESP32 is on
- [ ] No loose wire connections

### Arduino IDE Configuration
- [ ] Board selected: **ESP32 Dev Module**
- [ ] Port selected: **COM3** (or your ESP32 port)
- [ ] Upload speed: **921600**
- [ ] Flash frequency: **80MHz**
- [ ] Code compiles without errors

### Upload to ESP32
- [ ] Code uploads successfully (100%)
- [ ] No upload errors
- [ ] "Hard resetting via RTS pin..." message appears
- [ ] ESP32 restarts after upload

---

## 📟 ESP32 Serial Monitor Checklist

### Open Serial Monitor
- Tools → Serial Monitor
- Baud rate: **115200**

### Expected Output
```
=== ESP32 AWOS Receiver (Local Ethernet) ===

📡 Initializing Ethernet...
✅ Ethernet connected!
   ESP32 IP: 192.168.1.177
   Server IP: 192.168.1.100:3000

✅ System Ready
Waiting for LoRa data...
```

- [ ] Serial monitor shows startup messages
- [ ] "✅ Ethernet connected!" appears
- [ ] ESP32 IP displayed matches configured IP
- [ ] Server IP displayed matches PC IP
- [ ] No error messages like "Ethernet cable not connected"

### Data Transmission (if LoRa data available)
```
📡 LoRa: T:28.5,H:65.2,P:1013.25,WS:5.5,WD:180

📤 Sending data to server...
✅ Connected to server
📊 Sent: {"stationId":"VCBI-ESP32","temperature":28.5,...}
📥 Response: HTTP/1.1 201 Created
✅ Data sent successfully
```

- [ ] LoRa data received (if sensor transmitting)
- [ ] "Sending data to server..." appears every 10 seconds
- [ ] "✅ Connected to server" appears
- [ ] JSON data shown in Serial Monitor
- [ ] "HTTP/1.1 201 Created" response received
- [ ] "✅ Data sent successfully" appears
- [ ] No "Connection to server failed" errors

---

## 🌐 Network Connectivity Checklist

### PC to Router
```cmd
ping 192.168.1.1
```
- [ ] Router responds to ping
- [ ] Latency < 10ms
- [ ] 0% packet loss

### PC to ESP32
```cmd
ping 192.168.1.177
```
- [ ] ESP32 responds to ping (after Ethernet connected)
- [ ] Latency < 5ms
- [ ] 0% packet loss

### Router Device List
- [ ] Login to router web interface
- [ ] Check connected devices list
- [ ] ESP32 (192.168.1.177) appears in list
- [ ] PC (192.168.1.100) appears in list

---

## 🧪 API Endpoint Testing Checklist

### Test ESP32 Endpoint
```cmd
curl http://localhost:3000/api/esp32
```
**Expected Response (if data available):**
```json
{
  "success": true,
  "data": {
    "temperature": 28.5,
    "humidity": 65.2,
    "pressure": 1013.25,
    "timestamp": "2025-10-19T10:00:00.000Z",
    "dataAge": 5000,
    "isDataFresh": true,
    "connectionStatus": "connected"
  }
}
```

- [ ] Endpoint responds (not 404)
- [ ] Returns JSON data
- [ ] If data sent by ESP32: `success: true`
- [ ] If no data yet: `error: "No ESP32 data available"`

### Test Readings Endpoint
```cmd
curl http://localhost:3000/api/readings
```
- [ ] Endpoint responds
- [ ] Returns array of sensor readings
- [ ] Pagination info included

### Test Database Health
```cmd
curl http://localhost:3000/api/db/health
```
- [ ] Endpoint responds
- [ ] Shows database status
- [ ] Shows number of stored readings

### Manual Data Injection (Testing)
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/esp32" -Method POST -ContentType "application/json" -Body '{"stationId":"TEST","temperature":25.5,"humidity":60,"pressure":1013,"dewPoint":18,"windSpeed":5,"windDirection":180}'
```
- [ ] POST request succeeds
- [ ] Returns 201 Created status
- [ ] Data appears in dashboard
- [ ] Data stored in `data/sensor_readings.json`

---

## 📊 Dashboard Testing Checklist

### Main Dashboard
Navigate to: `http://localhost:3000/dashboard`

- [ ] Dashboard loads without errors
- [ ] Temperature display shows data
- [ ] Humidity display shows data
- [ ] Pressure display shows data
- [ ] Wind speed display shows data
- [ ] Wind direction compass appears
- [ ] Charts render correctly
- [ ] "Last updated" timestamp updates

### Real-Time Updates
- [ ] Open browser console (F12)
- [ ] See "🔄 Polling for sensor data..." every 2 seconds
- [ ] See "✅ Data refreshed" messages
- [ ] Dashboard updates automatically
- [ ] No polling errors in console

### Debug Page
Navigate to: `http://localhost:3000/debug`

- [ ] Debug page loads
- [ ] Shows ESP32 connection status
- [ ] Shows latest sensor data
- [ ] Shows data freshness indicator
- [ ] Shows JSON payload from ESP32
- [ ] Connection status indicator (green = connected)

### Reports Page
Navigate to: `http://localhost:3000/reports`

- [ ] Reports page loads
- [ ] Date picker works
- [ ] Runway selector works
- [ ] Report type selector works
- [ ] Format selector works (CSV/Excel/PDF/JSON)
- [ ] "Generate Daily Report" button works
- [ ] Report downloads successfully
- [ ] Downloaded file contains actual data (not mock data)

---

## 💾 Local Storage Checklist

### IndexedDB (Browser Storage)
Browser DevTools (F12) → Application tab → IndexedDB

- [ ] Database "awos_database" exists
- [ ] Database version is 1
- [ ] Object stores exist:
  - [ ] sensor_readings
  - [ ] users
  - [ ] sessions
  - [ ] stations
  - [ ] aggregates
- [ ] sensor_readings contains data entries
- [ ] Each reading has: timestamp, temperature, humidity, pressure, etc.

### Local JSON Files (Server Storage)
```cmd
dir "d:\profosional projects\awos-dashboard\data"
```
- [ ] `data` folder exists
- [ ] `sensor_readings.json` file exists
- [ ] File contains array of readings
- [ ] Latest reading appears at top of array
- [ ] File size grows as ESP32 sends data

### View JSON Data
```cmd
type "d:\profosional projects\awos-dashboard\data\sensor_readings.json"
```
- [ ] JSON is valid format
- [ ] Readings are sorted by timestamp (newest first)
- [ ] Each reading has all required fields

---

## 🔍 Data Flow Verification

### Complete Data Flow Test

1. **ESP32 Sends Data**
   - [ ] ESP32 Serial Monitor shows "📤 Sending data to server..."
   - [ ] Shows "✅ Data sent successfully"

2. **Server Receives Data**
   - [ ] Server console shows "📡 Received ESP32 data"
   - [ ] Shows temperature, humidity, pressure values
   - [ ] Shows "✅ ESP32 data stored successfully"

3. **Data Stored Locally**
   - [ ] Entry added to `data/sensor_readings.json`
   - [ ] File timestamp updates

4. **Browser Fetches Data**
   - [ ] Browser console shows "🔄 Polling for sensor data..."
   - [ ] Shows "✅ Data refreshed"
   - [ ] Network tab shows GET request to `/api/esp32`

5. **Dashboard Updates**
   - [ ] Temperature value updates
   - [ ] Humidity value updates
   - [ ] Pressure value updates
   - [ ] Wind data updates
   - [ ] "Last updated" time changes

### Latency Test
- [ ] ESP32 sends data (check Serial Monitor timestamp)
- [ ] Note time: ____________
- [ ] Dashboard updates (check browser timestamp)
- [ ] Note time: ____________
- [ ] Latency < 5 seconds (should be ~2 seconds due to polling)

---

## 🚨 Alert System Checklist

### Temperature Alerts
- [ ] Alert triggers when temp > 35°C
- [ ] Alert shows on dashboard
- [ ] Alert severity correctly displayed

### Wind Alerts
- [ ] Alert triggers when wind speed > 25 m/s
- [ ] Alert shows on dashboard
- [ ] High severity alerts highlighted in red

### Battery Alerts (if applicable)
- [ ] Alert triggers when battery < 20%
- [ ] Shows battery icon and percentage

### Pressure Alerts
- [ ] Alert triggers when pressure < 980 or > 1040 hPa
- [ ] Shows unusual pressure warning

---

## 📱 Mobile Access Checklist

### Access from Mobile Device
1. Connect mobile phone to **same WiFi network** as PC
2. Open browser on phone
3. Navigate to: `http://YOUR_PC_IP:3000`

- [ ] Login page loads on mobile
- [ ] Can login with credentials
- [ ] Dashboard responsive on mobile screen
- [ ] Charts display correctly
- [ ] Touch interactions work
- [ ] Data updates automatically
- [ ] No layout issues

### Access from Tablet
- [ ] Same steps as mobile
- [ ] Dashboard looks good on tablet
- [ ] All features accessible

---

## 🔄 Data Export Checklist

### CSV Export
- [ ] Navigate to Reports page
- [ ] Select date range
- [ ] Select CSV format
- [ ] Click "Generate"
- [ ] File downloads
- [ ] Open CSV in Excel/Notepad
- [ ] Contains actual sensor data
- [ ] Headers present
- [ ] Data properly formatted

### JSON Export
- [ ] Select JSON format
- [ ] Click "Generate"
- [ ] File downloads
- [ ] JSON is valid format
- [ ] Contains metadata and data array
- [ ] Can parse with JSON viewer

### PDF Export (HTML)
- [ ] Select PDF format
- [ ] File downloads as HTML
- [ ] Open in browser
- [ ] Looks like professional report
- [ ] Contains summary statistics
- [ ] Can print or save as PDF from browser

---

## ⚡ Performance Checklist

### Dashboard Load Time
- [ ] Dashboard loads < 3 seconds
- [ ] No loading spinners stuck
- [ ] Charts render smoothly

### Polling Performance
- [ ] Polling interval consistent (every 2 seconds)
- [ ] No polling errors
- [ ] CPU usage < 10% during polling
- [ ] Browser doesn't slow down

### ESP32 Performance
- [ ] Data sent every 10 seconds consistently
- [ ] No connection timeouts
- [ ] Serial Monitor shows no memory errors
- [ ] ESP32 doesn't reset unexpectedly

---

## 🛡️ Offline Mode Verification

### Complete Offline Test
1. **Disconnect PC from internet**
   - [ ] Unplug WAN cable from router (disconnect internet)
   - [ ] OR disable WiFi internet connection
   - [ ] Keep LAN/local network active

2. **Verify Server Still Works**
   - [ ] Dashboard still accessible via `http://localhost:3000`
   - [ ] Dashboard accessible via `http://PC_IP:3000`
   - [ ] Login still works
   - [ ] No internet-related errors

3. **Verify ESP32 Still Sends Data**
   - [ ] ESP32 Serial Monitor shows "✅ Connected to server"
   - [ ] Data transmission continues
   - [ ] No connection failures

4. **Verify Dashboard Still Updates**
   - [ ] Real-time data still updates
   - [ ] Charts still render
   - [ ] Alerts still work
   - [ ] Reports still generate

5. **100% Offline Confirmation**
   - [ ] Open browser console (F12)
   - [ ] Check Network tab
   - [ ] No external API calls
   - [ ] All requests to localhost or local IP
   - [ ] No CDN requests
   - [ ] No cloud service calls

---

## 🏁 Final System Checklist

### All Components Working
- [ ] ✅ PC running Next.js server (port 3000)
- [ ] ✅ Router providing local network (192.168.1.1)
- [ ] ✅ ESP32 connected via Ethernet (192.168.1.177)
- [ ] ✅ ESP32 sending data every 10 seconds
- [ ] ✅ Server receiving and storing data
- [ ] ✅ IndexedDB storing data in browser
- [ ] ✅ JSON file storing data on server
- [ ] ✅ Dashboard displaying real-time data
- [ ] ✅ Automatic updates every 2 seconds
- [ ] ✅ No internet connection required
- [ ] ✅ Accessible from multiple devices on local network

### Data Integrity
- [ ] ✅ No data loss during transmission
- [ ] ✅ Timestamps are correct
- [ ] ✅ Temperature values reasonable (10-50°C)
- [ ] ✅ Humidity values reasonable (0-100%)
- [ ] ✅ Pressure values reasonable (950-1050 hPa)
- [ ] ✅ Wind data within expected range

### Reliability
- [ ] ✅ System runs for 30+ minutes without errors
- [ ] ✅ No ESP32 resets or crashes
- [ ] ✅ No server crashes
- [ ] ✅ No browser memory leaks
- [ ] ✅ Network connection stable

---

## 📝 Post-Verification Actions

### If All Tests Pass
- [ ] Document your configuration (PC IP, ESP32 IP, etc.)
- [ ] Save ESP32 code backup
- [ ] Create restore point or backup of project
- [ ] Set up auto-start script (optional)
- [ ] Change default admin password
- [ ] Add additional users if needed
- [ ] Configure alert thresholds
- [ ] Set up regular data exports

### If Issues Found
- [ ] Review troubleshooting section in LOCAL_ETHERNET_SETUP.md
- [ ] Check Serial Monitor for ESP32 errors
- [ ] Check browser console for JavaScript errors
- [ ] Check server console for API errors
- [ ] Verify network configuration
- [ ] Ping test all devices
- [ ] Check firewall rules
- [ ] Verify wiring connections

---

## 🎉 Success Criteria

**Your AWOS Dashboard is fully operational if:**

✅ **Network**: All devices connected and pingable  
✅ **ESP32**: Sending data every 10 seconds without errors  
✅ **Server**: Running and storing data in IndexedDB + JSON  
✅ **Dashboard**: Displaying live data with 2-second updates  
✅ **Offline**: Works completely without internet  
✅ **Mobile**: Accessible from phones/tablets on local network  
✅ **Reports**: Generate and export actual sensor data  
✅ **Reliable**: Runs continuously without crashes  

---

**Congratulations! Your AWOS Dashboard is now running 100% offline! 🎊**

*Last verified: ________________*  
*Verified by: ________________*  
*System uptime: ________________*
