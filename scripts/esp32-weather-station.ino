/*
 * AWOS Dashboard - ESP32 Weather Station
 * 
 * This sketch collects weather data from various sensors and sends it to the AWOS Dashboard
 * via HTTP POST requests. It includes features like:
 * - WiFi connectivity with reconnection
 * - NTP time synchronization
 * - Multiple sensor support (DHT22, BMP280, Wind sensors)
 * - Offline data queuing with SPIFFS
 * - Battery and solar panel monitoring
 * - Data quality validation
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - DHT22 Temperature/Humidity Sensor
 * - BMP280 Pressure Sensor (optional)
 * - Wind Speed Sensor (anemometer)
 * - Wind Direction Sensor (wind vane)
 * - Battery voltage divider
 * - Solar panel voltage divider
 * 
 * Author: AWOS Dashboard Team
 * License: MIT
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <DHT.h>
#include <SPIFFS.h>

// ===== CONFIGURATION =====
// WiFi Settings
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Settings
const char* INGEST_URL = "http://your-domain.com/api/ingest";  // Change to your server
const char* STATION_ID = "VCBI";  // Your weather station ID

// Sensor Pin Definitions
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define WIND_SPEED_PIN 2
#define WIND_DIRECTION_PIN A0
#define BATTERY_PIN A1
#define SOLAR_PANEL_PIN A2
#define CEB_POWER_PIN 5

// Timing Settings
#define READING_INTERVAL 60000  // 1 minute between readings
#define WIFI_TIMEOUT 20000      // 20 seconds WiFi connection timeout
#define HTTP_TIMEOUT 10000      // 10 seconds HTTP timeout

// ===== GLOBAL VARIABLES =====
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastReading = 0;
unsigned long lastWiFiCheck = 0;
int windSpeedCount = 0;
float windSpeedBuffer[10];
int bufferIndex = 0;
bool spiffsInitialized = false;

// NTP Settings
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;  // UTC offset in seconds
const int daylightOffset_sec = 0;

// ===== STRUCTURE DEFINITIONS =====
struct SensorReading {
    float temperature;
    float humidity;
    float pressure;
    float windSpeed;
    float windDirection;
    float windGust;
    float batteryVoltage;
    float solarPanelVoltage;
    String timestamp;
    String dataQuality;
};

// ===== SETUP FUNCTION =====
void setup() {
    Serial.begin(115200);
    Serial.println("\n=== AWOS Weather Station Starting ===");
    
    // Initialize pins
    pinMode(WIND_SPEED_PIN, INPUT_PULLUP);
    pinMode(CEB_POWER_PIN, OUTPUT);
    digitalWrite(CEB_POWER_PIN, HIGH);  // Turn on external power if needed
    
    // Initialize sensors
    dht.begin();
    
    // Initialize SPIFFS for offline storage
    if (SPIFFS.begin(true)) {
        spiffsInitialized = true;
        Serial.println("✓ SPIFFS initialized");
    } else {
        Serial.println("✗ SPIFFS initialization failed");
    }
    
    // Connect to WiFi
    connectToWiFi();
    
    // Initialize NTP
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    Serial.println("✓ NTP time configured");
    
    // Attach wind speed interrupt
    attachInterrupt(digitalPinToInterrupt(WIND_SPEED_PIN), windSpeedISR, FALLING);
    
    Serial.println("=== Setup Complete ===\n");
}

// ===== MAIN LOOP =====
void loop() {
    unsigned long currentTime = millis();
    
    // Check WiFi connection every 30 seconds
    if (currentTime - lastWiFiCheck > 30000) {
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("WiFi disconnected. Reconnecting...");
            connectToWiFi();
        }
        lastWiFiCheck = currentTime;
    }
    
    // Take sensor readings at specified interval
    if (currentTime - lastReading > READING_INTERVAL) {
        SensorReading reading = collectSensorData();
        
        if (WiFi.status() == WL_CONNECTED) {
            // Send data immediately if connected
            if (sendDataToServer(reading)) {
                Serial.println("✓ Data sent successfully");
                
                // Send any queued offline data
                sendQueuedData();
            } else {
                Serial.println("✗ Failed to send data, queuing for later");
                queueDataOffline(reading);
            }
        } else {
            Serial.println("✗ No WiFi connection, queuing data offline");
            queueDataOffline(reading);
        }
        
        lastReading = currentTime;
    }
    
    delay(1000);  // Small delay to prevent excessive CPU usage
}

// ===== WIFI FUNCTIONS =====
void connectToWiFi() {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to WiFi");
    
    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < WIFI_TIMEOUT) {
        delay(500);
        Serial.print(".");
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.println("✓ WiFi connected!");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
        Serial.print("Signal strength: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
    } else {
        Serial.println();
        Serial.println("✗ WiFi connection failed");
    }
}

// ===== SENSOR FUNCTIONS =====
SensorReading collectSensorData() {
    SensorReading reading;
    
    Serial.println("--- Collecting Sensor Data ---");
    
    // Read DHT22 sensor
    reading.temperature = dht.readTemperature();
    reading.humidity = dht.readHumidity();
    
    // Read wind sensors
    reading.windSpeed = calculateWindSpeed();
    reading.windDirection = readWindDirection();
    reading.windGust = calculateWindGust();
    
    // Read power monitoring
    reading.batteryVoltage = readBatteryVoltage();
    reading.solarPanelVoltage = readSolarPanelVoltage();
    
    // Get timestamp
    reading.timestamp = getCurrentTimestamp();
    
    // Validate data quality
    reading.dataQuality = validateDataQuality(reading);
    
    // Print readings
    Serial.printf("Temperature: %.1f°C\n", reading.temperature);
    Serial.printf("Humidity: %.1f%%\n", reading.humidity);
    Serial.printf("Wind Speed: %.1f m/s\n", reading.windSpeed);
    Serial.printf("Wind Direction: %.1f°\n", reading.windDirection);
    Serial.printf("Battery: %.2fV\n", reading.batteryVoltage);
    Serial.printf("Solar Panel: %.2fV\n", reading.solarPanelVoltage);
    Serial.printf("Data Quality: %s\n", reading.dataQuality.c_str());
    Serial.printf("Timestamp: %s\n", reading.timestamp.c_str());
    
    return reading;
}

float calculateWindSpeed() {
    // Calculate wind speed from interrupt counter
    // Assuming 1 pulse per revolution, and calibration factor
    float speed = windSpeedCount * 2.4 / (READING_INTERVAL / 1000.0); // m/s
    windSpeedCount = 0; // Reset counter
    
    // Add to buffer for gust calculation
    windSpeedBuffer[bufferIndex] = speed;
    bufferIndex = (bufferIndex + 1) % 10;
    
    return speed;
}

float calculateWindGust() {
    // Find maximum wind speed in buffer
    float maxSpeed = 0;
    for (int i = 0; i < 10; i++) {
        if (windSpeedBuffer[i] > maxSpeed) {
            maxSpeed = windSpeedBuffer[i];
        }
    }
    return maxSpeed;
}

float readWindDirection() {
    // Read analog value and convert to degrees
    int analogValue = analogRead(WIND_DIRECTION_PIN);
    float voltage = analogValue * (3.3 / 4095.0);
    
    // Convert voltage to degrees (0-360)
    // This assumes a linear wind vane - adjust based on your sensor
    float degrees = (voltage / 3.3) * 360.0;
    
    return degrees;
}

float readBatteryVoltage() {
    // Read battery voltage through voltage divider
    int analogValue = analogRead(BATTERY_PIN);
    float voltage = (analogValue * 3.3 / 4095.0) * 2.0; // Assuming 2:1 voltage divider
    return voltage;
}

float readSolarPanelVoltage() {
    // Read solar panel voltage
    int analogValue = analogRead(SOLAR_PANEL_PIN);
    float voltage = (analogValue * 3.3 / 4095.0) * 5.0; // Assuming 5:1 voltage divider
    return voltage;
}

String getCurrentTimestamp() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Failed to obtain time");
        return String(millis()); // Fallback to millis
    }
    
    char timeString[30];
    strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(timeString);
}

String validateDataQuality(SensorReading& reading) {
    // Check for sensor errors
    if (isnan(reading.temperature) || isnan(reading.humidity)) {
        return "poor";
    }
    
    // Check for reasonable ranges
    if (reading.temperature < -40 || reading.temperature > 60) {
        return "questionable";
    }
    
    if (reading.humidity < 0 || reading.humidity > 100) {
        return "questionable";
    }
    
    if (reading.windSpeed < 0 || reading.windSpeed > 50) {
        return "questionable";
    }
    
    // Check battery level
    if (reading.batteryVoltage < 3.0) {
        return "poor";
    }
    
    return "good";
}

// ===== INTERRUPT SERVICE ROUTINE =====
void IRAM_ATTR windSpeedISR() {
    windSpeedCount++;
}

// ===== DATA TRANSMISSION FUNCTIONS =====
bool sendDataToServer(SensorReading& reading) {
    if (WiFi.status() != WL_CONNECTED) {
        return false;
    }
    
    HTTPClient http;
    http.begin(INGEST_URL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT);
    
    // Create JSON payload
    DynamicJsonDocument doc(1024);
    doc["stationId"] = STATION_ID;
    doc["timestamp"] = reading.timestamp;
    doc["temperature"] = reading.temperature;
    doc["humidity"] = reading.humidity;
    doc["windSpeed"] = reading.windSpeed;
    doc["windDirection"] = reading.windDirection;
    doc["windGust"] = reading.windGust;
    doc["batteryVoltage"] = reading.batteryVoltage;
    doc["solarPanelVoltage"] = reading.solarPanelVoltage;
    doc["dataQuality"] = reading.dataQuality;
    doc["signalStrength"] = WiFi.RSSI();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.println("Sending data to server...");
    Serial.println("Payload: " + jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("HTTP Response: %d\n", httpResponseCode);
        Serial.println("Response: " + response);
        
        http.end();
        return (httpResponseCode >= 200 && httpResponseCode < 300);
    } else {
        Serial.printf("HTTP Error: %d\n", httpResponseCode);
        http.end();
        return false;
    }
}

// ===== OFFLINE STORAGE FUNCTIONS =====
void queueDataOffline(SensorReading& reading) {
    if (!spiffsInitialized) {
        Serial.println("SPIFFS not available for offline storage");
        return;
    }
    
    // Create JSON document
    DynamicJsonDocument doc(1024);
    doc["stationId"] = STATION_ID;
    doc["timestamp"] = reading.timestamp;
    doc["temperature"] = reading.temperature;
    doc["humidity"] = reading.humidity;
    doc["windSpeed"] = reading.windSpeed;
    doc["windDirection"] = reading.windDirection;
    doc["windGust"] = reading.windGust;
    doc["batteryVoltage"] = reading.batteryVoltage;
    doc["solarPanelVoltage"] = reading.solarPanelVoltage;
    doc["dataQuality"] = reading.dataQuality;
    doc["signalStrength"] = WiFi.RSSI();
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Generate unique filename
    String filename = "/queue_" + String(millis()) + ".json";
    
    File file = SPIFFS.open(filename, FILE_WRITE);
    if (file) {
        file.println(jsonString);
        file.close();
        Serial.println("✓ Data queued offline: " + filename);
    } else {
        Serial.println("✗ Failed to queue data offline");
    }
}

void sendQueuedData() {
    if (!spiffsInitialized) {
        return;
    }
    
    File root = SPIFFS.open("/");
    File file = root.openNextFile();
    
    while (file) {
        String filename = file.name();
        
        if (filename.startsWith("/queue_") && filename.endsWith(".json")) {
            String content = file.readString();
            file.close();
            
            // Try to send queued data
            HTTPClient http;
            http.begin(INGEST_URL);
            http.addHeader("Content-Type", "application/json");
            http.setTimeout(HTTP_TIMEOUT);
            
            int httpResponseCode = http.POST(content);
            
            if (httpResponseCode >= 200 && httpResponseCode < 300) {
                // Successfully sent, delete the file
                SPIFFS.remove(filename);
                Serial.println("✓ Sent queued data: " + filename);
            } else {
                Serial.println("✗ Failed to send queued data: " + filename);
                break; // Stop trying if network is having issues
            }
            
            http.end();
        }
        
        file = root.openNextFile();
    }
}
