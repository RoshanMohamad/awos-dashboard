/*
 * AWOS Dashboard - ESP32 Weather Station
 * Compatible with Dashboard API v2025
 * 
 * This code collects weather sensor data and sends it to the AWOS Dashboard
 * Supports offline storage and automatic reconnection
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - DHT22 Temperature/Humidity Sensor
 * - BMP280 Pressure Sensor (I2C)
 * - Wind Speed Sensor (optional)
 * - Wind Direction Sensor (optional)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Adafruit_BMP280.h>
#include <SPIFFS.h>
#include <time.h>

// ----- User Configuration Section -----
// WiFi Settings - UPDATE THESE WITH YOUR NETWORK
const char* WIFI_SSID = "YOUR_WIFI_SSID";           // Replace with your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";    // Replace with your WiFi password

// AWOS Dashboard API Configuration  
const char* DASHBOARD_URL = "https://awos-dashboard.vercel.app";
const char* API_ENDPOINT = "https://awos-dashboard.vercel.app/api/ingest";

// Weather Station Configuration
const char* STATION_ID = "VCBI";  // Your airport/station identifier (ICAO code)
const float STATION_LATITUDE = 6.8211;   // Colombo coordinates (replace with your location)
const float STATION_LONGITUDE = 79.8878;
const int STATION_ELEVATION_M = 7;        // Elevation in meters

// Hardware Pin Configuration - ADJUST FOR YOUR BOARD
#define DHT_PIN 4              // DHT22 temperature/humidity sensor
#define DHT_TYPE DHT22         // DHT sensor type
#define WIND_SPEED_PIN 2       // Wind speed pulse sensor (interrupt capable pin)
#define WIND_DIRECTION_PIN 36  // Wind direction analog sensor (GPIO36 = A0 on many ESP32 boards)
#define BATTERY_PIN 39         // Battery voltage monitor (GPIO39 = A3 on many ESP32 boards)
#define SOLAR_PIN 34           // Solar panel voltage monitor (GPIO34 = A2 on many ESP32 boards)
#define POWER_STATUS_PIN 5     // External power status (HIGH = power available)

// I2C Configuration for BMP280
#define BMP_SDA 21             // I2C SDA pin (ESP32 default)
#define BMP_SCL 22             // I2C SCL pin (ESP32 default)
#define BMP_ADDR 0x76          // BMP280 I2C address (0x76 or 0x77)

// Sensor Calibration Constants
#define WIND_SPEED_CALIBRATION 2.4    // Pulses per second to m/s conversion
#define WIND_DIR_OFFSET 0.0          // Wind direction offset correction (degrees)
#define BATTERY_VOLTAGE_DIVIDER 11.0  // Voltage divider ratio for battery
#define SOLAR_VOLTAGE_DIVIDER 11.0   // Voltage divider ratio for solar panel

// Timing Configuration
const unsigned long SENSOR_READ_INTERVAL_MS = 10000;  // Read sensors every 10 seconds
const unsigned long DATA_SEND_INTERVAL_MS = 60000;    // Send data every 60 seconds  
const unsigned long HEARTBEAT_INTERVAL_MS = 300000;   // Status heartbeat every 5 minutes

// Network Configuration
const int WIFI_MAX_RETRIES = 20;         // Maximum WiFi connection attempts
const int WIFI_RETRY_DELAY_MS = 500;     // Delay between WiFi retry attempts
const int HTTP_TIMEOUT_MS = 10000;       // HTTP request timeout
const int HTTP_RETRY_DELAY_MS = 2000;    // Delay between HTTP retries
const int MAX_HTTP_RETRIES = 3;          // Maximum HTTP retry attempts

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

// ----- End User Configuration -----

// Data Structures
struct WeatherReading {
  String timestamp;
  String stationId;
  float temperature;        // Celsius
  float humidity;          // Percentage
  float pressure;          // hPa
  float windSpeed;         // m/s
  float windDirection;     // degrees
  float windGust;          // m/s
  float dewPoint;          // Celsius
  float batteryVoltage;    // Volts
  int batteryLevel;        // Percentage
  bool cebPower;           // Grid power status
  int dataQuality;         // Data quality percentage
};

// Global Variables and Sensor Objects
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BMP280 bmp;
HTTPClient http;

// Timing variables
unsigned long lastSensorRead = 0;
unsigned long lastDataSend = 0;
unsigned long lastHeartbeat = 0;

// Wind sensor variables
volatile unsigned long windPulses = 0;
unsigned long lastWindCheck = 0;

// Function Declarations
WeatherReading readAllSensors();
bool validateSensorData(const WeatherReading& reading);
bool sendWeatherData(const WeatherReading& reading);
bool postJsonToAPI(const String& jsonPayload);
void connectToWiFi();
void setupNTP();
void printSensorSummary(const WeatherReading& reading);
float readWindSpeed();
float readWindDirection();
float readWindGust();
int calculateDataQuality(const WeatherReading& reading);
float calculateDewPoint(float temp, float humidity);
String getISOTimestamp();
void enqueueReading(const WeatherReading& reading);
void processOfflineQueue();

// Wind speed interrupt handler
void IRAM_ATTR windSpeedISR() {
  windPulses++;
}

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
  if (bmp.begin(BMP_ADDR)) {
    Serial.println("OK");
    // Configure BMP280 for weather monitoring
    bmp.setSampling(Adafruit_BMP280::MODE_NORMAL,
                    Adafruit_BMP280::SAMPLING_X2,      // Temp oversampling
                    Adafruit_BMP280::SAMPLING_X16,     // Pressure oversampling
                    Adafruit_BMP280::FILTER_X16,       // Filtering
                    Adafruit_BMP280::STANDBY_MS_500);  // Standby time
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
    if (WiFi.status() == WL_CONNECTED) {
      Serial.printf("RSSI: %d dBm\n", WiFi.RSSI());
      Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
    }
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
  reading.pressure = bmp.readPressure() / 100.0F; // Convert Pa to hPa
  
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

float readWindSpeed() {
  unsigned long currentTime = millis();
  unsigned long timeDiff = currentTime - lastWindCheck;
  
  if (timeDiff >= 1000) { // Calculate every second
    // Typical anemometer: 1 pulse per rotation, calibration factor
    float windSpeed = (windPulses * WIND_SPEED_CALIBRATION) / (timeDiff / 1000.0); // m/s
    windPulses = 0;
    lastWindCheck = currentTime;
    return windSpeed;
  }
  
  // Return small test value if not enough time has passed
  return 2.0 + (random(-100, 100) / 100.0); // Simulated wind for testing
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
    http.setTimeout(HTTP_TIMEOUT_MS);
    
    int httpCode = http.POST(jsonPayload);
    String response = http.getString();
    http.end();
    
    Serial.printf("HTTP POST attempt %d: %d\n", attempts, httpCode);
    
    if (httpCode >= 200 && httpCode < 300) {
      Serial.println("✓ Data sent successfully");
      if (response.length() < 200) { // Only print short responses
        Serial.printf("Response: %s\n", response.c_str());
      }
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
  if (!root) return;
  
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
