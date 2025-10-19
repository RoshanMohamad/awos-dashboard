# AWOS Dashboard - Quick Start Guide (Local Ethernet Setup)

## 🎯 Complete Offline Setup in 5 Steps

This is a quick reference for setting up your AWOS Dashboard to work **100% offline** with ESP32 via Ethernet.

---

## ⚡ Quick Setup (30 minutes)

### STEP 1: Find Your PC IP Address (2 minutes)

```cmd
ipconfig
```

Look for "IPv4 Address" - write it down: `192.168.1.___`

---

### STEP 2: Install and Configure (10 minutes)

```cmd
# Navigate to project
cd "d:\profosional projects\awos-dashboard"

# Install dependencies
npm install

# Auto-detect network and generate config
node scripts/detect-network-config.js
```

This will:
- ✅ Detect your PC IP automatically
- ✅ Suggest ESP32 IP
- ✅ Generate ESP32 Arduino configuration
- ✅ Create `.env.local` template

**Edit `.env.local`** - update these 3 lines:
```bash
NEXT_PUBLIC_PC_IP=192.168.1.100      # Your PC IP
NEXT_PUBLIC_ESP32_IP=192.168.1.177   # Choose unique IP for ESP32  
NEXT_PUBLIC_GATEWAY_IP=192.168.1.1   # Your router IP
```

---

### STEP 3: Allow Firewall (1 minute)

```cmd
# Run as Administrator
netsh advfirewall firewall add rule name="AWOS Dashboard Port 3000" dir=in action=allow protocol=TCP localport=3000
```

---

### STEP 4: Configure and Upload ESP32 (10 minutes)

1. **Open Arduino IDE**
2. **Open file:** `scripts/esp32-Local-Ethernet.ino`
3. **Update lines 36-40:**

```cpp
IPAddress serverIP(192, 168, 1, 100);   // ← Your PC IP
IPAddress esp32IP(192, 168, 1, 177);    // ← ESP32 IP
IPAddress gateway(192, 168, 1, 1);      // ← Router IP
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(192, 168, 1, 1);
```

4. **Connect ESP32 via USB**
5. **Select:** Tools → Board → ESP32 Dev Module
6. **Select:** Tools → Port → COM3 (your port)
7. **Click Upload (→)**
8. **Open Serial Monitor:** 115200 baud

---

### STEP 5: Connect and Start (5 minutes)

**Physical Connections:**
```
Router Port 1 → [Ethernet Cable] → PC
Router Port 2 → [Ethernet Cable] → W5500 Module
```

**Start Server:**
```cmd
# Option A: Manual
npm run dev

# Option B: Use batch file
start-awos-server.bat
```

**Verify:**
1. Browser → `http://localhost:3000`
2. Login: `admin@local.awos` / `admin123`
3. Should see dashboard!

---

## ✅ Quick Verification

### ESP32 Serial Monitor Should Show:
```
✅ Ethernet connected!
   ESP32 IP: 192.168.1.177
   Server IP: 192.168.1.100:3000
✅ Data sent successfully
```

### Browser Should Show:
- Login page loads
- Dashboard displays sensor data
- Data updates every 2 seconds
- No errors in console (F12)

---

## 🔧 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Ethernet not connected"** | Check cable, verify W5500 wiring |
| **"Connection to server failed"** | Verify PC IP, check firewall, ping ESP32 |
| **"No data in dashboard"** | Check API: `http://localhost:3000/api/esp32` |
| **"Port 3000 in use"** | `netstat -ano \| findstr :3000` then kill process |

---

## 📁 Important Files Reference

| File | Purpose |
|------|---------|
| `.env.local` | Network configuration |
| `scripts/esp32-Local-Ethernet.ino` | ESP32 code |
| `start-awos-server.bat` | Easy server startup |
| `scripts/detect-network-config.js` | Auto-detect network |
| `scripts/init-local-database.js` | Initialize database |
| `docs/LOCAL_ETHERNET_SETUP.md` | Complete setup guide |
| `docs/VERIFICATION_CHECKLIST.md` | Full testing checklist |

---

## 🎓 Helpful Commands

```cmd
# Find your IP
ipconfig

# Check port 3000 is open
netstat -an | findstr :3000

# Ping router
ping 192.168.1.1

# Ping ESP32
ping 192.168.1.177

# Test API
curl http://localhost:3000/api/esp32

# Kill process on port 3000
taskkill /PID <PID> /F

# Initialize database
node scripts/init-local-database.js

# Detect network config
node scripts/detect-network-config.js
```

---

## 🌐 Access URLs

| Device | URL |
|--------|-----|
| Same PC | `http://localhost:3000` |
| Other PC/Mobile on network | `http://192.168.1.100:3000` |
| Debug page | `http://localhost:3000/debug` |
| Reports | `http://localhost:3000/reports` |
| API endpoint | `http://localhost:3000/api/esp32` |

*(Replace `192.168.1.100` with your actual PC IP)*

---

## 📊 System Architecture (Offline)

```
┌────────────────────────────────────────────────┐
│  YOUR LOCAL NETWORK (No Internet!)            │
│                                                │
│  ┌─────────────┐                              │
│  │   Router    │  192.168.1.1                 │
│  │ (Gateway)   │                              │
│  └──────┬──────┘                              │
│         │                                      │
│    ┌────┴────┬───────────────┐               │
│    │         │               │                │
│ ┌──▼──┐   ┌─▼──┐        ┌───▼───┐           │
│ │ PC  │   │ESP32│        │Mobile │           │
│ │:3000│   │:177│        │Phone  │           │
│ └─────┘   └─────┘        └───────┘           │
│                                                │
│  Data Flow:                                   │
│  Sensors → ESP32 → PC Server → Browser       │
│                                                │
│  Storage:                                     │
│  • IndexedDB (browser)                        │
│  • JSON files (server)                        │
│                                                │
│  ❌ NO INTERNET REQUIRED                      │
└────────────────────────────────────────────────┘
```

---

## 🎉 Success Indicators

✅ **ESP32:** "✅ Data sent successfully" every 10 seconds  
✅ **Server:** "📡 Received ESP32 data" in console  
✅ **Dashboard:** Live data updates every 2 seconds  
✅ **Offline:** Works with no internet connection  
✅ **Mobile:** Accessible from phone on same network  

---

## 📞 Need More Help?

- **Complete Guide:** `docs/LOCAL_ETHERNET_SETUP.md`
- **Full Checklist:** `docs/VERIFICATION_CHECKLIST.md`
- **ESP32 Help:** Check Serial Monitor at 115200 baud
- **Server Help:** Check terminal console output
- **Browser Help:** Press F12 to see console errors

---

## 🔑 Default Credentials

**Dashboard Login:**
- Email: `admin@local.awos`
- Password: `admin123`

**⚠️ Change password after first login!**

---

## 🚀 Auto-Start on Boot

1. Press `Win+R`
2. Type: `shell:startup`
3. Copy `start-awos-server.bat` to that folder
4. Server starts automatically on Windows boot!

---

**Ready to go! Start with STEP 1 above! 🎊**

*Setup time: ~30 minutes*  
*No internet required after setup*  
*Works completely offline* ❌🌐
