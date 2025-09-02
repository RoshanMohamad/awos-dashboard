
/*
  AWOS Dashboard - ESP32 Weather Station Integration

  Features:
  - Connects to WiFi and syncs time via NTP
  - Reads weather sensors (DHT22, BMP280, wind sensors)
  - Posts JSON data to AWOS dashboard `/api/ingest` endpoint
  - Offline queue with SPIFFS storage for network outages
  - Optional MQTT publish for local monitoring
  - Validates data according to dashboard schema

  Compatible with AWOS Dashboard v2025 API
  Endpoint: POST /api/ingest
  
  Libraries required:
  - WiFi.h (built-in ESP32)
  - HTTPClient.h (built-in ESP32)  
  - ArduinoJson (by Benoit Blanchon)
  - DHT sensor library (by Adafruit)
  - Adafruit_BMP280 (by Adafruit)
  - Adafruit_Sensor (by Adafruit)
  - PubSubClient (by Nick O'Leary - optional for MQTT)

  Hardware Setup:
  - DHT22 Temperature/Humidity -> Pin 4
  - BMP280 Pressure -> I2C (SDA: Pin 21, SCL: Pin 22)
  - Wind Speed Sensor -> Pin 2 (pulse counter)
  - Wind Direction -> Pin A0 (analog voltage divider)
  - Battery Monitor -> Pin A1 (voltage divider)
  - Power Status -> Pin 5 (digital input)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <time.h>
#include <SPIFFS.h>
#include <vector>

// Optional MQTT
#define USE_MQTT true
#if USE_MQTT
#include <PubSubClient.h>
#endif

// ----- Configuration Section -----
// WiFi Settings
const char* WIFI_SSID = "YOUR_WIFI_SSID";           // Replace with your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";    // Replace with your WiFi password

// AWOS Dashboard API Configuration  
// For local development: http://192.168.8.160:3000/api/ingest
// For production: https://awos-dashboard.vercel.app/api/ingest
const char* DASHBOARD_URL = "https://awos-dashboard.vercel.app";  // Your actual Vercel deployment URL
const char* API_ENDPOINT = "https://awos-dashboard.vercel.app/api/ingest";  // Your actual API endpoint

// Weather Station Configuration
const char* STATION_ID = "VCBI";  // Your airport/station identifier (ICAO code)
const float STATION_LATITUDE = 6.8211;   // Colombo coordinates (replace with your location)
const float STATION_LONGITUDE = 79.8878;
const int STATION_ELEVATION_M = 7;        // Elevation in meters

// Hardware Pin Configuration
#define DHT_PIN 4              // DHT22 temperature/humidity sensor
#define DHT_TYPE DHT22         // DHT sensor type
#define WIND_SPEED_PIN 2       // Wind speed pulse sensor (interrupt capable pin)
#define WIND_DIRECTION_PIN A0  // Wind direction analog sensor
#define BATTERY_PIN A1         // Battery voltage monitor
#define SOLAR_PIN A2           // Solar panel voltage monitor  
#define POWER_STATUS_PIN 5     // External power status (HIGH = power available)

// Sensor Calibration Constants
#define WIND_SPEED_CALIBRATION 2.4    // Pulses per second to m/s conversion
#define WIND_DIR_OFFSET 0.0          // Wind direction offset correction (degrees)
#define BATTERY_VOLTAGE_DIVIDER 11.0  // Voltage divider ratio for battery
#define SOLAR_VOLTAGE_DIVIDER 11.0   // Voltage divider ratio for solar panel

// Timing Configuration
const unsigned long SENSOR_READ_INTERVAL_MS = 10000;  // Read sensors every 10 seconds
const unsigned long DATA_SEND_INTERVAL_MS = 60000;    // Send data every 60 seconds  
const unsigned long HEARTBEAT_INTERVAL_MS = 300000;   // Status heartbeat every 5 minutes

// Network and Reliability Configuration
const int MAX_HTTP_RETRIES = 3;                    // Maximum HTTP POST retry attempts
const unsigned long HTTP_RETRY_DELAY_MS = 2000;    // Delay between HTTP retry attempts
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 30000; // WiFi connection timeout

// Data Quality and Validation
const float TEMP_MIN = -40.0;    // Minimum valid temperature (°C)
const float TEMP_MAX = 60.0;     // Maximum valid temperature (°C)  
const float HUMIDITY_MIN = 0.0;  // Minimum valid humidity (%)
const float HUMIDITY_MAX = 100.0; // Maximum valid humidity (%)
const float PRESSURE_MIN = 800.0; // Minimum valid pressure (hPa)
const float PRESSURE_MAX = 1100.0; // Maximum valid pressure (hPa)
const float WIND_SPEED_MAX = 100.0; // Maximum valid wind speed (m/s)

// Offline Storage Configuration
const char* QUEUE_FILE = "/readings.json";  // SPIFFS queue file for offline storage
const size_t MAX_QUEUE_ENTRIES = 100;       // Maximum offline readings to store
const size_t QUEUE_SEND_BATCH = 5;         // Send queued data in batches

// MQTT Configuration (Optional)
#define USE_MQTT false                       // Set to true to enable MQTT
const char* MQTT_BROKER = "192.168.8.160";  // MQTT broker IP address
const uint16_t MQTT_PORT = 1883;            // MQTT broker port
const char* MQTT_TOPIC_BASE = "awos/vcbi";  // MQTT topic prefix
const char* MQTT_CLIENT_ID = "awos-esp32-vcbi"; // MQTT client identifier

// ----- End user configuration -----

// Global Variables and Sensor Objects
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BMP280 bmp;

#if USE_MQTT
WiFiClient espClient;
PubSubClient mqttClient(espClient);
#endif

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSend = 0;
unsigned long lastHeartbeat = 0;

// Wind sensor variables
volatile unsigned long windPulseCount = 0;
unsigned long lastWindCountTime = 0;
float windSpeedBuffer[10];  // Moving average buffer
int windSpeedBufferIndex = 0;

// Sensor data structure matching AWOS Dashboard API
struct WeatherReading {
  // Required fields
  String stationId;
  String timestamp;
  
  // Environmental measurements (all optional)
  float temperature = NAN;        // °C
  float humidity = NAN;           // %
  float pressure = NAN;           // hPa
  float windSpeed = NAN;          // m/s
  float windDirection = NAN;      // degrees (0-360)
  float windGust = NAN;          // m/s
  float visibility = NAN;         // meters
  
  // Precipitation (not measured by basic setup)
  float precipitation1h = NAN;    // mm
  float precipitation3h = NAN;    // mm  
  float precipitation6h = NAN;    // mm
  float precipitation24h = NAN;   // mm
  
  // Weather conditions (derived/manual)
  int weatherCode = -1;           // WMO weather code
  String weatherDescription = ""; // Text description
  
  // Cloud data (not measured by basic setup)
  float cloudCoverage = NAN;      // %
  float cloudBase = NAN;          // feet
  
  // Calculated meteorological data
  float dewPoint = NAN;           // °C (calculated from temp/humidity)
  float seaLevelPressure = NAN;   // hPa (calculated from pressure/elevation)
  float altimeterSetting = NAN;   // inHg
  
  // System status
  float batteryVoltage = NAN;     // V
  float solarPanelVoltage = NAN;  // V
  int signalStrength = -999;      // dBm (WiFi RSSI)
  String dataQuality = "good";    // good, fair, poor
};

// Forward declarations
String getISOTimestamp();
float calculateDewPoint(float temp, float humidity);
float readWindSpeed();
float readWindDirection();
bool postPayload(const Payload &p);
void enqueuePayload(const String &jsonLine);
void flushQueuedPayloads();
bool sendJsonString(const String &json);
void ensureQueueLimit();

// Function declarations
String getISOTimestamp();
void windSpeedISR();
WeatherReading readAllSensors();
float readWindSpeed();
float readWindDirection();
float readBatteryVoltage();
float readSolarVoltage();
float calculateDewPoint(float temperature, float humidity);
float calculateSeaLevelPressure(float pressure, float altitude);
bool validateSensorData(WeatherReading& reading);
bool sendWeatherData(const WeatherReading& reading);
void enqueueReading(const WeatherReading& reading);
void processOfflineQueue();
bool postJsonToAPI(const String& jsonPayload);
void connectToWiFi();
void setupNTP();
void printSensorSummary(const WeatherReading& reading);

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n========================================");
  Serial.println("    AWOS Dashboard - ESP32 Weather Station");
  Serial.println("    Compatible with Dashboard API v2025");
  Serial.println("========================================\n");

  // Initialize GPIO pins
  pinMode(POWER_STATUS_PIN, INPUT);
  pinMode(WIND_SPEED_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(WIND_SPEED_PIN), windSpeedISR, FALLING);
  
  // Initialize sensors
  Serial.print("Initializing DHT22 sensor... ");
  dht.begin();
  Serial.println("OK");
  
  Serial.print("Initializing BMP280 sensor... ");
  if (bmp.begin()) {
    Serial.println("OK");
  } else {
    Serial.println("FAILED - pressure readings will be unavailable");
  }

  // Initialize SPIFFS for offline storage
  Serial.print("Initializing SPIFFS... ");
  if (SPIFFS.begin(true)) {
    Serial.println("OK");
  } else {
    Serial.println("FAILED - offline storage disabled");
  }

  // Connect to WiFi
  connectToWiFi();
  
  // Setup network time
  setupNTP();

#if USE_MQTT
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connecting to MQTT broker... ");
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println("Connected");
    } else {
      Serial.println("Failed - continuing without MQTT");
    }
  }
#endif

  // Initialize timing
  lastSensorRead = millis();
  lastDataSend = millis();
  lastHeartbeat = millis();
  
  // Process any offline data if connected
  if (WiFi.status() == WL_CONNECTED) {
    processOfflineQueue();
  }
  
  Serial.println("Setup complete - starting weather monitoring\n");
}

void loop() {
  unsigned long currentTime = millis();

#if USE_MQTT
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    if (WiFi.status() == WL_CONNECTED) {
      mqttClient.connect(MQTT_CLIENT_ID);
    }
  } else {
    mqttClient.loop();
  }
#endif

  // Read sensors at regular intervals
  if (currentTime - lastSensorRead >= SENSOR_READ_INTERVAL_MS) {
    WeatherReading reading = readAllSensors();
    
    // Store the reading (for averaging and data processing)
    lastSensorRead = currentTime;
  }

  // Send data to dashboard at regular intervals
  if (currentTime - lastDataSend >= DATA_SEND_INTERVAL_MS) {
    WeatherReading reading = readAllSensors();
    
    if (validateSensorData(reading)) {
      printSensorSummary(reading);
      
      bool success = sendWeatherData(reading);
      if (success) {
        Serial.println("✓ Data sent successfully to AWOS Dashboard");
        // Process offline queue if we have connectivity
        processOfflineQueue();
      } else {
        Serial.println("✗ Failed to send data - storing offline");
        enqueueReading(reading);
      }
    } else {
      Serial.println("⚠ Sensor data validation failed - skipping transmission");
    }
    
    lastDataSend = currentTime;
  }

  // Heartbeat status
  if (currentTime - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    Serial.printf("\n--- System Status ---\n");
    Serial.printf("Uptime: %lu seconds\n", millis() / 1000);
    Serial.printf("Free heap: %u bytes\n", ESP.getFreeHeap());
    Serial.printf("WiFi status: %s\n", WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
    Serial.printf("RSSI: %d dBm\n", WiFi.RSSI());
    Serial.printf("Station: %s\n", STATION_ID);
    Serial.println("--------------------\n");
    
    lastHeartbeat = currentTime;
  }

  delay(100);  // Small delay to prevent watchdog issues
}

// --- Sensor Reading Functions ---

WeatherReading readAllSensors() {
  WeatherReading reading;
  
  // Read DHT22 temperature and humidity
  reading.temperature = dht.readTemperature();
  reading.humidity = dht.readHumidity();
  
  // Calculate dew point if we have valid temp and humidity
  if (!isnan(reading.temperature) && !isnan(reading.humidity)) {
    reading.dewPoint = calculateDewPoint(reading.temperature, reading.humidity);
  } else {
    reading.dewPoint = NAN;
  }
  
  // Read BMP280 pressure
  if (bmp.begin()) {
    reading.pressure = bmp.readPressure() / 100.0F; // Convert Pa to hPa
  } else {
    reading.pressure = NAN;
  }
  
  // Read wind sensors
  reading.windSpeed = readWindSpeed();
  reading.windDirection = readWindDirection();
  reading.windGust = readWindGust();
  
  // Read power and battery status
  reading.cebPower = digitalRead(POWER_STATUS_PIN) == HIGH;
  reading.batteryVoltage = (analogRead(BATTERY_PIN) * 3.3) / 4095.0; // Convert to voltage
  reading.batteryLevel = map(constrain(reading.batteryVoltage * 100, 0, 330), 0, 330, 0, 100);
  
  // Set metadata
  reading.timestamp = getISOTimestamp();
  reading.stationId = STATION_ID;
  reading.dataQuality = calculateDataQuality(reading);
  
  return reading;
}

bool validateSensorData(const WeatherReading& reading) {
  bool isValid = true;
  
  // Check temperature range
  if (!isnan(reading.temperature)) {
    if (reading.temperature < -50.0 || reading.temperature > 70.0) {
      Serial.println("⚠ Temperature out of range");
      isValid = false;
    }
  }
  
  // Check humidity range
  if (!isnan(reading.humidity)) {
    if (reading.humidity < 0.0 || reading.humidity > 100.0) {
      Serial.println("⚠ Humidity out of range");
      isValid = false;
    }
  }
  
  // Check pressure range
  if (!isnan(reading.pressure)) {
    if (reading.pressure < 900.0 || reading.pressure > 1100.0) {
      Serial.println("⚠ Pressure out of range");
      isValid = false;
    }
  }
  
  // Check wind speed
  if (!isnan(reading.windSpeed)) {
    if (reading.windSpeed < 0.0 || reading.windSpeed > 100.0) {
      Serial.println("⚠ Wind speed out of range");
      isValid = false;
    }
  }
  
  return isValid;
}

void printSensorSummary(const WeatherReading& reading) {
  Serial.println("\n--- Current Weather Conditions ---");
  Serial.printf("Station: %s\n", reading.stationId.c_str());
  Serial.printf("Timestamp: %s\n", reading.timestamp.c_str());
  
  if (!isnan(reading.temperature)) {
    Serial.printf("Temperature: %.1f°C\n", reading.temperature);
  } else {
    Serial.println("Temperature: N/A");
  }
  
  if (!isnan(reading.humidity)) {
    Serial.printf("Humidity: %.1f%%\n", reading.humidity);
  } else {
    Serial.println("Humidity: N/A");
  }
  
  if (!isnan(reading.dewPoint)) {
    Serial.printf("Dew Point: %.1f°C\n", reading.dewPoint);
  } else {
    Serial.println("Dew Point: N/A");
  }
  
  if (!isnan(reading.pressure)) {
    Serial.printf("Pressure: %.1f hPa\n", reading.pressure);
  } else {
    Serial.println("Pressure: N/A");
  }
  
  if (!isnan(reading.windSpeed)) {
    Serial.printf("Wind Speed: %.1f m/s\n", reading.windSpeed);
  } else {
    Serial.println("Wind Speed: N/A");
  }
  
  if (!isnan(reading.windDirection)) {
    Serial.printf("Wind Direction: %.0f°\n", reading.windDirection);
  } else {
    Serial.println("Wind Direction: N/A");
  }
  
  Serial.printf("Power Status: %s\n", reading.cebPower ? "Grid" : "Battery");
  Serial.printf("Battery Level: %d%%\n", reading.batteryLevel);
  Serial.printf("Data Quality: %d%%\n", reading.dataQuality);
  Serial.println("----------------------------------\n");
}

// --- Wind Sensor Functions ---

volatile unsigned long windPulses = 0;
unsigned long lastWindCheck = 0;

void IRAM_ATTR windSpeedISR() {
  windPulses++;
}

float readWindSpeed() {
  unsigned long currentTime = millis();
  unsigned long timeDiff = currentTime - lastWindCheck;
  
  if (timeDiff >= 1000) { // Calculate every second
    // Typical anemometer: 1 pulse per rotation, calibration factor
    float windSpeed = (windPulses * 2.4) / (timeDiff / 1000.0); // m/s
    windPulses = 0;
    lastWindCheck = currentTime;
    return windSpeed;
  }
  
  return NAN; // Return NAN if not enough time has passed
}

float readWindDirection() {
  int sensorValue = analogRead(WIND_DIRECTION_PIN);
  float voltage = (sensorValue * 3.3) / 4095.0;
  
  // Convert voltage to degrees (0-360)
  // This is a placeholder - adjust based on your wind vane specifications
  float degrees = (voltage / 3.3) * 360.0;
  return degrees;
}

float readWindGust() {
  // Placeholder implementation - track maximum wind speed over time window
  static float maxWindSpeed = 0.0;
  static unsigned long gustResetTime = 0;
  
  float currentWind = readWindSpeed();
  if (!isnan(currentWind) && currentWind > maxWindSpeed) {
    maxWindSpeed = currentWind;
  }
  
  // Reset gust measurement every 10 minutes
  if (millis() - gustResetTime > 600000) {
    float gust = maxWindSpeed;
    maxWindSpeed = 0.0;
    gustResetTime = millis();
    return gust;
  }
  
  return maxWindSpeed;
}

int calculateDataQuality(const WeatherReading& reading) {
  int quality = 0;
  int totalSensors = 5; // temp, humidity, pressure, wind speed, wind direction
  
  if (!isnan(reading.temperature)) quality++;
  if (!isnan(reading.humidity)) quality++;
  if (!isnan(reading.pressure)) quality++;
  if (!isnan(reading.windSpeed)) quality++;
  if (!isnan(reading.windDirection)) quality++;
  
  return (quality * 100) / totalSensors;
}

// --- Network and Communication Functions ---

bool sendWeatherData(const WeatherReading& reading) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected - cannot send data");
    return false;
  }
  
  // Create JSON payload matching the AWOS API format
  StaticJsonDocument<512> doc;
  
  if (!isnan(reading.temperature)) doc["temperature"] = reading.temperature;
  if (!isnan(reading.humidity)) doc["humidity"] = reading.humidity;
  if (!isnan(reading.pressure)) doc["pressure"] = reading.pressure;
  if (!isnan(reading.windSpeed)) doc["windSpeed"] = reading.windSpeed;
  if (!isnan(reading.windDirection)) doc["windDirection"] = reading.windDirection;
  if (!isnan(reading.windGust)) doc["windGust"] = reading.windGust;
  if (!isnan(reading.dewPoint)) doc["dewPoint"] = reading.dewPoint;
  
  doc["timestamp"] = reading.timestamp;
  doc["stationId"] = reading.stationId;
  doc["dataQuality"] = reading.dataQuality;
  doc["batteryVoltage"] = reading.batteryVoltage;
  doc["batteryLevel"] = reading.batteryLevel;
  doc["cebPower"] = reading.cebPower;
  
  String payload;
  serializeJson(doc, payload);
  
  return postJsonToAPI(payload);
}

bool postJsonToAPI(const String& jsonPayload) {
  HTTPClient http;
  int attempts = 0;
  
  while (attempts < MAX_HTTP_RETRIES) {
    attempts++;
    
    http.begin(API_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-AWOS-Station/1.0");
    
    int httpCode = http.POST(jsonPayload);
    String response = http.getString();
    http.end();
    
    Serial.printf("HTTP POST attempt %d: %d\n", attempts, httpCode);
    
    if (httpCode >= 200 && httpCode < 300) {
      Serial.println("✓ Data sent successfully");
      Serial.printf("Response: %s\n", response.c_str());
      return true;
    }
    
    // Don't retry client errors (4xx)
    if (httpCode >= 400 && httpCode < 500) {
      Serial.printf("✗ Client error %d: %s\n", httpCode, response.c_str());
      break;
    }
    
    Serial.printf("✗ Server error %d, retrying in %d ms...\n", httpCode, HTTP_RETRY_DELAY_MS * attempts);
    delay(HTTP_RETRY_DELAY_MS * attempts); // Exponential backoff
  }
  
  return false;
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < WIFI_MAX_RETRIES) {
    delay(WIFI_RETRY_DELAY_MS);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.printf("  IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  Signal: %d dBm\n", WiFi.RSSI());
    Serial.printf("  MAC: %s\n", WiFi.macAddress().c_str());
  } else {
    Serial.println("\n✗ WiFi Connection Failed!");
    Serial.printf("Tried %d times over %d seconds\n", attempts, (WIFI_RETRY_DELAY_MS * attempts) / 1000);
  }
}

void setupNTP() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Setting up NTP time synchronization... ");
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    
    // Wait for time sync
    int timeout = 10000; // 10 second timeout
    while (time(nullptr) < 8 * 3600 * 2 && timeout > 0) {
      delay(100);
      timeout -= 100;
    }
    
    if (time(nullptr) > 8 * 3600 * 2) {
      Serial.println("✓ Time synchronized");
      time_t now = time(nullptr);
      Serial.printf("Current time: %s", ctime(&now));
    } else {
      Serial.println("✗ Time sync failed - using system time");
    }
  }
}

// --- Offline Storage Functions ---

void enqueueReading(const WeatherReading& reading) {
  if (!SPIFFS.begin()) {
    Serial.println("SPIFFS not available - cannot store offline data");
    return;
  }
  
  // Create filename with timestamp
  String filename = "/offline_" + String(millis()) + ".json";
  
  File file = SPIFFS.open(filename, "w");
  if (!file) {
    Serial.println("Failed to create offline storage file");
    return;
  }
  
  // Create JSON object
  StaticJsonDocument<512> doc;
  if (!isnan(reading.temperature)) doc["temperature"] = reading.temperature;
  if (!isnan(reading.humidity)) doc["humidity"] = reading.humidity;
  if (!isnan(reading.pressure)) doc["pressure"] = reading.pressure;
  if (!isnan(reading.windSpeed)) doc["windSpeed"] = reading.windSpeed;
  if (!isnan(reading.windDirection)) doc["windDirection"] = reading.windDirection;
  if (!isnan(reading.windGust)) doc["windGust"] = reading.windGust;
  if (!isnan(reading.dewPoint)) doc["dewPoint"] = reading.dewPoint;
  
  doc["timestamp"] = reading.timestamp;
  doc["stationId"] = reading.stationId;
  doc["dataQuality"] = reading.dataQuality;
  doc["batteryVoltage"] = reading.batteryVoltage;
  doc["batteryLevel"] = reading.batteryLevel;
  doc["cebPower"] = reading.cebPower;
  
  serializeJson(doc, file);
  file.close();
  
  Serial.printf("Stored reading offline: %s\n", filename.c_str());
}

void processOfflineQueue() {
  if (!SPIFFS.begin()) return;
  
  File root = SPIFFS.open("/");
  File file = root.openNextFile();
  int processedCount = 0;
  int successCount = 0;
  
  while (file) {
    String fileName = file.name();
    
    if (fileName.startsWith("/offline_") && fileName.endsWith(".json")) {
      processedCount++;
      
      // Read the stored JSON
      String jsonContent = file.readString();
      file.close();
      
      Serial.printf("Processing offline file: %s\n", fileName.c_str());
      
      // Try to send the data
      if (postJsonToAPI(jsonContent)) {
        // Delete the file on successful transmission
        SPIFFS.remove(fileName);
        successCount++;
        Serial.printf("✓ Sent and deleted: %s\n", fileName.c_str());
      } else {
        Serial.printf("✗ Failed to send: %s (keeping for retry)\n", fileName.c_str());
        break; // Stop processing if we can't send (likely connectivity issue)
      }
      
      delay(100); // Small delay between transmissions
    }
    
    file = root.openNextFile();
  }
  
  root.close();
  
  if (processedCount > 0) {
    Serial.printf("Offline queue: processed %d files, sent %d successfully\n", 
                  processedCount, successCount);
  }
}

// --- Utility Functions ---

String getISOTimestamp() {
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char buf[32];
  // YYYY-MM-DDTHH:MM:SSZ (UTC)
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

float calculateDewPoint(float temp, float humidity) {
  // Magnus formula approximation
  if (isnan(temp) || isnan(humidity)) return NAN;
  
  double a = 17.27;
  double b = 237.7;
  double alpha = ((a * temp) / (b + temp)) + log(humidity / 100.0);
  double dew = (b * alpha) / (a - alpha);
  return (float)dew;
}



bool postPayload(const Payload &p) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected - skipping HTTP POST");
    return false;
  }

  StaticJsonDocument<512> doc;
  // Map to the ingestion API fields used by the dashboard
  if (p.temperature != NAN) doc["temperature"] = p.temperature;
  if (p.humidity != NAN) doc["humidity"] = p.humidity;
  if (p.pressure != NAN) doc["pressure"] = p.pressure;
  if (p.windSpeed != NAN) doc["windSpeed"] = p.windSpeed;
  if (p.windDirection != NAN) doc["windDirection"] = p.windDirection;
  if (p.windGust != NAN) doc["windGust"] = p.windGust;
  if (p.batteryLevel >= 0) doc["batteryVoltage"] = p.batteryLevel; // approximate mapping
  doc["timestamp"] = p.timestamp;
  doc["stationId"] = p.stationId;
  doc["dataQuality"] = p.dataQuality;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  int attempts = 0;
  while (attempts < MAX_HTTP_RETRIES) {
    attempts++;
    http.begin(INGEST_URL);
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(payload);
    String resp = http.getString();
    http.end();

    Serial.printf("HTTP POST attempt %d -> code %d\n", attempts, code);
    if (code >= 200 && code < 300) {
      Serial.println("Ingest OK: " + resp);
  return true;
    }

    // For 4xx errors, don't retry
    if (code >= 400 && code < 500) {
      Serial.println("Permanent failure posting payload: " + String(code));
      break;
    }

    delay(HTTP_RETRY_DELAY_MS * attempts); // simple backoff
  }
  // Persist the payload to the offline queue
  StaticJsonDocument<512> doc;
  if (p.temperature != NAN) doc["temperature"] = p.temperature;
  if (p.humidity != NAN) doc["humidity"] = p.humidity;
  if (p.pressure != NAN) doc["pressure"] = p.pressure;
  if (p.windSpeed != NAN) doc["windSpeed"] = p.windSpeed;
  if (p.windDirection != NAN) doc["windDirection"] = p.windDirection;
  if (p.windGust != NAN) doc["windGust"] = p.windGust;
  if (p.batteryLevel >= 0) doc["batteryVoltage"] = p.batteryLevel;
  doc["timestamp"] = p.timestamp;
  doc["stationId"] = p.stationId;
  doc["dataQuality"] = p.dataQuality;

  String payload;
  serializeJson(doc, payload);
  enqueuePayload(payload);

  return false;
}

// Append a JSON line to the SPIFFS queue file (NDJSON)
void enqueuePayload(const String &jsonLine) {
  File f = SPIFFS.open(QUEUE_FILE, FILE_APPEND);
  if (!f) {
    Serial.println("Failed to open queue file for append");
    return;
  }
  f.println(jsonLine);
  f.close();
  Serial.println("Enqueued payload to SPIFFS");
  ensureQueueLimit();
}

// Read the queue file and attempt to send each line. On success, remove that line.
void flushQueuedPayloads() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected - will not flush queue");
    return;
  }

  if (!SPIFFS.exists(QUEUE_FILE)) {
    return; // nothing to do
  }

  File f = SPIFFS.open(QUEUE_FILE, FILE_READ);
  if (!f) {
    Serial.println("Failed to open queue file for reading");
    return;
  }

  std::vector<String> remaining;

  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    bool ok = sendJsonString(line);
    if (!ok) {
      // keep this line for later
      remaining.push_back(line);
      // if network or server is failing, stop trying to avoid long loops
      break;
    }
  }
  f.close();

  // Rewrite the queue file with remaining lines
  File out = SPIFFS.open(QUEUE_FILE, FILE_WRITE);
  if (!out) {
    Serial.println("Failed to open queue file for rewrite");
    return;
  }
  for (const auto &l : remaining) {
    out.println(l);
  }
  out.close();
  Serial.printf("Flushed queue, remaining entries: %u\n", (unsigned)remaining.size());
}

// Send a raw JSON string to INGEST_URL, with a small retry loop
bool sendJsonString(const String &json) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  int attempts = 0;
  while (attempts < 3) {
    attempts++;
    http.begin(INGEST_URL);
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(json);
    String resp = http.getString();
    http.end();
    Serial.printf("Queue POST attempt %d -> code %d\n", attempts, code);
    if (code >= 200 && code < 300) {
      Serial.println("Queued ingest OK: " + resp);
      return true;
    }
    if (code >= 400 && code < 500) {
      Serial.println("Permanent failure sending queued payload: " + String(code));
      return true; // drop it to avoid stuck queue on bad payload
    }
    delay(1000 * attempts);
  }
  return false;
}

// Ensure the queue file has no more than MAX_QUEUE_ENTRIES lines
void ensureQueueLimit() {
  if (!SPIFFS.exists(QUEUE_FILE)) return;
  File f = SPIFFS.open(QUEUE_FILE, FILE_READ);
  if (!f) return;
  std::vector<String> lines;
  while (f.available()) {
    String l = f.readStringUntil('\n');
    l.trim();
    if (l.length()) lines.push_back(l);
  }
  f.close();

  if (lines.size() <= MAX_QUEUE_ENTRIES) return;
  // keep the most recent MAX_QUEUE_ENTRIES
  size_t start = lines.size() - MAX_QUEUE_ENTRIES;
  File out = SPIFFS.open(QUEUE_FILE, FILE_WRITE);
  if (!out) return;
  for (size_t i = start; i < lines.size(); ++i) out.println(lines[i]);
  out.close();
  Serial.printf("Trimmed queue to %u entries\n", (unsigned)MAX_QUEUE_ENTRIES);
}
