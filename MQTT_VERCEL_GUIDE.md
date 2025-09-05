# MQTT + Vercel Architecture Guide

## 🏗️ Your Perfect Setup

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HARDWARE      │    │     ESP32       │    │  MQTT BROKER    │
│   SENSORS       │───▶│  (WiFi Network  │───▶│  (Local/Cloud)  │
│                 │    │   Different)    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    USERS        │    │     VERCEL      │    │  MQTT BRIDGE    │
│  (Any Network)  │◄───│   DASHBOARD     │◄───│   (Local/VPS)   │
│                 │    │   (Real-time)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │    SUPABASE     │
                       │    DATABASE     │
                       │   (Real-time)   │
                       └─────────────────┘
```

## 🔧 **Implementation Options**

### Option 1: Local MQTT Broker (Recommended for Development)

**Install Mosquitto without Docker:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mosquitto mosquitto-clients

# Start the service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Configure mosquitto
sudo nano /etc/mosquitto/mosquitto.conf
```

**Configuration:**
```conf
# /etc/mosquitto/mosquitto.conf
listener 1883
allow_anonymous true
persistence true
persistence_location /var/lib/mosquitto/

# For external access (if needed)
listener 1883 0.0.0.0
```

### Option 2: Cloud MQTT Broker (Recommended for Production)

**Free Cloud MQTT Services:**
- **HiveMQ Cloud** (Free tier: 100 connections)
- **AWS IoT Core** (Free tier: 500K messages/month)
- **CloudMQTT** (Free tier: 10 connections)

## 🚀 **Complete Setup Guide**

### Step 1: MQTT Broker Setup

#### Local Development:
```bash
# Install Mosquitto
sudo apt install mosquitto mosquitto-clients

# Test it works
mosquitto_pub -h localhost -t "awos/sensor/data" -m '{"temperature":25.5}'
mosquitto_sub -h localhost -t "awos/sensor/+"
```

#### Production (HiveMQ Cloud):
```javascript
// config/mqtt.js
const mqttConfig = {
  development: {
    host: 'localhost',
    port: 1883,
    username: null,
    password: null
  },
  production: {
    host: 'your-instance.s1.eu.hivemq.cloud',
    port: 8883,
    username: 'your-username',
    password: 'your-password',
    protocol: 'mqtts'
  }
};
```

### Step 2: Enhanced MQTT Bridge

```javascript
// scripts/mqtt-bridge-standalone.js
const mqtt = require('mqtt');
const https = require('https');
const http = require('http');

class MQTTBridge {
    constructor() {
        this.config = {
            mqtt: {
                host: process.env.MQTT_HOST || 'localhost',
                port: process.env.MQTT_PORT || 1883,
                username: process.env.MQTT_USERNAME,
                password: process.env.MQTT_PASSWORD,
                protocol: process.env.MQTT_PROTOCOL || 'mqtt'
            },
            api: {
                baseUrl: process.env.API_BASE_URL || 'https://your-app.vercel.app',
                timeout: 10000
            }
        };
        
        this.client = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
    }

    async connect() {
        try {
            const mqttUrl = `${this.config.mqtt.protocol}://${this.config.mqtt.host}:${this.config.mqtt.port}`;
            
            const options = {
                clientId: `mqtt-bridge-${Math.random().toString(16).substr(2, 8)}`,
                keepalive: 60,
                clean: true,
                reconnectPeriod: 5000,
                connectTimeout: 30000
            };

            if (this.config.mqtt.username) {
                options.username = this.config.mqtt.username;
                options.password = this.config.mqtt.password;
            }

            console.log(`🔌 Connecting to MQTT broker: ${mqttUrl}`);
            this.client = mqtt.connect(mqttUrl, options);

            this.client.on('connect', () => {
                console.log('✅ Connected to MQTT broker');
                this.reconnectAttempts = 0;
                this.subscribeToTopics();
            });

            this.client.on('message', this.handleMessage.bind(this));
            this.client.on('error', this.handleError.bind(this));
            this.client.on('close', this.handleClose.bind(this));
            this.client.on('reconnect', this.handleReconnect.bind(this));

        } catch (error) {
            console.error('❌ MQTT connection failed:', error);
            this.scheduleReconnect();
        }
    }

    subscribeToTopics() {
        const topics = [
            'awos/+/sensor/data',
            'awos/+/status',
            'awos/+/battery',
            'awos/sensor/+',
            'weather/+/data'
        ];

        topics.forEach(topic => {
            this.client.subscribe(topic, (err) => {
                if (err) {
                    console.error(`❌ Failed to subscribe to ${topic}:`, err);
                } else {
                    console.log(`📡 Subscribed to: ${topic}`);
                }
            });
        });
    }

    async handleMessage(topic, message) {
        try {
            console.log(`📨 Received message on ${topic}`);
            
            let data;
            try {
                data = JSON.parse(message.toString());
            } catch (parseError) {
                console.error('❌ Invalid JSON message:', parseError);
                return;
            }

            // Add metadata
            data.mqttTopic = topic;
            data.receivedAt = new Date().toISOString();
            
            // Extract station ID from topic if not provided
            if (!data.stationId) {
                const topicParts = topic.split('/');
                data.stationId = topicParts[1] || 'UNKNOWN';
            }

            // Send to Vercel API
            await this.sendToAPI(data);

        } catch (error) {
            console.error('❌ Error handling message:', error);
        }
    }

    async sendToAPI(data) {
        return new Promise((resolve, reject) => {
            const url = new URL('/api/ingest', this.config.api.baseUrl);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const postData = JSON.stringify(data);
            
            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'AWOS-MQTT-Bridge/1.0'
                },
                timeout: this.config.api.timeout
            };

            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`✅ Data sent to API (${res.statusCode}): ${data.stationId}`);
                        resolve({ success: true, statusCode: res.statusCode });
                    } else {
                        console.error(`❌ API error (${res.statusCode}): ${responseData}`);
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ API request failed:', error);
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                console.error('❌ API request timeout');
                reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    handleError(error) {
        console.error('❌ MQTT error:', error);
    }

    handleClose() {
        console.log('🔌 MQTT connection closed');
    }

    handleReconnect() {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting to MQTT (attempt ${this.reconnectAttempts})`);
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            console.error('❌ Max reconnect attempts reached');
            process.exit(1);
        }
    }

    scheduleReconnect() {
        setTimeout(() => {
            this.connect();
        }, 5000);
    }
}

// Start the bridge
const bridge = new MQTTBridge();
bridge.connect();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down MQTT bridge...');
    if (bridge.client) {
        bridge.client.end();
    }
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

console.log('🚀 MQTT Bridge started');
console.log(`📡 MQTT: ${bridge.config.mqtt.protocol}://${bridge.config.mqtt.host}:${bridge.config.mqtt.port}`);
console.log(`🌐 API: ${bridge.config.api.baseUrl}`);
```

### Step 3: ESP32 MQTT Code

```cpp
// ESP32 MQTT + WiFi Code
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Configuration
const char* mqtt_server = "localhost";  // or your cloud MQTT broker
const int mqtt_port = 1883;
const char* mqtt_user = "";             // if required
const char* mqtt_password = "";         // if required

// Station configuration
const char* station_id = "AWOS001";
const char* topic_data = "awos/AWOS001/sensor/data";
const char* topic_status = "awos/AWOS001/status";

// Sensor setup
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
    Serial.begin(115200);
    
    // Initialize sensors
    dht.begin();
    
    // Connect to WiFi
    setupWiFi();
    
    // Setup MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
    
    Serial.println("🚀 ESP32 Weather Station with MQTT ready!");
}

void setupWiFi() {
    delay(10);
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
    Serial.print("Message arrived on topic: ");
    Serial.print(topic);
    Serial.print(". Message: ");
    String messageTemp;
    
    for (int i = 0; i < length; i++) {
        Serial.print((char)message[i]);
        messageTemp += (char)message[i];
    }
    Serial.println();
    
    // Handle incoming commands here
    if (String(topic) == "awos/AWOS001/cmd") {
        if(messageTemp == "reset") {
            ESP.restart();
        }
    }
}

void reconnectMQTT() {
    while (!client.connected()) {
        Serial.print("Attempting MQTT connection...");
        
        if (client.connect(station_id, mqtt_user, mqtt_password)) {
            Serial.println("connected");
            
            // Subscribe to command topic
            client.subscribe("awos/AWOS001/cmd");
            
            // Publish status
            publishStatus("online");
            
        } else {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

void publishSensorData() {
    // Read sensors
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
    }
    
    // Create JSON payload
    StaticJsonDocument<300> doc;
    doc["stationId"] = station_id;
    doc["timestamp"] = getTimestamp();
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["pressure"] = 1013.25;  // Add your pressure sensor
    doc["batteryVoltage"] = 3.7;
    doc["signalStrength"] = WiFi.RSSI();
    doc["dataQuality"] = "good";
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Publish to MQTT
    if (client.publish(topic_data, jsonString.c_str())) {
        Serial.println("✅ Sensor data published to MQTT");
        Serial.println(jsonString);
    } else {
        Serial.println("❌ Failed to publish sensor data");
    }
}

void publishStatus(const char* status) {
    StaticJsonDocument<200> doc;
    doc["stationId"] = station_id;
    doc["status"] = status;
    doc["timestamp"] = getTimestamp();
    doc["uptime"] = millis();
    doc["freeHeap"] = ESP.getFreeHeap();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    client.publish(topic_status, jsonString.c_str());
}

String getTimestamp() {
    // You can use NTP for accurate time
    return String(millis());  // Simplified for now
}

void loop() {
    if (!client.connected()) {
        reconnectMQTT();
    }
    client.loop();
    
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        setupWiFi();
    }
    
    // Publish sensor data every 30 seconds
    static unsigned long lastReading = 0;
    if (millis() - lastReading > 30000) {
        publishSensorData();
        lastReading = millis();
    }
    
    delay(100);
}
```

### Step 4: Environment Configuration

```bash
# .env.local (for local development)
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
API_BASE_URL=http://localhost:3000

# .env.production (for production bridge)
MQTT_HOST=your-instance.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
MQTT_PROTOCOL=mqtts
API_BASE_URL=https://your-app.vercel.app
```

### Step 5: Package.json Scripts

```json
{
  "scripts": {
    "mqtt-bridge": "node scripts/mqtt-bridge-standalone.js",
    "mqtt-bridge:dev": "MQTT_HOST=localhost API_BASE_URL=http://localhost:3000 node scripts/mqtt-bridge-standalone.js",
    "mqtt-bridge:prod": "node scripts/mqtt-bridge-standalone.js"
  }
}
```

## 🚀 **Deployment Strategy**

### Development:
```bash
# Terminal 1: Start local MQTT broker
sudo systemctl start mosquitto

# Terminal 2: Start MQTT bridge
npm run mqtt-bridge:dev

# Terminal 3: Start Next.js app
npm run dev

# Terminal 4: Test ESP32 connection
mosquitto_pub -h localhost -t "awos/TEST001/sensor/data" -m '{"temperature":25.5,"humidity":60}'
```

### Production:
```bash
# Deploy web app to Vercel
vercel --prod

# Run MQTT bridge on VPS/local server
npm run mqtt-bridge:prod

# ESP32 connects to MQTT broker
# Bridge forwards to Vercel API
# Real-time updates in dashboard
```

## ✅ **Benefits of This Setup**

1. **✅ MQTT for hardware communication**
2. **✅ Vercel for web app (no Docker)**
3. **✅ Different networks supported**
4. **✅ Real-time dashboard updates**
5. **✅ Scalable architecture**
6. **✅ Cloud database storage**

Your ESP32 can be on any WiFi network and still communicate through MQTT to your Vercel-hosted dashboard! 🌍⚡
