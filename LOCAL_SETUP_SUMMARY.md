# 🌤️ AWOS Dashboard - Complete Local Setup Summary

## ✅ What I've Set Up For You

Your AWOS Dashboard is now configured for **100% offline operation** with ESP32 Ethernet connectivity. Here's everything that's been prepared:

---

## 📁 New Files Created

### 1. **`.env.local`** - Network Configuration
**Location:** Project root  
**Purpose:** Stores your network settings (PC IP, ESP32 IP, Gateway, etc.)

**What to do:**
- Open the file
- Update `NEXT_PUBLIC_PC_IP` with your PC's IP address
- Update `NEXT_PUBLIC_ESP32_IP` with desired ESP32 IP
- Update `NEXT_PUBLIC_GATEWAY_IP` with your router IP

**How to find your IP:**
```cmd
ipconfig
```
Look for "IPv4 Address"

---

### 2. **`start-awos-server.bat`** - Easy Server Startup
**Location:** Project root  
**Purpose:** One-click server startup with network info

**How to use:**
- Double-click the file
- Server starts automatically
- Shows your network configuration
- Displays access URLs

**To auto-start on Windows boot:**
1. Press `Win+R`
2. Type `shell:startup`
3. Copy `start-awos-server.bat` to that folder

---

### 3. **`scripts/init-local-database.js`** - Database Initialization
**Location:** `scripts/` folder  
**Purpose:** Creates default user and station

**How to use:**
```cmd
npm run init-db
```

**What it creates:**
- Default admin user: `admin@local.awos` / `admin123`
- Default station: `VCBI-ESP32`
- Empty sensor readings file

---

### 4. **`scripts/detect-network-config.js`** - Network Auto-Detection
**Location:** `scripts/` folder  
**Purpose:** Automatically detects network and generates config

**How to use:**
```cmd
npm run detect-network
```

**What it does:**
- Detects your PC IP address
- Suggests ESP32 IP address
- Generates Arduino code configuration
- Creates `.env.local` template
- Shows testing commands

---

### 5. **`docs/LOCAL_ETHERNET_SETUP.md`** - Complete Setup Guide
**Location:** `docs/` folder  
**Purpose:** Step-by-step setup instructions

**What's included:**
- Hardware wiring diagrams
- Software installation steps
- Network configuration
- ESP32 code setup
- Arduino IDE configuration
- Troubleshooting guide
- Testing procedures

---

### 6. **`docs/VERIFICATION_CHECKLIST.md`** - Testing Checklist
**Location:** `docs/` folder  
**Purpose:** Comprehensive testing and verification

**What it covers:**
- Pre-installation checklist
- Network configuration verification
- ESP32 hardware testing
- API endpoint testing
- Dashboard functionality
- Offline mode verification
- Performance testing
- Mobile access testing

---

### 7. **`QUICK_START_LOCAL.md`** - Quick Reference
**Location:** Project root  
**Purpose:** Fast setup guide

**What's included:**
- 5-step quick setup
- Common commands
- Quick troubleshooting
- System architecture diagram
- Access URLs reference

---

## 🚀 Quick Start Steps

### 1. Install Dependencies
```cmd
cd "d:\profosional projects\awos-dashboard"
npm install
```

### 2. Detect Network Configuration
```cmd
npm run detect-network
```
This auto-detects your network and shows configuration.

### 3. Update Configuration Files

**Edit `.env.local`:**
```bash
NEXT_PUBLIC_PC_IP=192.168.1.100      # Your PC IP (from step 2)
NEXT_PUBLIC_ESP32_IP=192.168.1.177   # Choose unique IP
NEXT_PUBLIC_GATEWAY_IP=192.168.1.1   # Your router IP
```

**Edit `scripts/esp32-Local-Ethernet.ino` (lines 36-40):**
```cpp
IPAddress serverIP(192, 168, 1, 100);   // Your PC IP
IPAddress esp32IP(192, 168, 1, 177);    // ESP32 IP
IPAddress gateway(192, 168, 1, 1);      // Router IP
```

### 4. Configure Firewall
```cmd
netsh advfirewall firewall add rule name="AWOS Dashboard Port 3000" dir=in action=allow protocol=TCP localport=3000
```

### 5. Upload ESP32 Code
1. Open Arduino IDE
2. Open `scripts/esp32-Local-Ethernet.ino`
3. Select Board: ESP32 Dev Module
4. Select Port: COM3 (or your port)
5. Click Upload

### 6. Connect Hardware
```
Router Port 1 → [Ethernet Cable] → PC
Router Port 2 → [Ethernet Cable] → W5500 Module
```

### 7. Start Server
```cmd
# Option A: Batch file (recommended)
start-awos-server.bat

# Option B: Manual
npm run dev
```

### 8. Access Dashboard
```
http://localhost:3000
```
**Login:** `admin@local.awos` / `admin123`

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────┐
│  LOCAL NETWORK (No Internet Required!)     │
│                                             │
│  Router (192.168.1.1)                      │
│    ├─ PC (192.168.1.100)                   │
│    │  └─ Next.js Server :3000              │
│    │  └─ IndexedDB (browser storage)       │
│    │  └─ JSON files (server backup)        │
│    │                                        │
│    └─ ESP32 (192.168.1.177)                │
│       └─ W5500 Ethernet Module             │
│       └─ Sensors (LoRa/Direct)             │
│                                             │
│  Data Flow:                                │
│  Sensors → ESP32 → HTTP POST → PC Server  │
│           → IndexedDB + JSON → Dashboard   │
│                                             │
│  ❌ NO INTERNET CONNECTION NEEDED          │
└─────────────────────────────────────────────┘
```

---

## 🔧 NPM Scripts Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run init-db` | Initialize database with defaults |
| `npm run detect-network` | Auto-detect network config |
| `npm run local-setup` | Run network detection + DB init |
| `npm run test-api` | Test API endpoints |

---

## 📂 Project Structure (Local Mode)

```
awos-dashboard/
├── .env.local                    # ⚙️ Network configuration
├── start-awos-server.bat         # 🚀 Quick server startup
├── QUICK_START_LOCAL.md          # 📖 Quick reference
├── package.json                  # 📦 Dependencies + scripts
│
├── app/
│   ├── api/
│   │   ├── esp32/route.ts        # 📡 ESP32 data endpoint
│   │   ├── readings/route.ts     # 📊 Data retrieval
│   │   └── db/health/route.ts    # 🏥 Database health
│   │
│   ├── dashboard/page.tsx        # 🎛️ Main dashboard
│   ├── reports/page.tsx          # 📄 Reports (local data)
│   └── debug/page.tsx            # 🐛 Debug panel
│
├── components/
│   ├── dashboard.tsx             # Dashboard UI
│   ├── live-dashboard.tsx        # Real-time updates
│   └── realtime-debug-panel.tsx  # Debug UI
│
├── lib/
│   ├── local-database.ts         # 💾 IndexedDB layer
│   ├── local-api-client.ts       # 🔌 Local API client
│   └── exportUtils.ts            # 📤 Data export (CSV/JSON/PDF)
│
├── scripts/
│   ├── esp32-Local-Ethernet.ino  # 🤖 ESP32 firmware
│   ├── init-local-database.js    # 🗄️ Database init
│   └── detect-network-config.js  # 🔍 Network detector
│
├── docs/
│   ├── LOCAL_ETHERNET_SETUP.md   # 📘 Complete guide
│   └── VERIFICATION_CHECKLIST.md # ✅ Testing checklist
│
└── data/                         # Created at runtime
    ├── sensor_readings.json      # 📊 Local sensor data
    └── database_init.json        # 🗄️ DB initialization
```

---

## 🎯 Key Features (Local Mode)

### ✅ Offline Operation
- ❌ **No internet required**
- 🏠 **100% local network**
- 🔒 **Complete data privacy**
- 💾 **Dual storage** (IndexedDB + JSON)

### ✅ Real-Time Data
- ⚡ **ESP32 sends every 10 seconds**
- 🔄 **Dashboard polls every 2 seconds**
- 📊 **Live charts and gauges**
- 🚨 **Automatic alerts**

### ✅ Data Storage
- 🗄️ **IndexedDB** (browser storage)
- 📁 **JSON files** (server backup)
- 📈 **10,000 reading limit** (auto-cleanup)
- 💾 **90 days retention** (configurable)

### ✅ Reports & Export
- 📄 **CSV export** (Excel-compatible)
- 📋 **JSON export** (API-friendly)
- 📰 **PDF/HTML export** (printable)
- 📅 **Custom date ranges**

### ✅ Multi-Device Access
- 💻 **Desktop browser**
- 📱 **Mobile phones** (same network)
- 🖥️ **Tablets**
- 🌐 **Any device on local network**

---

## 🔍 Testing Your Setup

### Quick Health Check
```cmd
# 1. Verify PC IP
ipconfig

# 2. Test server
curl http://localhost:3000

# 3. Test ESP32 endpoint
curl http://localhost:3000/api/esp32

# 4. Check database health
curl http://localhost:3000/api/db/health

# 5. Ping ESP32 (after Ethernet connected)
ping 192.168.1.177
```

### ESP32 Serial Monitor
Expected output:
```
✅ Ethernet connected!
   ESP32 IP: 192.168.1.177
   Server IP: 192.168.1.100:3000
✅ Data sent successfully
```

### Browser Console
Expected logs (every 2 seconds):
```
🔄 Polling for sensor data...
✅ Data refreshed: {temp: 28.5, ...}
```

---

## 🚨 Common Issues & Solutions

### "Ethernet not connected"
**Solution:**
- Check Ethernet cable is plugged in
- Verify W5500 wiring (SPI pins)
- Check 3.3V power to W5500

### "Connection to server failed"
**Solution:**
- Verify PC IP in ESP32 code matches `ipconfig`
- Check firewall allows port 3000
- Verify server is running (`npm run dev`)
- Ping test: `ping 192.168.1.100`

### "No data in dashboard"
**Solution:**
- Check ESP32 Serial Monitor shows "Data sent"
- Test API: `http://localhost:3000/api/esp32`
- Check browser console (F12) for errors
- Verify IndexedDB in browser DevTools

### "Port 3000 already in use"
**Solution:**
```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 📱 Access URLs

### From Same PC
```
Dashboard:  http://localhost:3000
Debug:      http://localhost:3000/debug
Reports:    http://localhost:3000/reports
API:        http://localhost:3000/api/esp32
```

### From Other Devices (Same Network)
```
Dashboard:  http://192.168.1.100:3000
Mobile:     http://192.168.1.100:3000
Tablet:     http://192.168.1.100:3000
```
*(Replace 192.168.1.100 with your PC IP)*

---

## 🔐 Security Notes

### Default Credentials
```
Email:    admin@local.awos
Password: admin123
```
**⚠️ Change password after first login!**

### Local Network Security
- Dashboard only accessible on local network
- No external access without port forwarding
- All data stays on your PC
- No cloud services or external APIs

---

## 📚 Documentation

### Complete Guides
1. **[QUICK_START_LOCAL.md](QUICK_START_LOCAL.md)** - Fast setup (this file)
2. **[docs/LOCAL_ETHERNET_SETUP.md](docs/LOCAL_ETHERNET_SETUP.md)** - Detailed guide
3. **[docs/VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md)** - Testing checklist
4. **[README.md](README.md)** - Full project documentation

### Scripts Documentation
- **init-local-database.js** - Database initialization
- **detect-network-config.js** - Network auto-detection
- **esp32-Local-Ethernet.ino** - ESP32 firmware

---

## 🎉 Next Steps

1. ✅ **Run network detection**
   ```cmd
   npm run detect-network
   ```

2. ✅ **Update configuration files**
   - Edit `.env.local`
   - Edit ESP32 code

3. ✅ **Configure firewall**
   ```cmd
   netsh advfirewall firewall add rule name="AWOS Dashboard Port 3000" dir=in action=allow protocol=TCP localport=3000
   ```

4. ✅ **Upload ESP32 code**
   - Arduino IDE → Upload

5. ✅ **Connect hardware**
   - Ethernet cables

6. ✅ **Start server**
   ```cmd
   start-awos-server.bat
   ```

7. ✅ **Access dashboard**
   - `http://localhost:3000`

8. ✅ **Verify everything**
   - See [VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md)

---

## 💡 Pro Tips

### Performance Optimization
- Use Ethernet for PC (faster than WiFi)
- Reduce polling to 1 second for faster updates
- Use production build for better performance

### Data Management
- Export reports regularly
- Monitor data folder size
- Adjust retention period in `.env.local`

### Backup
- Backup `data/sensor_readings.json` periodically
- Save ESP32 code configuration
- Document your IP addresses

---

## 🆘 Support

### If You Need Help
1. **Check Serial Monitor** - ESP32 errors show here
2. **Check Browser Console** (F12) - JavaScript errors
3. **Check Server Console** - API errors
4. **Review Documentation** - Guides above
5. **Run Verification Checklist** - Systematic testing

### Useful Commands
```cmd
# Network diagnostics
ipconfig
ping 192.168.1.1
ping 192.168.1.177

# Server diagnostics
netstat -an | findstr :3000
curl http://localhost:3000/api/esp32

# Database diagnostics
npm run init-db
dir data
type data\sensor_readings.json
```

---

## ✨ Success Indicators

Your system is working correctly when:

✅ ESP32 Serial Monitor shows "✅ Data sent successfully"  
✅ Server console shows "📡 Received ESP32 data"  
✅ Dashboard displays live sensor readings  
✅ Data updates automatically every 2 seconds  
✅ Works without internet connection  
✅ Accessible from mobile devices on network  
✅ Reports generate with actual data  

---

**Your AWOS Dashboard is ready for complete offline operation! 🎊**

**No internet needed • All data local • Full privacy • Real-time updates**

---

*Setup date: ________________*  
*PC IP: ________________*  
*ESP32 IP: ________________*  
*Status: ☐ Testing  ☐ Operational*
