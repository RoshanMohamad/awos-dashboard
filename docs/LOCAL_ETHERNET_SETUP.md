# AWOS Dashboard - Complete Local Ethernet Setup Guide

## 🎯 Overview

This guide will help you set up your AWOS Dashboard to work **100% offline** with your ESP32 connected via Ethernet. No internet connection required!

**Network Topology:**
```
┌─────────────────────────────────────────────────┐
│  Local Network (No Internet Required)          │
│                                                 │
│  Router (192.168.1.1)                          │
│    ├─ Your PC (192.168.1.100)                  │
│    │  └─ Running Next.js Server :3000          │
│    │                                            │
│    └─ ESP32 (192.168.1.177)                    │
│       └─ W5500 Ethernet Module                 │
│       └─ Sensors (LoRa/Direct)                 │
│                                                 │
│  Data Flow: Sensors → ESP32 → PC → Browser     │
│  ❌ NO INTERNET CONNECTION NEEDED              │
└─────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### Hardware Required:
- ✅ **Windows PC** (or any computer running Node.js)
- ✅ **Router with Ethernet ports** (home router is fine)
- ✅ **ESP32 Development Board** (ESP32-DevKitC or similar)
- ✅ **W5500 Ethernet Module** (SPI-based)
- ✅ **2x Ethernet Cables** (Cat5e or better)
- ✅ **USB Cable** (for programming ESP32)
- ✅ **5V Power Supply** (for ESP32)

### Software Required:
- ✅ **Node.js 18+** → [Download](https://nodejs.org/)
- ✅ **Arduino IDE** → [Download](https://www.arduino.cc/en/software)
- ✅ **Git** (optional) → [Download](https://git-scm.com/)
- ✅ **VS Code** (optional but recommended)

---

## 🚀 Step-by-Step Setup

### STEP 1: Find Your PC's IP Address

**Windows:**
```cmd
# Open Command Prompt (Win+R, type "cmd", press Enter)
ipconfig

# Look for "Ethernet adapter" or "Wireless LAN adapter"
# Find the line: "IPv4 Address"
# Example: IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**Write down your IP address:** `192.168.1.___`

**Common IP ranges:**
- `192.168.1.x` (most common)
- `192.168.0.x`
- `10.0.0.x`

---

### STEP 2: Install Node.js and Project Dependencies

```cmd
# 1. Check if Node.js is installed
node --version
npm --version

# If not installed, download from https://nodejs.org/

# 2. Navigate to project folder
cd "d:\profosional projects\awos-dashboard"

# 3. Install dependencies
npm install

# This will take 2-5 minutes...
```

---

### STEP 3: Configure Environment Variables

The `.env.local` file is already created in the project root. **Update these values:**

```bash
# Edit: .env.local

# CRITICAL: Your PC's IP address (from Step 1)
NEXT_PUBLIC_PC_IP=192.168.1.100  # ← CHANGE THIS!

# CRITICAL: Choose a unique IP for ESP32 (not used by other devices)
NEXT_PUBLIC_ESP32_IP=192.168.1.177  # ← CHANGE IF NEEDED

# Your router's IP (usually .1)
NEXT_PUBLIC_GATEWAY_IP=192.168.1.1  # ← Usually this
```

**How to check what IPs are in use:**
```cmd
# Show all devices on network
arp -a

# Ping to check if IP is free
ping 192.168.1.177
# If "Request timed out" → IP is free ✅
# If "Reply from..." → IP is in use ❌ (choose different)
```

---

### STEP 4: Start the Next.js Server

```cmd
# In project folder
cd "d:\profosional projects\awos-dashboard"

# Start development server
npm run dev

# You should see:
# ✓ Ready on http://localhost:3000
# ✓ Starting...
# ○ Compiling...
```

**Keep this window open!** The server must be running for ESP32 to send data.

**Test the server:**
- Open browser → `http://localhost:3000`
- You should see login page

**Default login:**
- Email: `admin@local.awos`
- Password: `admin123`

---

### STEP 5: Configure Windows Firewall

**Allow port 3000 through firewall:**

**Option A: Command Line (Run as Administrator)**
```cmd
netsh advfirewall firewall add rule name="AWOS Dashboard Port 3000" dir=in action=allow protocol=TCP localport=3000
```

**Option B: GUI Method**
1. Open **Windows Defender Firewall**
2. Click **Advanced Settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → Next
5. Select **TCP** → Specific local ports: **3000** → Next
6. Select **Allow the connection** → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name: **AWOS Dashboard** → Finish

**Verify firewall rule:**
```cmd
netsh advfirewall firewall show rule name="AWOS Dashboard Port 3000"
```

---

### STEP 6: Wire the ESP32 Hardware

**ESP32 → W5500 Ethernet Module:**
```
ESP32 Pin → W5500 Pin
─────────────────────
GPIO 5    → CS (Chip Select)
GPIO 23   → MOSI
GPIO 19   → MISO
GPIO 18   → SCK (Clock)
GPIO 26   → RST (Reset) [optional]
3.3V      → VCC
GND       → GND
```

**ESP32 → OLED Display (Optional):**
```
ESP32 Pin → OLED Pin
───────────────────
GPIO 21   → SDA
GPIO 22   → SCL
3.3V      → VCC
GND       → GND
```

**⚠️ Important:**
- W5500 must use **3.3V** power (not 5V!)
- All GND pins must be connected together
- Use short wires (< 20cm) for SPI connections
- Double-check wiring before powering on

---

### STEP 7: Install Arduino IDE and Libraries

**7.1: Install Arduino IDE**
- Download from: https://www.arduino.cc/en/software
- Install with default settings

**7.2: Add ESP32 Board Support**
1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs" add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click OK
5. Go to **Tools → Board → Boards Manager**
6. Search for "**esp32**"
7. Install "**ESP32 by Espressif Systems**" (version 2.0.x or later)

**7.3: Install Required Libraries**

Go to **Sketch → Include Library → Manage Libraries**, search and install:

| Library Name | Publisher | Purpose |
|-------------|-----------|---------|
| **Ethernet** | Ethernet | W5500 Ethernet support |
| **ArduinoJson** | Benoit Blanchon | JSON data formatting |
| **Adafruit GFX Library** | Adafruit | OLED graphics |
| **Adafruit SSD1306** | Adafruit | OLED display driver |
| **SPI** | Built-in | SPI communication |

---

### STEP 8: Configure ESP32 Code

**8.1: Open the Arduino sketch:**
```
File → Open → d:\profosional projects\awos-dashboard\scripts\esp32-Local-Ethernet.ino
```

**8.2: Update Network Configuration (CRITICAL!):**

Find lines 36-40 and update:

```cpp
// Line 36: Your PC's IP address (from Step 1)
IPAddress serverIP(192, 168, 1, 100);   // ← CHANGE THIS!

// Line 37: ESP32's static IP (from .env.local)
IPAddress esp32IP(192, 168, 1, 177);    // ← CHANGE THIS!

// Line 38: Your router's gateway IP
IPAddress gateway(192, 168, 1, 1);      // ← Usually this

// Line 39: Subnet mask (usually don't change)
IPAddress subnet(255, 255, 255, 0);

// Line 40: DNS server (use router IP)
IPAddress dns(192, 168, 1, 1);          // ← Same as gateway
```

**8.3: Verify Port and Endpoint (usually don't change):**
```cpp
// Line 42-43
const int SERVER_PORT = 3000;            // Next.js server port
const char* API_ENDPOINT = "/api/esp32"; // API endpoint
```

---

### STEP 9: Upload Code to ESP32

**9.1: Connect ESP32 to PC via USB**

**9.2: Select Board:**
- **Tools → Board → ESP32 Arduino → ESP32 Dev Module**

**9.3: Select Port:**
- **Tools → Port → COM3** (or whichever COM port your ESP32 is on)
- If no ports show up, install CP210x or CH340 USB driver

**9.4: Configure Upload Settings:**
```
Upload Speed: 921600
Flash Frequency: 80MHz
Flash Mode: QIO
Flash Size: 4MB (32Mb)
Partition Scheme: Default 4MB with spiffs
Core Debug Level: None
```

**9.5: Click Upload (→) button**

Progress will show:
```
Connecting........_____....._____
Writing at 0x00001000... (10%)
...
Writing at 0x00100000... (100%)
Hard resetting via RTS pin...
```

**9.6: Open Serial Monitor:**
- **Tools → Serial Monitor**
- Set baud rate to: **115200**

---

### STEP 10: Connect Ethernet Cables

**Physical connections:**
```
Router Port 1 → [Ethernet Cable] → PC Network Port
Router Port 2 → [Ethernet Cable] → W5500 Ethernet Module
```

**⚠️ Important:**
- Ethernet cables must be securely plugged in
- W5500 LED should light up when cable is connected
- PC must be connected to same router (via Ethernet OR WiFi)

---

### STEP 11: Verify ESP32 Connection

**In ESP32 Serial Monitor, you should see:**

```
=== ESP32 AWOS Receiver (Local Ethernet) ===

📡 Initializing Ethernet...
✅ Ethernet connected!
   ESP32 IP: 192.168.1.177
   Server IP: 192.168.1.100:3000

✅ System Ready
Waiting for LoRa data...

📡 LoRa: T:28.5,H:65.2,P:1013.25,WS:5.5,WD:180

📤 Sending data to server...
✅ Connected to server
📊 Sent: {"stationId":"VCBI-ESP32","temperature":28.5,...}
📥 Response: HTTP/1.1 201 Created
✅ Data sent successfully
```

**If you see this, CONGRATULATIONS! 🎉 ESP32 is connected!**

---

### STEP 12: Verify Dashboard

**12.1: Open Dashboard**
- Browser → `http://localhost:3000`
- Login with: `admin@local.awos` / `admin123`

**12.2: Check Dashboard Page**
- Navigate to "Dashboard" tab
- You should see live data updating every 2 seconds

**12.3: Check Debug Page**
- Navigate to `http://localhost:3000/debug`
- Shows raw ESP32 data and connection status

**12.4: Check API Endpoint**
- Navigate to `http://localhost:3000/api/esp32`
- Should return JSON with latest sensor data

---

## 🔧 Troubleshooting

### Problem: "Ethernet cable not connected"

**ESP32 Serial Monitor shows:**
```
❌ Ethernet cable not connected!
```

**Solutions:**
1. ✅ Check Ethernet cable is fully plugged into W5500
2. ✅ Check cable is plugged into router
3. ✅ Try different Ethernet cable
4. ✅ Check W5500 module wiring (SPI pins)
5. ✅ Verify 3.3V power to W5500 module
6. ✅ Check W5500 LED indicator (should be on)

---

### Problem: "Connection to server failed"

**ESP32 Serial Monitor shows:**
```
❌ Connection to server failed!
```

**Solutions:**

**Step 1: Verify PC IP address**
```cmd
# Run on PC
ipconfig

# Compare with serverIP in ESP32 code
# Must match exactly!
```

**Step 2: Verify server is running**
```cmd
# Check if port 3000 is open
netstat -an | findstr :3000

# Should show:
# TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING
```

**Step 3: Test server from PC**
```cmd
# Should return JSON data or 404
curl http://localhost:3000/api/esp32
```

**Step 4: Check firewall**
```cmd
# Verify firewall rule exists
netsh advfirewall firewall show rule name="AWOS Dashboard Port 3000"
```

**Step 5: Ping test**
```cmd
# From PC, ping ESP32
ping 192.168.1.177

# From ESP32 (not possible directly, but check router)
# Login to router web interface
# Check if ESP32 (192.168.1.177) appears in connected devices
```

---

### Problem: "No data in dashboard"

**Dashboard shows "No data available"**

**Solutions:**

**Step 1: Check ESP32 is sending data**
- ESP32 Serial Monitor should show "✅ Data sent successfully" every 10 seconds

**Step 2: Check API endpoint**
```cmd
# Open browser
http://localhost:3000/api/esp32

# Should return:
{
  "success": true,
  "data": {
    "temperature": 28.5,
    ...
  }
}
```

**Step 3: Check browser console**
- Press F12 in browser
- Go to "Console" tab
- Look for errors
- Should see: "🔄 Polling for sensor data..." every 2 seconds

**Step 4: Check local storage**
- Press F12 in browser
- Go to "Application" tab
- Expand "IndexedDB" → "awos_database"
- Check "sensor_readings" store
- Should have data entries

**Step 5: Clear browser cache**
- Press Ctrl+Shift+Delete
- Clear "Cached images and files"
- Reload page (Ctrl+F5)

---

### Problem: "Port 3000 already in use"

**Error when running `npm run dev`:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

**Option 1: Kill process using port 3000**
```cmd
# Find process ID
netstat -ano | findstr :3000

# Output example:
# TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    1234

# Kill process (replace 1234 with actual PID)
taskkill /PID 1234 /F
```

**Option 2: Use different port**
```cmd
# Run on port 3001 instead
npm run dev -- -p 3001

# Then update ESP32 code line 42:
const int SERVER_PORT = 3001;
```

---

### Problem: "ESP32 not detected by Arduino IDE"

**No COM port shows up in Tools → Port**

**Solutions:**

1. ✅ **Install USB driver:**
   - CP210x: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
   - CH340: http://www.wch-ic.com/downloads/CH341SER_EXE.html

2. ✅ **Check USB cable:**
   - Use data cable (not charge-only cable)
   - Try different USB port on PC
   - Try different USB cable

3. ✅ **Check Device Manager:**
   - Win+X → Device Manager
   - Look under "Ports (COM & LPT)"
   - ESP32 should appear as "Silicon Labs CP210x" or "USB-SERIAL CH340"

4. ✅ **Press and hold BOOT button** on ESP32 while uploading

---

### Problem: "Data updates are slow"

**Dashboard takes long time to show new data**

**Solutions:**

**Speed up polling interval:**

Edit `hooks/use-local-realtime-data.ts` line 161:
```typescript
// Change from 2000ms to 1000ms (1 second)
pollingRef.current = setInterval(() => {
    refreshData();
}, 1000);  // ← Faster updates
```

**Speed up ESP32 send interval:**

Edit `scripts/esp32-Local-Ethernet.ino` line 80:
```cpp
// Change from 10000ms to 5000ms (5 seconds)
const unsigned long DATA_SEND_INTERVAL = 5000;
```

---

## 📊 Testing & Verification

### Test 1: Network Connectivity

```cmd
# From PC, test connectivity
ping 192.168.1.1      # Router (should reply)
ping 192.168.1.177    # ESP32 (should reply after Ethernet connected)

# Test local server
curl http://localhost:3000

# Test from ESP32 IP perspective (use browser on PC)
http://192.168.1.100:3000  # Your PC from network
```

### Test 2: Manual Data Injection

**Test if API accepts data without ESP32:**

```powershell
# Windows PowerShell
$body = @{
    stationId = "TEST"
    temperature = 25.5
    humidity = 60.0
    pressure = 1013.25
    dewPoint = 18.0
    windSpeed = 5.0
    windDirection = 180
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/esp32" -Method POST -Body $body -ContentType "application/json"
```

If successful, data should appear in dashboard!

### Test 3: Database Inspection

**Check IndexedDB in browser:**

1. Open browser → Press F12
2. Go to "Application" tab
3. Expand "IndexedDB" → "awos_database"
4. Click "sensor_readings" store
5. You should see stored data entries

**Check local JSON file:**

```cmd
# Navigate to project folder
cd "d:\profosional projects\awos-dashboard"

# Check if data folder exists
dir data

# View JSON file contents
type data\sensor_readings.json
```

### Test 4: Check All API Endpoints

```cmd
# Get latest ESP32 data
curl http://localhost:3000/api/esp32

# Get all readings
curl http://localhost:3000/api/readings

# Check database health
curl http://localhost:3000/api/db/health

# Real-time stream (Server-Sent Events)
curl http://localhost:3000/api/realtime
```

---

## 🎯 Access from Other Devices

Once everything is working, you can access the dashboard from any device on your local network:

**From mobile phone (connected to same WiFi):**
```
http://192.168.1.100:3000
```

**From tablet:**
```
http://192.168.1.100:3000
```

**From another PC on network:**
```
http://192.168.1.100:3000
```

**⚠️ Replace `192.168.1.100` with YOUR PC's actual IP address!**

---

## 🚀 Auto-Start on Windows Boot

**Create a batch file to start server automatically:**

See `start-awos-server.bat` in project root.

**To auto-start on Windows boot:**
1. Press Win+R
2. Type: `shell:startup`
3. Press Enter
4. Copy `start-awos-server.bat` to this folder

Server will start automatically when Windows boots!

---

## 📈 Performance Optimization

### For Best Performance:

**1. Use Ethernet for PC (not WiFi)**
- Faster and more reliable

**2. Reduce polling interval**
- Default: 2 seconds
- Can reduce to 1 second for faster updates

**3. Use production build**
```cmd
npm run build
npm run start
```

**4. Close unnecessary browser tabs**
- IndexedDB operations are faster with fewer tabs

**5. Keep data retention reasonable**
- Default: 90 days
- 10,000 readings max in JSON file

---

## 🎉 Success Checklist

- ✅ PC IP address identified
- ✅ Node.js installed and dependencies installed
- ✅ `.env.local` configured with correct IPs
- ✅ Next.js server running on port 3000
- ✅ Windows firewall configured
- ✅ ESP32 hardware wired correctly
- ✅ Arduino IDE installed with libraries
- ✅ ESP32 code configured with correct IPs
- ✅ ESP32 code uploaded successfully
- ✅ Ethernet cables connected
- ✅ ESP32 Serial Monitor shows "✅ Ethernet connected"
- ✅ ESP32 Serial Monitor shows "✅ Data sent successfully"
- ✅ Dashboard login works
- ✅ Dashboard shows live data
- ✅ Debug page shows connection status
- ✅ API endpoint returns data
- ✅ IndexedDB has stored readings

**If all items are checked, your system is fully operational! 🎊**

---

## 📞 Need Help?

If you encounter issues:

1. **Check Serial Monitor** - Most issues show up here
2. **Check Browser Console (F12)** - JavaScript errors appear here
3. **Check server terminal** - API errors show here
4. **Review this guide** - Step-by-step troubleshooting included
5. **Check GitHub Issues** - Someone may have had same problem

---

**Happy Local Weather Monitoring! 🌤️📡**

*Last updated: October 19, 2025*
