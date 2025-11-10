/*
 * -----------------------------------------------------------------------------
 * ESP32 AWOS Receiver (Wi-Fi) — FIXED VERSION for Next.js Dashboard
 * - Readable format parsing (e.g., "Temp: 29.4 °C, Hum: 70 % , ...")
 * - Wi-Fi + WebServer (/, /data, /status)
 * - Next.js HTTPS POST (JSON) - FIXED to match API expectations
 * - OLED pages with Page x/7, rotary encoder
 * - Serial2 <- Nano (readable lines), Serial1 -> Nano (CSV for SD)
 * -----------------------------------------------------------------------------
 * 🔧 KEY FIXES:
 * 1. Changed field names to match Next.js API exactly
 * 2. Ensured all numeric values are sent as numbers, not strings
 * 3. Added better error handling and logging
 * 4. Fixed extractNumber() to handle all edge cases
 * -----------------------------------------------------------------------------
 * Libraries:
 *  - WiFi.h, WebServer.h, HTTPClient.h
 *  - ArduinoJson
 *  - Adafruit SSD1306 + GFX
 * -----------------------------------------------------------------------------
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SPI.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ================== OLED ==================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
TwoWire I2COLED = TwoWire(0);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &I2COLED, -1);

// ================== Pins ==================
#define CLK 13
#define DT 14
#define SW 25

#define RXD2 16   // Serial2 RX (from Nano - Readable format)
#define TXD2 17   // Serial2 TX (optional back to Nano)
#define RXD1 33   // Serial1 RX (unused)
#define TXD1 32   // Serial1 TX (to Nano for SD CSV)

// ================== Wi-Fi / Next.js ==================
const char* ssid     = "SakuriA52s";
const char* password = "sanji614";

// 🔧 IMPORTANT: Your Next.js deployment URL
const char* NEXTJS_BASE_URL     = "https://awos-dashboard.vercel.app";
const char* NEXTJS_ESP32_PATH   = "/api/esp32";
const uint32_t NEXTJS_TIMEOUT_MS = 15000;

// ================== Web Server ==================
WebServer server(80);
HTTPClient http;

// ================== Data (readable-format strings) ==================
String utcDate = "";
String utcTime = "";
String latitude = "";
String longitude = "";
String temperature = "";
String humidity = "";
String pressure = "";
String dewPoint = "";
String windSpeed = "";
String windDirection = "";
String voltage = "";
String currentV = "";
String power = "";
String powerStatus = "";
String commMode = "";

// ================== Control / Status ==================
bool wifiConnected = false;
bool nanoConnected = false;

bool buttonPressed = false;
int  page = 0;
int  lastClkState;

unsigned long lastOLEDUpdate = 0;
unsigned long lastDataSend = 0;
unsigned long lastNanoData = 0;
unsigned long lastNextJSPost = 0;

int nextJSPostErrors = 0;
int nextJSPostSuccess = 0;

const unsigned long oledUpdateInterval = 1000;   // 1s
const unsigned long dataSendInterval   = 30000;  // 30s -> CSV to Nano
const unsigned long nextJSPostInterval = 10000;  // 10s -> POST to Next.js
const unsigned long nanoTimeout        = 10000;  // 10s -> Nano presence

// ================== Forward Decls ==================
void displayStartupMessage();
void updateOLEDDisplay();
void handleEncoder();
void handleSerialInput();
void sendDataToNano();
String getLocalTime();
String buildAWOSHTMLResponse();
float extractNumberFloat(String input);
int extractNumberInt(String input);
String extractValueFromReadable(String data, String key);
String checkField(String f);
void setupWiFi();
void setupWebServer();
void postToNextJS();
void serveWebRequests();

// ================== Setup ==================
void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);  // from Nano (readable lines)
  Serial1.begin(9600, SERIAL_8N1, RXD1, TXD1);  // to Nano (CSV for SD)

  // I2C / OLED
  I2COLED.begin(4, 15);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("❌ OLED init failed!");
  } else {
    Serial.println("✅ OLED initialized");
  }

  // Encoder
  pinMode(CLK, INPUT_PULLUP);
  pinMode(DT,  INPUT_PULLUP);
  pinMode(SW,  INPUT_PULLUP);
  lastClkState = digitalRead(CLK);

  displayStartupMessage();

  // Wi-Fi + Web
  setupWiFi();
  setupWebServer();

  Serial.println("=================================");
  Serial.println("System initialization complete");
  Serial.println("Waiting for READABLE data from Arduino Nano...");
  Serial.println("=================================");
}

// ================== Loop ==================
void loop() {
  handleEncoder();
  handleSerialInput();     // updates nanoConnected + fields

  // Nano connection timeout
  if (millis() - lastNanoData > nanoTimeout && lastNanoData > 0) {
    if (nanoConnected) {
      nanoConnected = false;
      Serial.println("[Nano] ❌ Disconnected (timeout)");
    }
  }

  // Local web serving
  serveWebRequests();

  // OLED
  updateOLEDDisplay();

  // Periodic CSV to Nano (for SD logging)
  if (utcDate != "" && utcTime != "" && latitude != "" && longitude != "" &&
      millis() - lastDataSend > dataSendInterval) {
    sendDataToNano();
    lastDataSend = millis();
  }

  // Periodic POST to Next.js
  if (wifiConnected &&
      (millis() - lastNextJSPost > nextJSPostInterval) &&
      temperature.length() > 0 && humidity.length() > 0) {
    postToNextJS();
    lastNextJSPost = millis();
  }
}

// ================== Wi-Fi / Web ==================
void setupWiFi() {
  Serial.println("[WiFi] Connecting...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(250);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.printf("[WiFi] ✅ Connected → IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.print("[NextJS] Endpoint: ");
    Serial.println(String(NEXTJS_BASE_URL) + String(NEXTJS_ESP32_PATH));
  } else {
    wifiConnected = false;
    Serial.println("[WiFi] ❌ Failed to connect");
  }
}

void setupWebServer() {
  server.on("/", []() {
    String html = buildAWOSHTMLResponse();
    server.send(200, "text/html", html);
  });

  server.on("/data", []() {
    DynamicJsonDocument json(1024);
    json["utcDate"] = utcDate;
    json["utcTime"] = utcTime;
    json["latitude"] = latitude;
    json["longitude"] = longitude;
    json["temperature"] = temperature;
    json["humidity"] = humidity;
    json["pressure"] = pressure;
    json["dewPoint"] = dewPoint;
    json["windSpeed"] = windSpeed;
    json["windDirection"] = windDirection;
    json["voltage"] = voltage;
    json["current"] = currentV;
    json["power"] = power;
    json["powerStatus"] = powerStatus;
    json["commMode"] = commMode;
    json["wifiConnected"] = wifiConnected;
    json["nanoConnected"] = nanoConnected;
    json["nextJSErrors"] = nextJSPostErrors;
    json["nextJSSuccess"] = nextJSPostSuccess;

    String out; serializeJson(json, out);
    server.send(200, "application/json", out);
  });

  server.on("/status", []() {
    DynamicJsonDocument json(512);
    json["device"] = "ESP32-AWOS-Receiver-WiFi";
    json["version"] = "2.2-FIXED";
    json["uptime_ms"] = millis();
    json["freeHeap"] = ESP.getFreeHeap();
    json["wifiRSSI"] = WiFi.RSSI();
    json["wifiConnected"] = wifiConnected;
    json["nanoConnected"] = nanoConnected;
    json["nextJSErrors"] = nextJSPostErrors;
    json["nextJSSuccess"] = nextJSPostSuccess;
    json["endpoint"] = String(NEXTJS_BASE_URL) + String(NEXTJS_ESP32_PATH);

    String out; serializeJson(json, out);
    server.send(200, "application/json", out);
  });

  server.begin();
  Serial.println("[Web] ✅ Server started on port 80");
}

void serveWebRequests() {
  server.handleClient();
}

// ================== Serial (Readable) ==================
void handleSerialInput() {
  // Handle Serial2 input - receives READABLE FORMAT from Arduino Nano
  while (Serial2.available()) {
    String line = Serial2.readStringUntil('\n');
    line.trim();

    if (line.length() > 0) {
      lastNanoData = millis();
      nanoConnected = true;

      Serial.println("[Nano] ⬇️ " + line);

      // Parse the readable format data
      String low = line; low.toLowerCase();

      if (low.indexOf("temp:") >= 0)       { temperature  = extractValueFromReadable(line, "Temp:"); }
      if (low.indexOf("hum:")  >= 0)       { humidity     = extractValueFromReadable(line, "Hum:"); }
      if (low.indexOf("pres:") >= 0 || low.indexOf("press:") >= 0) { 
        pressure = extractValueFromReadable(line, "Press:"); 
        if (pressure == "") pressure = extractValueFromReadable(line, "Pres:");
      }
      if (low.indexOf("dew:")  >= 0)       { dewPoint     = extractValueFromReadable(line, "Dew:"); }
      if (low.indexOf("ws:")   >= 0)       { windSpeed    = extractValueFromReadable(line, "WS:"); }
      if (low.indexOf("wd:")   >= 0)       { windDirection= extractValueFromReadable(line, "WD:"); }
      if (low.indexOf("lat:") >= 0 || low.indexOf("latitude:")  >= 0)  { 
        latitude = extractValueFromReadable(line, "Lat:"); 
        if (latitude == "") latitude = extractValueFromReadable(line, "Latitude:");
      }
      if (low.indexOf("long:") >= 0 || low.indexOf("longitude:") >= 0)  { 
        longitude = extractValueFromReadable(line, "Long:"); 
        if (longitude == "") longitude = extractValueFromReadable(line, "Longitude:");
      }
      if (low.indexOf("volt:") >= 0 || low.indexOf("v:") >= 0)       { 
        voltage = extractValueFromReadable(line, "V:"); 
        if (voltage == "") voltage = extractValueFromReadable(line, "Volt:");
      }
      if (low.indexOf("cur:") >= 0 || low.indexOf("c:") >= 0)  { 
        currentV = extractValueFromReadable(line, "C:"); 
        if (currentV == "") currentV = extractValueFromReadable(line, "Cur:");
      }
      if (low.indexOf("pow:") >= 0 || low.indexOf("p:") >= 0)  { 
        power = extractValueFromReadable(line, "P:"); 
        if (power == "") power = extractValueFromReadable(line, "Pow:");
      }
      if (low.indexOf("utc date:") >= 0 || low.indexOf("ud:") >= 0)   { 
        utcDate = extractValueFromReadable(line, "UD:"); 
        if (utcDate == "") utcDate = extractValueFromReadable(line, "UTC Date:");
      }
      if (low.indexOf("utc time:") >= 0 || low.indexOf("ut:") >= 0)   { 
        utcTime = extractValueFromReadable(line, "UT:"); 
        if (utcTime == "") utcTime = extractValueFromReadable(line, "UTC Time:");
      }
      if (low.indexOf("ps:") >= 0 || low.indexOf("powerstatus:") >= 0)         { 
        powerStatus = extractValueFromReadable(line, "PS:"); 
        if (powerStatus == "") powerStatus = extractValueFromReadable(line, "PowerStatus:");
      }
      if (low.indexOf("comm:") >= 0 || low.indexOf("mode:") >= 0) {
        commMode = extractValueFromReadable(line, "Comm:");
        if (commMode == "") commMode = extractValueFromReadable(line, "Mode:");
      }
    }
  }
}

// Case-insensitive key → value (until comma/newline)
String extractValueFromReadable(String data, String key) {
  String dataLower = data, keyLower = key;
  dataLower.toLowerCase(); keyLower.toLowerCase();

  int idx = dataLower.indexOf(keyLower);
  if (idx == -1) {
    // try manual case-insensitive scan
    for (int i = 0; i <= data.length() - key.length(); i++) {
      if (data.substring(i, i + key.length()).equalsIgnoreCase(key)) {
        idx = i; break;
      }
    }
    if (idx == -1) return "";
  }

  int startIndex = idx + key.length();
  while (startIndex < (int)data.length() && data.charAt(startIndex) == ' ') startIndex++;

  int endIndex = startIndex;
  while (endIndex < (int)data.length() &&
         data.charAt(endIndex) != ',' &&
         data.charAt(endIndex) != '\n' &&
         data.charAt(endIndex) != '\r') {
    endIndex++;
  }

  String value = data.substring(startIndex, endIndex);
  value.trim();
  return value;
}

// ================== Next.js POST (FIXED) ==================
void postToNextJS() {
  if (!wifiConnected) return;

  // 🔧 VALIDATION: Only send if we have at least temperature data
  if (temperature.length() == 0) {
    Serial.println("[NextJS] ⚠️ Skipping POST - no temperature data");
    return;
  }

  String url = String(NEXTJS_BASE_URL) + String(NEXTJS_ESP32_PATH);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AWOS-Station/2.2-FIXED");
  http.setTimeout(NEXTJS_TIMEOUT_MS);

  // 🔧 FIXED: Convert strings to proper numbers
  float tempVal = extractNumberFloat(temperature);
  float humVal = extractNumberFloat(humidity);
  float presVal = extractNumberFloat(pressure);
  float dewVal = extractNumberFloat(dewPoint);
  float wsVal = extractNumberFloat(windSpeed);
  int wdVal = extractNumberInt(windDirection);
  float latVal = extractNumberFloat(latitude);
  float lngVal = extractNumberFloat(longitude);
  float voltVal = extractNumberFloat(voltage);
  float currVal = extractNumberFloat(currentV);
  float powVal = extractNumberFloat(power);

  // 🔧 CRITICAL: Build JSON with exact field names matching Next.js API
  DynamicJsonDocument doc(1024);
  doc["stationId"]     = "VCBI";  // 🔧 FIXED: Use standard ID without -ESP32 suffix
  
  // 🔧 Only include date/time if we have them
  if (utcDate.length() > 0) doc["utcDate"] = utcDate;
  if (utcTime.length() > 0) doc["utcTime"] = utcTime;
  
  // 🔧 Core weather data (REQUIRED by API)
  doc["temperature"]   = tempVal;
  doc["humidity"]      = humVal;
  doc["pressure"]      = presVal;
  doc["dewPoint"]      = dewVal;
  doc["windSpeed"]     = wsVal;
  doc["windDirection"] = wdVal;
  
  // 🔧 GPS coordinates (optional)
  if (latVal != 0.0) doc["lat"] = latVal;
  if (lngVal != 0.0) doc["lng"] = lngVal;
  
  // 🔧 Power data (optional)
  if (voltVal != 0.0) doc["voltage"] = voltVal;
  if (currVal != 0.0) doc["current"] = currVal;
  if (powVal != 0.0) doc["power"] = powVal;
  if (powerStatus.length() > 0) doc["powerStatus"] = powerStatus;
  if (commMode.length() > 0) doc["commMode"] = commMode;

  String payload; 
  serializeJson(doc, payload);

  // 🔧 DEBUG: Print what we're sending
  Serial.println("[NextJS] 📤 Sending POST:");
  Serial.println(payload);

  int code = http.POST(payload);
  String response = http.getString();
  
  Serial.printf("[NextJS] 📥 HTTP %d\n", code);
  Serial.println("[NextJS] Response: " + response);

  if (code > 0) {
    if (code == 200 || code == 201 || code == 202) {
      nextJSPostErrors = 0;
      nextJSPostSuccess++;
      Serial.println("[NextJS] ✅ POST success!");
      Serial.println("[NextJS] Data confirmed received by server");
    } else {
      nextJSPostErrors++;
      Serial.printf("[NextJS] ⚠️ POST returned %d\n", code);
    }
  } else {
    nextJSPostErrors++;
    Serial.printf("[NextJS] ❌ POST error: %d\n", code);
  }
  http.end();
}

// ================== OLED / UI ==================
void displayStartupMessage() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("AWOS Starting...");
  display.println("Wi-Fi Receiver Mode");
  display.println("Next.js Dashboard");
  display.println("FIXED Version 2.2");
  display.println("Initializing...");
  display.display();
  delay(1800);
}

void handleEncoder() {
  int currentClk = digitalRead(CLK);
  if (currentClk != lastClkState) {
    if (digitalRead(DT) != currentClk) page++;
    else page--;

    if (page < 0) page = 6;
    if (page > 6) page = 0;

    lastClkState = currentClk;
    Serial.println("[UI] Page: " + String(page + 1));
  }

  if (digitalRead(SW) == LOW && !buttonPressed) {
    buttonPressed = true;
    page = 0;
    Serial.println("[UI] Button → Home");
  } else if (digitalRead(SW) == HIGH) {
    buttonPressed = false;
  }
}

void updateOLEDDisplay() {
  if (millis() - lastOLEDUpdate < oledUpdateInterval) return;
  lastOLEDUpdate = millis();

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  switch (page) {
    case 0:
      display.println("=== SYSTEM INFO ===");
      display.println("IP: " + String(wifiConnected ? WiFi.localIP().toString() : "N/A"));
      display.println("UTC Date: " + checkField(utcDate));
      display.println("UTC Time: " + checkField(utcTime));
      display.println("Local: " + getLocalTime());
      display.println("WiFi:" + String(wifiConnected ? "OK" : "ERR") +
                      " Nano:" + String(nanoConnected ? "OK" : "ERR"));
      display.println("NextJS: OK:" + String(nextJSPostSuccess) + " ERR:" + String(nextJSPostErrors));
      display.println("Page 1/7");
      break;

    case 1:
      display.println("=== POWER STATUS ===");
      display.println("Voltage: " + checkField(voltage));
      display.println("Current: " + checkField(currentV));
      display.println("Power: " + checkField(power));
      display.println("Status: " + checkField(powerStatus));
      display.println("Comm: " + checkField(commMode));
      display.println("Page 2/7");
      break;

    case 2:
      display.println("=== TEMPERATURE ===");
      display.println("Temperature:");
      display.println("  " + checkField(temperature));
      display.println("Dew Point:");
      display.println("  " + checkField(dewPoint));
      display.println("Page 3/7");
      break;

    case 3:
      display.println("=== HUMIDITY ===");
      display.println("Humidity:");
      display.println("  " + checkField(humidity));
      display.println("Page 4/7");
      break;

    case 4:
      display.println("=== PRESSURE ===");
      display.println("Pressure:");
      display.println("  " + checkField(pressure));
      display.println("Page 5/7");
      break;

    case 5:
      display.println("=== WIND DATA ===");
      display.println("Wind Speed:");
      display.println("  " + checkField(windSpeed));
      display.println("Wind Direction:");
      display.println("  " + checkField(windDirection));
      display.println("Page 6/7");
      break;

    case 6:
      display.println("=== LOCATION ===");
      display.println("Latitude:");
      display.println("  " + checkField(latitude));
      display.println("Longitude:");
      display.println("  " + checkField(longitude));
      display.println("Page 7/7");
      break;
  }

  display.display();
}

// ================== Helpers ==================
String getLocalTime() {
  if (utcTime.length() < 5) return "N/A";
  int colonIndex = utcTime.indexOf(':');
  if (colonIndex == -1) return "N/A";
  int h = utcTime.substring(0, colonIndex).toInt();
  int m = utcTime.substring(colonIndex + 1).toInt();

  h += 5; m += 30;
  if (m >= 60) { m -= 60; h++; }
  if (h >= 24) h -= 24;

  char buf[8];
  sprintf(buf, "%02d:%02d", h, m);
  return String(buf);
}

String checkField(String f) {
  return (f.length() > 0) ? f : "N/A";
}

// 🔧 FIXED: Robust number extraction for floats
float extractNumberFloat(String input) {
  if (input.length() == 0) return 0.0;
  
  String result = "";
  bool decimalFound = false;
  bool signAllowed = true;
  bool hasDigit = false;

  for (int i = 0; i < input.length(); i++) {
    char c = input.charAt(i);
    
    if (isDigit(c)) {
      result += c;
      hasDigit = true;
      signAllowed = false;
    } else if (c == '.' && !decimalFound && (hasDigit || i + 1 < input.length())) {
      result += c;
      decimalFound = true;
      signAllowed = false;
    } else if ((c == '-' || c == '+') && signAllowed) {
      result += c;
      signAllowed = false;
    } else if (hasDigit && !isDigit(c) && c != '.') {
      // Stop when we hit a non-numeric character after getting digits
      break;
    }
  }
  
  if (result.length() == 0 || result == "." || result == "-" || result == "+") {
    return 0.0;
  }
  
  return result.toFloat();
}

// 🔧 FIXED: Robust number extraction for integers
int extractNumberInt(String input) {
  if (input.length() == 0) return 0;
  
  String result = "";
  bool signAllowed = true;
  bool hasDigit = false;

  for (int i = 0; i < input.length(); i++) {
    char c = input.charAt(i);
    
    if (isDigit(c)) {
      result += c;
      hasDigit = true;
      signAllowed = false;
    } else if ((c == '-' || c == '+') && signAllowed) {
      result += c;
      signAllowed = false;
    } else if (hasDigit && !isDigit(c)) {
      // Stop when we hit a non-numeric character after getting digits
      break;
    }
  }
  
  if (result.length() == 0 || result == "-" || result == "+") {
    return 0;
  }
  
  return result.toInt();
}

// ================== CSV to Nano (SD) ==================
void sendDataToNano() {
  // CSV in consistent order with proper number extraction
  String csv =
    checkField(utcDate) + "," + checkField(utcTime) + "," +
    String(extractNumberFloat(latitude), 6) + "," + String(extractNumberFloat(longitude), 6) + "," +
    String(extractNumberFloat(temperature), 1) + "," + String(extractNumberFloat(humidity), 1) + "," +
    String(extractNumberFloat(pressure), 1) + "," + String(extractNumberFloat(dewPoint), 1) + "," +
    String(extractNumberInt(windDirection)) + "," + String(extractNumberFloat(windSpeed), 1) + "," +
    String(extractNumberFloat(voltage), 2) + "," + String(extractNumberFloat(currentV), 2) + "," +
    String(extractNumberFloat(power), 1) + "," + checkField(powerStatus) + "," +
    checkField(commMode);

  Serial1.println(csv);
  Serial.println("[Nano] ⬆️ CSV sent for SD logging");
}

// ================== HTML (Web Interface) ==================
String buildAWOSHTMLResponse() {
  String html;
  html  = "<!DOCTYPE html><html><head><title>AWOS Receiver (Wi-Fi)</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<meta http-equiv='refresh' content='10'>"; // Auto-refresh every 10 seconds
  html += "<style>body{font-family:Arial,sans-serif;margin:20px;background-color:#f5f5f5;}";
  html += ".container{max-width:1200px;margin:0 auto;background-color:white;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}";
  html += "h1{color:#2c3e50;text-align:center;margin-bottom:30px;}h2{color:#34495e;border-bottom:2px solid #3498db;padding-bottom:10px;}";
  html += "table{border-collapse:collapse;width:100%;margin-bottom:20px;background-color:white;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}";
  html += "th{background-color:#3498db;color:white;font-weight:bold;}tr:nth-child(even){background-color:#f2f2f2;}";
  html += ".status{text-align:center;padding:15px;background-color:#e8f5e8;border-radius:5px;margin:20px 0;}.error{background-color:#ffe8e8;}";
  html += ".success{background-color:#d4edda;color:#155724;}.warning{background-color:#fff3cd;color:#856404;}";
  html += ".info{font-size:14px;color:#7f8c8d;text-align:center;margin-top:20px;}";
  html += "</style></head><body><div class='container'>";
  html += "<h1>🌤️ AWOS — Wi-Fi Receiver → Next.js</h1>";

  html += "<h2>📊 System Information</h2><table>";
  html += "<tr><th>Parameter</th><th>Value</th></tr>";
  html += "<tr><td>IP Address</td><td>" + String(wifiConnected ? WiFi.localIP().toString() : "N/A") + "</td></tr>";
  html += "<tr><td>UTC Date</td><td>" + checkField(utcDate) + "</td></tr>";
  html += "<tr><td>UTC Time</td><td>" + checkField(utcTime) + "</td></tr>";
  html += "<tr><td>Local Time (UTC+5:30)</td><td>" + getLocalTime() + "</td></tr>";
  html += "<tr><td>System Uptime</td><td>" + String(millis()/1000) + " seconds</td></tr>";
  html += "<tr><td>Firmware Version</td><td>2.2-FIXED</td></tr>";
  html += "<tr><td>Data Format</td><td>Readable from Nano</td></tr>";
  html += "<tr><td>Next.js Endpoint</td><td>" + String(NEXTJS_BASE_URL) + String(NEXTJS_ESP32_PATH) + "</td></tr>";
  html += "</table>";

  html += "<h2>⚡ Power Status</h2><table>";
  html += "<tr><th>Parameter</th><th>Value</th></tr>";
  html += "<tr><td>Voltage</td><td>" + checkField(voltage) + "</td></tr>";
  html += "<tr><td>Current</td><td>" + checkField(currentV) + "</td></tr>";
  html += "<tr><td>Power</td><td>" + checkField(power) + "</td></tr>";
  html += "<tr><td>Power Status</td><td>" + checkField(powerStatus) + "</td></tr>";
  html += "<tr><td>Communication Mode</td><td>" + checkField(commMode) + "</td></tr>";
  html += "</table>";

  html += "<h2>🌡️ Weather Data</h2><table>";
  html += "<tr><th>Parameter</th><th>Value</th></tr>";
  html += "<tr><td>Temperature</td><td>" + checkField(temperature) + "</td></tr>";
  html += "<tr><td>Humidity</td><td>" + checkField(humidity) + "</td></tr>";
  html += "<tr><td>Pressure</td><td>" + checkField(pressure) + "</td></tr>";
  html += "<tr><td>Dew Point</td><td>" + checkField(dewPoint) + "</td></tr>";
  html += "<tr><td>Wind Speed</td><td>" + checkField(windSpeed) + "</td></tr>";
  html += "<tr><td>Wind Direction</td><td>" + checkField(windDirection) + "</td></tr>";
  html += "</table>";

  html += "<h2>📍 Location Data</h2><table>";
  html += "<tr><th>Parameter</th><th>Value</th></tr>";
  html += "<tr><td>Latitude</td><td>" + checkField(latitude) + "</td></tr>";
  html += "<tr><td>Longitude</td><td>" + checkField(longitude) + "</td></tr>";
  html += "</table>";

  // Improved status display
  String statusClass = "status";
  if (nanoConnected && wifiConnected && nextJSPostErrors == 0 && nextJSPostSuccess > 0) {
    statusClass = "status success";
  } else if (!nanoConnected || !wifiConnected) {
    statusClass = "status error";
  } else if (nextJSPostErrors > 0) {
    statusClass = "status warning";
  }

  html += "<div class='" + statusClass + "'>";
  html += "<h3>System Status</h3>";
  html += "<p><strong>Nano Module:</strong> " + String(nanoConnected ? "✅ Connected (Readable)" : "❌ Disconnected") + "</p>";
  html += "<p><strong>Wi-Fi:</strong> " + String(wifiConnected ? "✅ Connected (RSSI: " + String(WiFi.RSSI()) + " dBm)" : "❌ Disconnected") + "</p>";
  html += "<p><strong>Next.js POST Success:</strong> " + String(nextJSPostSuccess) + " | <strong>Errors:</strong> " + String(nextJSPostErrors) + "</p>";
  html += "<p><strong>Last Nano Data:</strong> " + String((millis() - lastNanoData)/1000) + " seconds ago</p>";
  html += "<p><strong>Free Heap:</strong> " + String(ESP.getFreeHeap()) + " bytes</p>";
  html += "</div>";

  html += "<div class='info'><p><i>📡 Receiving readable format from Arduino Nano | 🔄 Auto-refreshing every 10s</i></p>";
  html += "<p><small>Uptime: " + String(millis()/1000) + " seconds | Firmware: 2.2-FIXED</small></p></div>";

  html += "</div></body></html>";
  return html;
}
