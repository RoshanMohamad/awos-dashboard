
/*
  AWOS Dashboard - ESP32 integration sketch

  Features:
  - Connects to WiFi and syncs time via NTP (configTime)
  - Reads DHT22 and BMP280 (replace or remove if hardware differs)
  - Mockable wind speed/direction reads (hooks for your sensors)
  - Posts JSON to the backend ingestion endpoint `/api/ingest` with retry
  - Optional MQTT publish (set USE_MQTT to true and configure broker)

  Libraries required:
  - WiFi.h (built-in)
  - HTTPClient.h (built-in)
  - ArduinoJson
  - DHT (for DHT sensor)
  - Adafruit_BMP280 (and Adafruit_Sensor)
  - PubSubClient (optional, for MQTT)

  Notes:
  - Update WiFi credentials and INGEST_URL before flashing
  - This sketch focuses on reliable HTTP ingestion and is intentionally
    simple to keep resource usage low on the ESP32.
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

// ----- User configuration -----
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Full URL to your ingestion endpoint. Use HTTPS if your server has TLS.
// Example: http://192.168.1.100:3000/api/ingest or https://yourdomain.com/api/ingest
const char* INGEST_URL = "http://host.docker.internal:3000/api/ingest";

// Station / device identifier
const char* STATION_ID = "VCBI";

// Sensor pins and types
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define WIND_SPEED_PIN 2
#define WIND_DIRECTION_PIN A0
#define BATTERY_PIN A1
#define CEB_POWER_PIN 5

// Timing
const unsigned long SENSOR_INTERVAL_MS = 5000; // 5s between reads
const unsigned long HEARTBEAT_INTERVAL_MS = 60000; // 60s heartbeat

// Retry settings for HTTP POST
const int MAX_HTTP_RETRIES = 5;
const unsigned long HTTP_RETRY_DELAY_MS = 3000;

// Offline queue (SPIFFS)
const char* QUEUE_FILE = "/queue.ndjson"; // newline-delimited JSON
const size_t MAX_QUEUE_ENTRIES = 200;      // cap queue to avoid filling flash

// MQTT (optional)
const char* MQTT_BROKER = "192.168.1.10";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_TOPIC = "awos/readings/VCBI";

// ----- End user configuration -----

// Sensor objects
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_BMP280 bmp;

#if USE_MQTT
WiFiClient espClient;
PubSubClient mqttClient(espClient);
#endif

unsigned long lastSensorMillis = 0;
unsigned long lastHeartbeatMillis = 0;

// Simple structure to build payload
struct Payload {
  String stationId;
  String timestamp;
  float temperature = NAN;
  float humidity = NAN;
  float pressure = NAN;
  float windSpeed = NAN;
  float windDirection = NAN;
  float windGust = NAN;
  int batteryLevel = -1;
  bool cebPower = false;
  String dataQuality = "good";
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

void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(CEB_POWER_PIN, INPUT);
  pinMode(WIND_SPEED_PIN, INPUT_PULLUP);

  dht.begin();
  if (!bmp.begin()) {
    Serial.println("Warning: BMP280 not found. Pressure readings will be NAN.");
  }

  // Connect to WiFi
  Serial.printf("Connecting to WiFi '%s'...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
    if (millis() - start > 20000) break; // timeout
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connect failed - continuing offline. HTTP will fail until reconnected.");
  }

  // Initialize SPIFFS for offline queue
  if (!SPIFFS.begin(true)) {
    Serial.println("Failed to mount SPIFFS");
  } else {
    Serial.println("SPIFFS mounted");
  }

  // Setup NTP time (UTC)
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Waiting for NTP time sync...");
  time_t now = time(nullptr);
  int retries = 0;
  while (now < 24 * 3600 && retries < 10) {
    delay(1000);
    Serial.print('+');
    now = time(nullptr);
    retries++;
  }
  Serial.println();
  if (now < 24 * 3600) {
    Serial.println("NTP sync failed - timestamps will be approximate.");
  } else {
    Serial.println("NTP time acquired: " + getISOTimestamp());
  }

#if USE_MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  // Attempt MQTT connect (non-blocking style)
  if (WiFi.status() == WL_CONNECTED) {
    if (mqttClient.connect("esp32-awos")) {
      Serial.println("MQTT connected");
    } else {
      Serial.println("MQTT connect failed");
    }
  }
#endif

  lastSensorMillis = millis();
  lastHeartbeatMillis = millis();

  // Attempt to flush any queued payloads on startup if network is available
  if (WiFi.status() == WL_CONNECTED) {
    flushQueuedPayloads();
  }
}

void loop() {
  unsigned long now = millis();

#if USE_MQTT
  if (!mqttClient.connected()) {
    if (WiFi.status() == WL_CONNECTED) mqttClient.connect("esp32-awos");
  } else {
    mqttClient.loop();
  }
#endif

  if (now - lastSensorMillis >= SENSOR_INTERVAL_MS) {
    Payload p;
    p.stationId = STATION_ID;
    p.timestamp = getISOTimestamp();

    // Read temperature/humidity
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) p.temperature = t;
    if (!isnan(h)) p.humidity = h;

    // Dew point calculation optionally done server-side; included here for completeness
    float dew = NAN;
    if (!isnan(t) && !isnan(h)) dew = calculateDewPoint(t, h);

    // Pressure
    if (bmp.begin()) {
      float pres = bmp.readPressure() / 100.0F; // hPa
      p.pressure = pres;
    }

    // Wind sensors (mock/placeholder - replace with real sensor interface)
    p.windSpeed = readWindSpeed();
    p.windDirection = readWindDirection();

    // Battery and power
    p.cebPower = digitalRead(CEB_POWER_PIN) == HIGH;
    p.batteryLevel = map(analogRead(BATTERY_PIN), 0, 4095, 0, 100);

    // Publish locally via MQTT if enabled
#if USE_MQTT
    if (mqttClient.connected()) {
      StaticJsonDocument<512> mqttDoc;
      mqttDoc["stationId"] = p.stationId;
      mqttDoc["timestamp"] = p.timestamp;
      mqttDoc["temperature"] = isnan(p.temperature) ? nullptr : p.temperature;
      mqttDoc["humidity"] = isnan(p.humidity) ? nullptr : p.humidity;
      String out;
      serializeJson(mqttDoc, out);
      mqttClient.publish(MQTT_TOPIC, out.c_str());
    }
#endif

    // Try HTTP POST with simple retry
    bool ok = postPayload(p);
    if (!ok) {
      Serial.println("Failed to POST payload after retries - queued for later");
      // The postPayload function enqueues on failure, so nothing else to do here.
    } else {
      // If this post succeeded, attempt to flush any queued payloads
      flushQueuedPayloads();
    }

    lastSensorMillis = now;
  }

  if (now - lastHeartbeatMillis >= HEARTBEAT_INTERVAL_MS) {
    Serial.printf("Heartbeat: uptime %lus, freeHeap %u\n", millis() / 1000UL, ESP.getFreeHeap());
    lastHeartbeatMillis = now;
  }

  delay(10);
}

// --- Helpers ---

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
  // Magnus formula
  double a = 17.27;
  double b = 237.7;
  double alpha = ((a * temp) / (b + temp)) + log(humidity / 100.0);
  double dew = (b * alpha) / (a - alpha);
  return (float)dew;
}

// Simple placeholder wind speed reader: replace with pulses or anemometer interface
float readWindSpeed() {
  // This mock returns a small fluctuating value so the dashboard shows activity.
  static float v = 2.0;
  v += ((float)random(-10, 11)) / 100.0;
  if (v < 0) v = 0;
  return v; // m/s (calibrate for your sensor)
}

float readWindDirection() {
  int raw = analogRead(WIND_DIRECTION_PIN);
  float deg = (raw / 4095.0) * 360.0;
  return deg;
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
