# ESP32 Configuration for Vercel Deployment

## 🌐 Network Architecture Overview

When you deploy to Vercel, your ESP32 and web users can be on completely different networks. Here's how it works:

```
ESP32 (Any WiFi) → Internet → Vercel App → Supabase Database
     ↓                                            ↑
Home Network                              Users (Any Network)
```

## ✅ What Works (No Issues):

1. **ESP32 on home WiFi** → Sends data to Vercel app via internet
2. **Users on office WiFi** → Access dashboard via internet  
3. **Users on mobile data** → Access dashboard via internet
4. **ESP32 on mobile hotspot** → Still works via internet

## 🔧 Required ESP32 Code Changes

### Update these lines in your ESP32 code:

```cpp
// ===== CONFIGURATION =====
// WiFi Settings (Your ESP32's local WiFi)
const char* WIFI_SSID = "YOUR_HOME_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_HOME_WIFI_PASSWORD";

// Server Settings (Use your Vercel app URL)
const char* INGEST_URL = "https://your-app-name.vercel.app/api/ingest";  // 🔥 CHANGE THIS
const char* STATION_ID = "HOME001";  // Your unique station ID

// NTP Settings (for accurate timestamps)
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;  // UTC offset (adjust for your timezone)
const int daylightOffset_sec = 0;
```

### Complete ESP32 Configuration Example:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <DHT.h>

// ===== CONFIGURATION FOR VERCEL DEPLOYMENT =====
const char* WIFI_SSID = "YourHomeWiFi";           // Your ESP32's WiFi
const char* WIFI_PASSWORD = "YourWiFiPassword";
const char* INGEST_URL = "https://awos-dashboard-yourname.vercel.app/api/ingest";
const char* STATION_ID = "HOME001";

// Rest of your sensor code...
DHT dht(4, DHT22);

void setup() {
    Serial.begin(115200);
    dht.begin();
    
    // Connect to WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    
    // Configure time
    configTime(0, 0, "pool.ntp.org");
}

void loop() {
    // Read sensors
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    if (!isnan(temperature) && !isnan(humidity)) {
        sendSensorData(temperature, humidity);
    }
    
    delay(60000); // Send every minute
}

void sendSensorData(float temp, float hum) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(INGEST_URL);
        http.addHeader("Content-Type", "application/json");
        
        // Create JSON payload
        StaticJsonDocument<300> doc;
        doc["stationId"] = STATION_ID;
        doc["temperature"] = temp;
        doc["humidity"] = hum;
        doc["timestamp"] = getTimestamp();
        doc["dataQuality"] = "good";
        
        String jsonString;
        serializeJson(doc, jsonString);
        
        int httpResponseCode = http.POST(jsonString);
        
        if (httpResponseCode > 0) {
            Serial.printf("✓ Data sent successfully! Response: %d\n", httpResponseCode);
        } else {
            Serial.printf("✗ Error sending data: %d\n", httpResponseCode);
        }
        
        http.end();
    } else {
        Serial.println("✗ WiFi not connected");
    }
}

String getTimestamp() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        return String(millis()); // Fallback
    }
    
    char buffer[64];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(buffer);
}
```

## 🔒 Security Considerations

### ✅ Secure (HTTPS):
```cpp
const char* INGEST_URL = "https://your-app.vercel.app/api/ingest";  // ✅ HTTPS
```

### ❌ Insecure (HTTP):
```cpp
const char* INGEST_URL = "http://your-app.vercel.app/api/ingest";   // ❌ HTTP
```

**Use HTTPS for security!** Vercel provides SSL certificates automatically.

## 🌍 Multiple ESP32 Stations

You can have ESP32 devices on different networks worldwide:

```cpp
// Station 1 (Home)
const char* STATION_ID = "HOME001";
const char* WIFI_SSID = "HomeWiFi";

// Station 2 (Office)  
const char* STATION_ID = "OFFICE001";
const char* WIFI_SSID = "OfficeWiFi";

// Station 3 (Remote Site)
const char* STATION_ID = "REMOTE001"; 
const char* WIFI_SSID = "RemoteSiteWiFi";
```

All send data to the same Vercel app: `https://your-app.vercel.app/api/ingest`

## 📱 Mobile Data / Hotspot

ESP32 can even use mobile hotspot:

```cpp
const char* WIFI_SSID = "iPhone_Hotspot";      // Mobile hotspot
const char* WIFI_PASSWORD = "hotspot123";
const char* INGEST_URL = "https://your-app.vercel.app/api/ingest";  // Still works!
```

## 🔧 Troubleshooting Different Networks

### 1. **ESP32 Can't Reach Vercel**
```cpp
// Test with simple HTTP request
void testConnection() {
    HTTPClient http;
    http.begin("https://httpbin.org/get");  // Test endpoint
    int httpCode = http.GET();
    Serial.printf("Test connection result: %d\n", httpCode);
    http.end();
}
```

### 2. **Check Your Vercel URL**
```bash
# Test your API from any computer
curl -X POST https://your-app.vercel.app/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"stationId":"TEST","temperature":25}'
```

### 3. **Firewall Issues**
Some corporate networks block HTTP requests:
- Try mobile hotspot to test
- Contact network admin to allow outbound HTTPS
- Use port 443 (HTTPS) which is usually allowed

### 4. **Monitor ESP32 Serial Output**
```
Connecting to WiFi...
WiFi connected!
IP address: 192.168.1.105
✓ Data sent successfully! Response: 200
```

## 🎯 Benefits of Cloud Deployment

### ✅ Advantages:
- **Global Access**: Users worldwide can view your weather data
- **No Port Forwarding**: No need to open home router ports
- **SSL Security**: Automatic HTTPS encryption
- **Scalability**: Handle multiple ESP32 stations
- **Reliability**: Vercel/Supabase uptime > 99.9%
- **Mobile Access**: Works on phones/tablets anywhere

### ✅ Real-World Example:
```
🏠 Home ESP32 (192.168.1.100) → 📡 Internet → ☁️ Vercel App
                                                    ↓
📱 You at work (10.0.0.50) ← 📡 Internet ← 💾 Supabase DB
```

## 🚀 Next Steps

1. **Update ESP32 code** with your Vercel URL
2. **Flash updated code** to ESP32
3. **Monitor serial output** for successful connections
4. **Test from different devices** on different networks
5. **Add multiple ESP32 stations** with unique station IDs

Your weather station will work globally! 🌍
