# AWOS Dashboard - Local Edition

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Offline First](https://img.shields.io/badge/Offline-First-green.svg)](https://github.com/RoshanMohamad/awos-dashboard)
[![No Internet Required](https://img.shields.io/badge/Internet-Not%20Required-blue.svg)](https://github.com/RoshanMohamad/awos-dashboard)

A comprehensive **Automated Weather Observation System (AWOS)** dashboard built for **100% offline operation**. This full-stack application runs entirely on your local network without any internet connection, collecting, processing, and visualizing weather data from ESP32 sensors via Ethernet.

**🔒 Fully Local**: No cloud services, no internet required - complete data privacy and offline operation.  
**⚡ Real-Time**: ESP32 sends data every 10 seconds via Ethernet, dashboard updates every 2 seconds.  
**💾 Local Storage**: All data stored in browser IndexedDB and local JSON files.

## ✨ Features

### 🔒 Local-First Architecture

- **100% Offline Operation**: No internet connection required - ever!
- **Local Network Only**: ESP32 ↔ PC communication via Ethernet (192.168.1.x subnet)
- **IndexedDB Storage**: All data stored locally in browser database
- **Local Authentication**: SHA-256 password hashing, no OAuth, no cloud auth
- **Privacy First**: All your weather data stays on your local machine

### 📡 Real-Time Data Collection

- **ESP32 Ethernet**: W5500 module with static IP configuration
- **HTTP POST**: ESP32 sends data every 10 seconds to local server
- **Automatic Polling**: Dashboard updates every 2 seconds
- **Live Monitoring**: Real-time temperature, humidity, pressure, wind data
- **LoRa Support**: Built-in support for LoRa sensor communication

### 📊 Dashboard Features

- **Real-Time Dashboard**: Live weather monitoring with interactive charts
- **Historical Analysis**: Trend analysis and data visualization from local database
- **Multi-Station Support**: Handle multiple weather stations with unique IDs
- **Data Quality Management**: Sensor health monitoring and data validation
- **Export Functionality**: Export data to CSV/JSON from local storage

### 💻 User Interface

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Theme switching support
- **Interactive Charts**: Recharts-powered visualizations
- **Real-time Updates**: Live polling every 2 seconds
- **Alert System**: Automatic alerts for extreme weather conditions

### 🛠️ Technology Stack

#### Frontend
- **Next.js 15**: App Router with TypeScript
- **IndexedDB**: Browser-based local database (no cloud)
- **API Routes**: RESTful endpoints for local data ingestion
- **Local Storage**: Session tokens and user preferences

#### Backend
- **Database**: IndexedDB (browser) + JSON files (server-side backup)
- **Authentication**: Local SHA-256 password hashing
- **Real-time**: Polling-based updates (every 2 seconds)
- **Validation**: Zod schemas for data validation
- **Storage**: Dual-layer (browser IndexedDB + local JSON files)

#### IoT Integration
- **Protocol**: HTTP POST over Ethernet (no WiFi, no internet)
- **Hardware**: ESP32 with W5500 Ethernet module
- **Communication**: LoRa receiver for sensor data
- **Display**: OLED SSD1306 for status monitoring
- **Sensors**: Temperature, humidity, pressure, wind speed/direction

## 🚀 Quick Start (Local-Only Setup)

### Prerequisites

- **Node.js 18+** (for running the Next.js server)
- **npm** or **pnpm** or **yarn**
- **ESP32 with W5500 Ethernet module** (for hardware integration)
- **Local network setup** (Router with Ethernet ports)
- **No internet required!** ❌🌐

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/RoshanMohamad/awos-dashboard.git
cd awos-dashboard

# Install dependencies
npm install
# or
pnpm install
```

### 2. Find Your PC IP Address

```cmd
# Windows
ipconfig

# Look for "IPv4 Address" under your network adapter
# Example: 192.168.1.100
```

**Write down your PC's IP address - you'll need it for ESP32 configuration!**

### 3. Start the Local Server

```bash
# Start development server
npm run dev
# or
pnpm dev

# Server will start on http://localhost:3000
# Also accessible via your local IP: http://192.168.1.100:3000
```

### 4. Default Login Credentials

Open your browser and navigate to:
- **URL**: `http://localhost:3000` or `http://YOUR_PC_IP:3000`
- **Email**: `admin@local.awos`
- **Password**: `admin123`

**⚠️ Change the default password after first login!**

### 5. Configure ESP32 (See ESP32 Setup section below)

The ESP32 code is in `scripts/esp32-Local-Ethernet.ino`. You need to:
1. Set your PC's IP address (from step 2)
2. Set ESP32's static IP
3. Set your router's gateway IP
4. Upload to ESP32 via Arduino IDE

### 6. Verify Connection

1. **Check ESP32 Serial Monitor**: Should show "Connected to server"
2. **Check Dashboard**: Go to http://localhost:3000/dashboard
3. **Check Debug Panel**: Go to http://localhost:3000/debug
4. **Data should appear every 10 seconds!** ✅

### 🎯 Network Configuration Summary

```
┌─────────────────────────────────────────────────┐
│  Router (192.168.1.1)                           │
│    ├─ ESP32 (192.168.1.177) - via Ethernet      │
│    └─ PC (192.168.1.100) - via Ethernet/WiFi    │
│                                                  │
│  NO INTERNET CONNECTION REQUIRED! ❌🌐          │
└─────────────────────────────────────────────────┘
```

## 📡 ESP32 Hardware Setup

### Required Hardware

- **ESP32 Development Board** (any variant)
- **W5500 Ethernet Module** (for wired network connection)
- **OLED Display** - SSD1306 128x64 (optional, for status display)
- **LoRa Module** - For receiving sensor data (optional)
- **Rotary Encoder** - For UI navigation (optional)
- **Ethernet Cable** - Cat5e or better
- **5V Power Supply** - For ESP32

### Wiring Diagram

```
ESP32 → W5500 Ethernet Module
  GPIO 5  → CS (Chip Select)
  GPIO 23 → MOSI
  GPIO 19 → MISO
  GPIO 18 → SCK (Clock)
  GPIO 26 → RST (Reset, optional)
  3.3V    → VCC
  GND     → GND

ESP32 → OLED Display (I2C)
  GPIO 21 → SDA
  GPIO 22 → SCL
  3.3V    → VCC
  GND     → GND

ESP32 → Rotary Encoder (optional)
  GPIO 13 → CLK
  GPIO 14 → DT
  GPIO 25 → SW (Button)
```

### Arduino IDE Setup

1. **Install Arduino IDE** (version 1.8.x or 2.x)

2. **Add ESP32 Board Support**:
   - Go to File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Boards Manager
   - Search "esp32" and install "ESP32 by Espressif Systems"

3. **Install Required Libraries**:
   - Sketch → Include Library → Manage Libraries
   - Install the following:
     - **Ethernet** (by Ethernet)
     - **ArduinoJson** (by Benoit Blanchon)
     - **Adafruit GFX Library**
     - **Adafruit SSD1306**
     - **SPI** (built-in)

### ESP32 Code Configuration

Open `scripts/esp32-Local-Ethernet.ino` and update these lines:

```cpp
// ⚠️ CRITICAL: Change these IP addresses!

// Line 36: Your PC's IP address (from ipconfig)
IPAddress serverIP(192, 168, 1, 100);   // ← CHANGE THIS!

// Line 37: ESP32's static IP (unique on your network)
IPAddress esp32IP(192, 168, 1, 177);    // ← CHANGE THIS!

// Line 38: Your router's IP address
IPAddress gateway(192, 168, 1, 1);      // ← Usually this

// Port and endpoint (usually don't change)
const int SERVER_PORT = 3000;
const char* API_ENDPOINT = "/api/esp32";
```

### Upload to ESP32

1. **Connect ESP32** to PC via USB
2. **Select Board**: Tools → Board → ESP32 Dev Module
3. **Select Port**: Tools → Port → (your ESP32 port)
4. **Upload**: Click Upload button (→)
5. **Open Serial Monitor**: Tools → Serial Monitor (115200 baud)

### Verify Connection

You should see in Serial Monitor:

```
=== ESP32 AWOS Receiver (Local Ethernet) ===
📡 Initializing Ethernet...
✅ Ethernet connected!
   ESP32 IP: 192.168.1.177
   Server IP: 192.168.1.100:3000
✅ System Ready
Waiting for LoRa data...

📤 Sending data to server...
✅ Connected to server
📊 Sent: {"stationId":"VCBI-ESP32",...}
📥 Response: HTTP/1.1 201 Created
✅ Data sent successfully
```

### Troubleshooting ESP32

**Problem**: "Ethernet cable not connected"
- ✅ Check Ethernet cable is plugged in
- ✅ Check W5500 module wiring
- ✅ Check power to W5500 module

**Problem**: "Connection to server failed"
- ✅ Verify PC IP address is correct (run `ipconfig`)
- ✅ Verify PC firewall allows port 3000
- ✅ Verify Next.js server is running
- ✅ Ping PC from another device: `ping 192.168.1.100`

**Problem**: "Connected to server" but no data in dashboard
- ✅ Check ESP32 IP is on same subnet as PC (192.168.1.x)
- ✅ Check server IP in code matches your PC IP
- ✅ Check browser console for errors (F12)
- ✅ Check `/api/esp32` endpoint: http://localhost:3000/api/esp32

## 🔧 Configuration

### Network Configuration (Most Important!)

**For ESP32** (`scripts/esp32-Local-Ethernet.ino` lines 36-40):

```cpp
// Find your PC IP: Run 'ipconfig' in Windows Command Prompt
IPAddress serverIP(192, 168, 1, 100);   // ← Your PC's IP address
IPAddress esp32IP(192, 168, 1, 177);    // ← ESP32's static IP (make unique)
IPAddress gateway(192, 168, 1, 1);      // ← Your router's IP
IPAddress subnet(255, 255, 255, 0);     // ← Usually this
IPAddress dns(192, 168, 1, 1);          // ← Usually same as gateway
```

**For Multiple ESP32 Devices**:

```cpp
// Device 1
IPAddress serverIP(192, 168, 1, 100);
IPAddress esp32IP(192, 168, 1, 177);

// Device 2
IPAddress serverIP(192, 168, 1, 100);   // Same server
IPAddress esp32IP(192, 168, 1, 178);    // Different IP!

// Device 3
IPAddress serverIP(192, 168, 1, 100);   // Same server
IPAddress esp32IP(192, 168, 1, 179);    // Different IP!
```

### Server Configuration

**Default Port**: 3000 (Next.js development server)

To change port:
```bash
# In package.json, modify "dev" script:
"dev": "next dev -p 3001"  # Use port 3001 instead
```

### Authentication Configuration

**Default Credentials**:
- Email: `admin@local.awos`
- Password: `admin123`

**To change default password**:
Edit `lib/local-auth.ts` line 51:
```typescript
const defaultPassword = 'your_new_password'; // Change this!
```

### Database Configuration

**IndexedDB** (browser-based):
- Database Name: `awos_database`
- Version: 1
- Stores: `sensor_readings`, `users`, `sessions`, `stations`, `aggregates`

**JSON Backup** (server-side):
- Location: `data/sensor_readings.json`
- Max records: 10,000
- Auto-cleanup: Oldest records removed first

### Data Collection Intervals

**ESP32 Settings** (`esp32-Local-Ethernet.ino` lines 79-81):

```cpp
const unsigned long OLED_UPDATE_INTERVAL = 1000;   // OLED updates: 1 second
const unsigned long DATA_SEND_INTERVAL = 10000;    // Send to server: 10 seconds
const unsigned long LORA_TIMEOUT = 60000;          // LoRa timeout: 1 minute
```

**Dashboard Settings** (`hooks/use-local-realtime-data.ts` line 161):

```typescript
// Dashboard polls every 2 seconds for real-time updates
pollingRef.current = setInterval(() => {
    refreshData();
}, 2000);  // Change to 5000 for 5-second updates
```

## 📊 API Documentation (Local-Only)

### ESP32 Data Ingestion

**POST** `/api/esp32`

ESP32 sends sensor data to this endpoint every 10 seconds:

```json
{
  "stationId": "VCBI-ESP32",
  "temperature": 28.5,
  "humidity": 65.2,
  "pressure": 1013.2,
  "dewPoint": 18.3,
  "windSpeed": 12.5,
  "windDirection": 180,
  "lat": 6.7877,
  "lng": 79.8840
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "id": "reading_1729234567890_abc123",
    "timestamp": "2025-10-18T12:00:00.000Z",
    "station_id": "VCBI-ESP32",
    "temperature": 28.5,
    ...
  },
  "message": "ESP32 data received and stored successfully",
  "responseTime": "15ms"
}
```

### Data Retrieval (Local)

**GET** `/api/esp32`

Get latest ESP32 data:

```json
{
  "success": true,
  "data": {
    "temperature": 28.5,
    "humidity": 65.2,
    "timestamp": "2025-10-18T12:00:00.000Z",
    "dataAge": 5000,
    "isDataFresh": true,
    "connectionStatus": "connected"
  }
}
```

**GET** `/api/readings`

Query historical data from local IndexedDB:

Query parameters:
- `stationId`: Filter by station (optional)
- `startTime`: Start timestamp ISO format (optional)
- `endTime`: End timestamp ISO format (optional)
- `limit`: Max records (default: 100)
- `offset`: Pagination offset (default: 0)

**GET** `/api/realtime`

Server-Sent Events for real-time updates (polls every 5 seconds):

```javascript
const eventSource = new EventSource("/api/realtime");
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("New reading:", data);
};
```

### Health & Monitoring

**GET** `/api/db/health`

Check local database health:

```json
{
  "status": "healthy",
  "database": {
    "type": "IndexedDB",
    "name": "awos_database",
    "version": 1
  },
  "stores": {
    "sensor_readings": 150,
    "users": 1,
    "sessions": 1,
    "stations": 1,
    "aggregates": 0
  }
}
```

**GET** `/api/aggregates`

Get aggregated statistics from local data:

```json
{
  "count": 100,
  "avgTemperature": 27.5,
  "avgHumidity": 65.0,
  "avgPressure": 1013.2,
  "avgWindSpeed": 8.5,
  "maxWindGust": 15.0
}
```

## 🚀 Deployment (Local Network)

### Option 1: Development Server (Recommended for Local Use)

**Always running on your PC:**

```bash
# Start the server
npm run dev

# Server runs on:
# - http://localhost:3000 (from same PC)
# - http://192.168.1.100:3000 (from other devices on network)
```

**Auto-start on Windows boot:**

1. Create `start-awos.bat`:
   ```batch
   @echo off
   cd /d "d:\profosional projects\awos-dashboard"
   start cmd /k npm run dev
   ```

2. Press `Win+R`, type `shell:startup`, press Enter

3. Copy `start-awos.bat` to the Startup folder

### Option 2: Production Build (Faster)

```bash
# Build for production
npm run build

# Start production server
npm run start

# Runs on port 3000
```

### Option 3: Run as Windows Service

Use **NSSM** (Non-Sucking Service Manager):

```powershell
# Download NSSM from https://nssm.cc/download

# Install as service
nssm install AWOSDashboard "C:\Program Files\nodejs\npm.cmd" "run start"
nssm set AWOSDashboard AppDirectory "d:\profosional projects\awos-dashboard"
nssm start AWOSDashboard

# Service will auto-start on Windows boot
```

### Option 4: Docker Container (Advanced)

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t awos-dashboard .
docker run -d -p 3000:3000 --name awos awos-dashboard
```

### Access from Other Devices

Once server is running, access from:

- **Same PC**: `http://localhost:3000`
- **Mobile phone** (on same network): `http://192.168.1.100:3000`
- **Tablet**: `http://192.168.1.100:3000`
- **Another PC**: `http://192.168.1.100:3000`

**⚠️ Important**: Replace `192.168.1.100` with your actual PC IP address!

### Firewall Configuration

**Windows Firewall** may block port 3000. To allow:

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="AWOS Dashboard" dir=in action=allow protocol=TCP localport=3000
```

Or manually:
1. Open Windows Defender Firewall
2. Advanced Settings → Inbound Rules → New Rule
3. Port → TCP → Specific local ports: 3000
4. Allow the connection → Apply to all profiles
5. Name: "AWOS Dashboard"

## 🧪 Testing & Verification

### Test ESP32 Connection

```bash
# Windows Command Prompt
curl http://localhost:3000/api/esp32

# Should return latest ESP32 data or 404 if no data yet
```

### Test Real-Time Updates

1. Open browser console (F12)
2. Navigate to http://localhost:3000/dashboard
3. You should see logs every 2 seconds:
   ```
   🔄 Polling for sensor data...
   ✅ Data refreshed: {temp: 28.5, humidity: 65, pressure: 1013}
   ```

### Test Local Database

Open browser console (F12) and run:

```javascript
// Open IndexedDB
const request = indexedDB.open('awos_database', 1);

request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction('sensor_readings', 'readonly');
  const store = tx.objectStore('sensor_readings');
  const getAllRequest = store.getAll();
  
  getAllRequest.onsuccess = () => {
    console.log('Total readings:', getAllRequest.result.length);
    console.log('Latest:', getAllRequest.result[0]);
  };
};
```

### Verify Network Connectivity

```cmd
# From Windows Command Prompt

# 1. Check your PC IP
ipconfig

# 2. Ping your router
ping 192.168.1.1

# 3. Check if Next.js server is running
netstat -an | findstr :3000

# Should show: TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING
```

### Test Data Export

1. Navigate to http://localhost:3000/forecast
2. Click "Export CSV" or "Export JSON"
3. File should download with local data

### Manual Data Injection (Testing)

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/esp32" -Method POST -ContentType "application/json" -Body '{"stationId":"TEST","temperature":25.5,"humidity":60,"pressure":1013,"dewPoint":18,"windSpeed":5,"windDirection":180}'

# Should see data appear in dashboard
```

## 📚 Additional Documentation

- **[Local Setup Guide](docs/LOCAL_SETUP_GUIDE.md)** - Detailed local setup instructions
- **[ESP32 Setup Guide](docs/ESP32_SETUP_GUIDE.md)** - Complete ESP32 hardware setup
- **[Verification Guide](docs/COMPLETE_LOCAL_VERIFICATION.md)** - Test all features
- **[Model Migration](docs/LOCAL_MODEL_MIGRATION.md)** - Database model documentation

## 🔧 Troubleshooting

### ESP32 Not Connecting

**Symptom**: Serial monitor shows "Ethernet cable not connected"

**Solutions**:
- ✅ Check Ethernet cable is properly plugged in
- ✅ Verify W5500 module wiring (SPI pins)
- ✅ Check 3.3V power to W5500 module
- ✅ Try different Ethernet cable

### ESP32 Connected But No Data

**Symptom**: "Connected to server" but dashboard shows no data

**Solutions**:
- ✅ Verify `serverIP` in ESP32 code matches your PC IP
- ✅ Run `ipconfig` to confirm PC IP hasn't changed
- ✅ Check Windows Firewall allows port 3000
- ✅ Verify Next.js server is running (`npm run dev`)
- ✅ Check browser console for errors (F12)

### Dashboard Not Updating

**Symptom**: Dashboard shows old data or "No data available"

**Solutions**:
- ✅ Check browser console (F12) for polling logs
- ✅ Navigate to http://localhost:3000/debug to see raw data
- ✅ Verify IndexedDB has data (browser DevTools → Application → IndexedDB)
- ✅ Clear browser cache and reload (Ctrl+Shift+R)

### Login Not Working

**Symptom**: "Invalid credentials" error

**Solutions**:
- ✅ Use default credentials: `admin@local.awos` / `admin123`
- ✅ Check browser console (F12) for detailed error messages
- ✅ Clear browser data and retry
- ✅ Verify IndexedDB is enabled in browser

### Port 3000 Already in Use

**Symptom**: "Port 3000 is already in use"

**Solutions**:
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

## 🤝 Contributing

We welcome contributions! This project is specifically designed for **offline, local-network operation**.

Please ensure:
- ✅ No cloud dependencies
- ✅ No internet-required features
- ✅ All data stored locally (IndexedDB or JSON files)
- ✅ Works on local network (192.168.x.x)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **shadcn/ui** for the beautiful component library
- **Tailwind CSS** for the utility-first CSS framework
- **Arduino/ESP32 Community** for IoT development resources
- **IndexedDB API** for local browser storage

## 📞 Support

If you have questions or need help:
- **Documentation**: Check the `docs/` directory for comprehensive guides
- **Issues**: Open a GitHub issue with detailed description
- **ESP32 Setup**: See `scripts/esp32-Local-Ethernet.ino` for hardware integration
- **Network Issues**: Verify all devices are on same subnet (192.168.1.x)

## 🎯 Key Differences from Cloud Version

This is the **LOCAL-ONLY** edition:

| Feature | Cloud Version | Local Edition |
|---------|--------------|---------------|
| Database | Supabase (PostgreSQL) | IndexedDB + JSON files |
| Authentication | Supabase Auth | Local SHA-256 |
| Real-time | Supabase Realtime | Polling (2 seconds) |
| ESP32 Connection | WiFi + Internet | Ethernet (Local only) |
| Data Storage | Cloud servers | Your PC only |
| Internet Required | ✅ Yes | ❌ No |
| Data Privacy | Shared with cloud | 100% local |
| Monthly Cost | $0-25+ | $0 (free forever) |

## 🌟 Why Local-Only?

- **🔒 Complete Privacy**: Your weather data never leaves your network
- **⚡ Faster**: No internet latency, instant local responses
- **💰 Free**: No cloud subscription fees
- **🔌 Offline**: Works without internet - perfect for remote locations
- **🛡️ Secure**: No external access, completely isolated
- **📊 Full Control**: All data on your machine, export anytime

---

**Happy Local Weather Monitoring! 🌤️**

*Built with ❤️ for offline-first weather observation*
