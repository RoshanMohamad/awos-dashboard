# MQTT + Vercel Testing Guide

## 🚀 Quick Setup & Test

### Step 1: Install MQTT Broker (Local Development)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mosquitto mosquitto-clients

# Start Mosquitto
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Test it works
mosquitto_pub -h localhost -t test -m "Hello MQTT"
mosquitto_sub -h localhost -t test
```

### Step 2: Test Your Current Setup

```bash
# Terminal 1: Start your Next.js app
cd /home/roshan/Documents/awos-dashboard
npm run dev

# Terminal 2: Start MQTT Bridge
npm run mqtt-bridge:dev

# Terminal 3: Send test sensor data
npm run mqtt-test

# Or manually:
mosquitto_pub -h localhost -t "awos/TEST001/sensor/data" -m '{
  "stationId": "TEST001",
  "temperature": 25.5,
  "humidity": 60.2,
  "pressure": 1013.25,
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'
```

### Step 3: Verify Data Flow

```bash
# Check API directly
curl http://localhost:3000/api/readings?stationId=TEST001

# Check dashboard
open http://localhost:3000
```

## 🌐 Production Deployment

### Option A: Cloud MQTT (Recommended)

1. **Sign up for HiveMQ Cloud** (free tier)
   - Go to https://www.hivemq.com/mqtt-cloud-broker/
   - Create free cluster
   - Get connection details

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Run Bridge on VPS/Local Server**
   ```bash
   # Set production environment
   export MQTT_HOST=your-instance.s1.eu.hivemq.cloud
   export MQTT_PORT=8883
   export MQTT_USERNAME=your-username
   export MQTT_PASSWORD=your-password
   export MQTT_PROTOCOL=mqtts
   export API_BASE_URL=https://your-app.vercel.app
   
   # Start bridge
   npm run mqtt-bridge:prod
   ```

4. **Update ESP32 Code**
   ```cpp
   const char* mqtt_server = "your-instance.s1.eu.hivemq.cloud";
   const int mqtt_port = 8883;
   const char* mqtt_user = "your-username";
   const char* mqtt_password = "your-password";
   ```

### Option B: Local MQTT + Port Forwarding

1. **Setup Dynamic DNS** (if you don't have static IP)
   - Use No-IP, DuckDNS, or similar
   - Point to your home router

2. **Configure Router Port Forwarding**
   - Forward port 1883 to your local machine
   - Update router firewall rules

3. **Update ESP32 to use your public IP/domain**
   ```cpp
   const char* mqtt_server = "your-public-domain.com";
   ```

## 🔧 ESP32 Code for Different Networks

### Basic MQTT ESP32 Code

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi - ESP32 can be on ANY network
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT - Connect to your broker (local or cloud)
const char* mqtt_server = "localhost";  // or cloud broker
const int mqtt_port = 1883;
const char* mqtt_user = "";
const char* mqtt_password = "";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
    Serial.begin(115200);
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");
    
    // Setup MQTT
    client.setServer(mqtt_server, mqtt_port);
    
    Serial.println("ESP32 ready to send sensor data!");
}

void loop() {
    if (!client.connected()) {
        reconnectMQTT();
    }
    client.loop();
    
    // Send sensor data every 30 seconds
    static unsigned long lastSend = 0;
    if (millis() - lastSend > 30000) {
        sendSensorData();
        lastSend = millis();
    }
    
    delay(1000);
}

void reconnectMQTT() {
    while (!client.connected()) {
        Serial.print("Connecting to MQTT...");
        
        if (client.connect("ESP32_AWOS", mqtt_user, mqtt_password)) {
            Serial.println("connected!");
        } else {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" retrying in 5 seconds");
            delay(5000);
        }
    }
}

void sendSensorData() {
    // Create sensor data JSON
    StaticJsonDocument<300> doc;
    doc["stationId"] = "ESP32_001";
    doc["timestamp"] = getTimestamp();
    doc["temperature"] = 25.5;  // Your sensor reading
    doc["humidity"] = 60.2;     // Your sensor reading
    doc["pressure"] = 1013.25;  // Your sensor reading
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Publish to MQTT
    if (client.publish("awos/ESP32_001/sensor/data", jsonString.c_str())) {
        Serial.println("✅ Sensor data published!");
        Serial.println(jsonString);
    } else {
        Serial.println("❌ Failed to publish");
    }
}

String getTimestamp() {
    // Simple timestamp (you can add NTP for accuracy)
    return String(millis());
}
```

## 📊 Data Flow Verification

### 1. Check MQTT Messages
```bash
# Subscribe to all AWOS topics
mosquitto_sub -h localhost -t "awos/+/+/+"

# Subscribe to specific station
mosquitto_sub -h localhost -t "awos/ESP32_001/sensor/data"
```

### 2. Check Bridge Logs
```bash
# Run bridge with verbose logging
npm run mqtt-bridge:dev
```

### 3. Check API Endpoints
```bash
# Check if data reached API
curl http://localhost:3000/api/readings?limit=5

# Check specific station
curl http://localhost:3000/api/readings?stationId=ESP32_001
```

### 4. Check Dashboard
- Open http://localhost:3000
- Look for real-time updates
- Check if ESP32 data appears

## 🎯 Network Scenarios

### Scenario 1: Same WiFi Network
```
ESP32 (Home WiFi) → MQTT Broker (Home) → Bridge → Vercel
```
✅ Works perfectly

### Scenario 2: Different WiFi Networks
```
ESP32 (Home WiFi) → Cloud MQTT → Bridge (VPS) → Vercel
```
✅ Works perfectly

### Scenario 3: Mobile Networks
```
ESP32 (Home WiFi) → Cloud MQTT → Bridge (Home PC) → Vercel
```
✅ Works perfectly

## 🚀 Ready to Deploy?

### Your deployment checklist:

- [ ] ✅ ESP32 code working with local MQTT
- [ ] ✅ MQTT bridge forwarding to local API
- [ ] ✅ Next.js app receiving data
- [ ] ✅ Real-time dashboard updates working
- [ ] 🔄 Choose cloud MQTT service
- [ ] 🔄 Deploy to Vercel
- [ ] 🔄 Update ESP32 with cloud MQTT settings
- [ ] 🔄 Run bridge on VPS/local server
- [ ] ✅ Test from different networks

Your ESP32 weather station will work from anywhere in the world! 🌍⚡
