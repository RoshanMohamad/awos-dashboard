#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Ethernet.h>
#include <SPI.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
TwoWire I2COLED = TwoWire(0);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &I2COLED, -1);

#define CLK 13
#define DT 14
#define SW 25

#define RXD2 16
#define TXD2 17
#define RXD1 33
#define TXD1 32

#define ETH_SPI_SCS 5

// Note: GPIO2 is not connected in your setup - removed BUILTIN_LED definition

// Fixed MAC address and IP configuration
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192, 168, 4, 177);        // Fixed IP as requested
IPAddress gateway(192, 168, 4, 1);     // Gateway
IPAddress subnet(255, 255, 255, 0);    // Subnet mask
IPAddress dns(8, 8, 8, 8);             // DNS server

EthernetServer server(80);

// Data storage variables
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
String current = "";
String power = "";
String powerStatus = "";
String commMode = "";

// Control variables
bool collecting = false;
int page = 0;  // 0=System Info, 1=Power Status, 2=Temperature, 3=Humidity, 4=Pressure, 5=Wind Data, 6=Location
int lastClkState;
bool buttonPressed = false;
unsigned long lastOLEDUpdate = 0;
unsigned long lastDataSend = 0;
unsigned long lastPowerCalculation = 0;

const unsigned long oledUpdateInterval = 1000;      // 1 second
const unsigned long dataSendInterval = 30000;       // 30 seconds
const unsigned long powerCalcInterval = 2000;       // 2 seconds

// System status (SD card is handled by separate Nano module)
bool ethernetConnected = false;
bool nanoConnected = false;  // Track if we're receiving data from Nano

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  Serial1.begin(9600, SERIAL_8N1, RXD1, TXD1);

  // Initialize I2C for OLED
  I2COLED.begin(4, 15);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED initialization failed!");
  } else {
    Serial.println("OLED initialized successfully");
  }

  // Initialize encoder pins
  pinMode(CLK, INPUT_PULLUP);
  pinMode(DT, INPUT_PULLUP);
  pinMode(SW, INPUT_PULLUP);
  lastClkState = digitalRead(CLK);

  // Display startup message
  displayStartupMessage();

  // Initialize Ethernet with static IP
Serial.println("Initializing Ethernet...");
Ethernet.init(ETH_SPI_SCS);

// Use static IP configuration - NO DHCP
Ethernet.begin(mac, ip, dns, gateway, subnet);
delay(3000);  // Give more time for initialization

// Verify IP address
if (Ethernet.localIP() == ip) {
  Serial.println("Static IP configured successfully");
  ethernetConnected = true;
} else {
  Serial.println("Failed to configure static IP");
  ethernetConnected = false;
}

// Check Ethernet hardware
if (Ethernet.hardwareStatus() == EthernetNoHardware) {
  Serial.println("Ethernet shield not found");
  ethernetConnected = false;
} else if (Ethernet.linkStatus() == LinkOFF) {
  Serial.println("Ethernet cable not connected");
  ethernetConnected = false;
} else {
  server.begin();
  ethernetConnected = true;
  Serial.print("Ethernet server started. IP: ");
  Serial.println(Ethernet.localIP());  // ✅ Show only once here
}

// Remove this duplicate print ↓
// Serial.println("Fixed IP Address: 192.168.4.177");
Serial.println("System initialization complete");
Serial.println("SD Card managed by separate Nano module");
Serial.println("=================================");
}

void loop() {
  handleEncoder();
  handleSerialInput();
  //calculatePower();
  serveWebPage();
  updateOLEDDisplay();
  
  // Send data to Nano module for SD card logging
  if (utcDate != "" && utcTime != "" && latitude != "" && longitude != "" && 
      millis() - lastDataSend > dataSendInterval) {
    sendDataToNano();
    lastDataSend = millis();
  }
}

void calculatePower() {
  // Calculate power from voltage and current every 2 seconds
  if (millis() - lastPowerCalculation > powerCalcInterval) {
    if (voltage.length() > 0 && current.length() > 0 && 
        voltage != "N/A" && current != "N/A") {
      
      // Extract numeric values (remove units if present)
      String voltageNum = extractNumber(voltage);
      String currentNum = extractNumber(current);
      
      if (voltageNum.length() > 0 && currentNum.length() > 0) {
        float v = voltageNum.toFloat();
        float c = currentNum.toFloat() / 1000.0;  // Convert mA to A
        float p = v * c;  // Power = Voltage * Current
        
        power = String(p, 2);  // 2 decimal places
        Serial.println("Power calculated: " + power + "W");
      }
    }
    lastPowerCalculation = millis();
  }
}

String extractNumber(String input) {
  // Extract numeric part from string (remove units)
  String result = "";
  bool decimalFound = false;
  
  for (int i = 0; i < input.length(); i++) {
    char c = input.charAt(i);
    if (isDigit(c) || (c == '.' && !decimalFound) || (c == '-' && i == 0)) {
      result += c;
      if (c == '.') decimalFound = true;
    } else if (result.length() > 0) {
      break; // Stop when we hit non-numeric after finding numbers
    }
  }
  
  return result;
}

void displayStartupMessage() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("AWOS Starting...");
  display.println("IP: 192.168.4.177");
  display.println("SD via Nano module");
  display.println("Initializing...");
  display.display();
  delay(3000);
}

void handleEncoder() {
  int currentClk = digitalRead(CLK);
  if (currentClk != lastClkState) {
    if (digitalRead(DT) != currentClk) {
      page++;
    } else {
      page--;
    }
    
    // Page bounds: 0-6 (7 pages total)
    if (page < 0) page = 6;
    if (page > 6) page = 0;
    
    lastClkState = currentClk;
    Serial.println("Page changed to: " + String(page));
  }
  
  // Handle button press - reset to home page
  if (digitalRead(SW) == LOW && !buttonPressed) {
    buttonPressed = true;
    page = 0;  // Go to home page (System Info)
    Serial.println("Button pressed - returning to home page");
  } else if (digitalRead(SW) == HIGH) {
    buttonPressed = false;
  }
}

void updateOLEDDisplay() {
  if (millis() - lastOLEDUpdate < oledUpdateInterval) return;
  lastOLEDUpdate = millis();

  display.clearDisplay();
  display.setTextSize(1);  // Always use font size 1
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  switch (page) {
    case 0:  // System Information (Home Page)
      display.println("=== SYSTEM INFO ===");
      display.println("IP: 192.168.4.177");
      display.println("UTC Date: " + checkField(utcDate));
      display.println("UTC Time: " + checkField(utcTime));
      display.println("Local Time: " + getLocalTime());
      display.println("...............");
      display.println("ETH:" + String(ethernetConnected ? "OK" : "ERR") + " NANO:" + String(nanoConnected ? "OK" : "ERR"));
      display.println("Page 1/7");
      break;
      
    case 1:  // Power Status
      display.println("=== POWER STATUS ===");
      display.println("Voltage: " + checkField(voltage));
      display.println("Current: " + checkField(current));
      display.println("Power: " + checkField(power) + " W");
      display.println("Status: " + checkField(powerStatus));
      display.println("Comm: " + checkField(commMode));
      display.println("Page 2/7");
      break;
      
    case 2:  // Temperature Data
      display.println("=== TEMPERATURE ===");
      display.println("Temperature:");
      display.println("  " + checkField(temperature));
      display.println("Dew Point:");
      display.println("  " + checkField(dewPoint));
      display.println("");
      display.println("Page 3/7");
      break;
      
    case 3:  // Humidity Data
      display.println("=== HUMIDITY ===");
      display.println("Humidity:");
      display.println("  " + checkField(humidity));
      display.println("");
      display.println("");
      display.println("");
      display.println("Page 4/7");
      break;
      
    case 4:  // Pressure Data
      display.println("=== PRESSURE ===");
      display.println("Pressure:");
      display.println("  " + checkField(pressure));
      display.println("");
      display.println("");
      display.println("");
      display.println("Page 5/7");
      break;
      
    case 5:  // Wind Data
      display.println("=== WIND DATA ===");
      display.println("Wind Speed:");
      display.println("  " + checkField(windSpeed));
      display.println("Wind Direction:");
      display.println("  " + checkField(windDirection));
      display.println("");
      display.println("Page 6/7");
      break;
      
    case 6:  // Location Data
      display.println("=== LOCATION ===");
      display.println("Latitude:");
      display.println("  " + checkField(latitude));
      display.println("Longitude:");
      display.println("  " + checkField(longitude));
      display.println("");
      display.println("Page 7/7");
      break;
  }

  display.display();
}

String getLocalTime() {
  if (utcTime.length() < 5) return "N/A";
  
  int colonIndex = utcTime.indexOf(':');
  if (colonIndex == -1) return "N/A";
  
  int h = utcTime.substring(0, colonIndex).toInt();
  int m = utcTime.substring(colonIndex + 1).toInt();
  
  // Convert UTC to local time (UTC+5:30 for Sri Lanka)
  h += 5;
  m += 30;
  
  if (m >= 60) {
    m -= 60;
    h++;
  }
  if (h >= 24) {
    h -= 24;
  }
  
  char buf[8];
  sprintf(buf, "%02d:%02d", h, m);
  return String(buf);
}

void handleSerialInput() {
  // Handle Serial2 input (from receiver nano)
  while (Serial2.available()) {
    String line = Serial2.readStringUntil('\n');
    line.trim();
    
    if (line.length() > 0) {
      // Only show essential debug info, not weather data
      if (line.startsWith("------")) {
        Serial.println("New data packet received");
        nanoConnected = true;  // Mark that we're receiving data from Nano
      }
      processDataLine(line);
    }
  }
}

void processDataLine(String line) {
  if (line.startsWith("------")) {
    resetData();
    collecting = true;
    return;
  }

  if (!collecting) return;

  // Parse different data fields
  if (line.startsWith("UTC Date:")) {
    utcDate = parseValue(line);
  }
  else if (line.startsWith("UTC Time:")) {
    utcTime = parseValue(line);
  }
  else if (line.startsWith("Latitude:")) {
    latitude = parseValue(line);
  }
  else if (line.startsWith("Longitude:")) {
    longitude = parseValue(line);
  }
  else if (line.startsWith("Temperature:")) {
    temperature = parseValue(line);
  }
  else if (line.startsWith("Humidity:")) {
    humidity = parseValue(line);
  }
  else if (line.startsWith("Pressure:")) {
    pressure = parseValue(line);
  }
  else if (line.startsWith("Dew Point:")) {
    dewPoint = parseValue(line);
  }
  else if (line.startsWith("Wind Speed:")) {
    windSpeed = parseValue(line);
  }
  else if (line.startsWith("Wind Direction:")) {
    windDirection = parseValue(line);
  }
  else if (line.startsWith("Voltage:")) {
    voltage = parseValue(line);
  }
  else if (line.startsWith("Current:")) {
    current = parseValue(line);
    calculatePower();// remove this if the calculated power was recived
  }
  else if (line.startsWith("Power:")) {
    power = parseValue(line);
  }
  else if (line.indexOf("Power Status") >= 0) {
    powerStatus = parseValue(line);
  }
  else if (line.startsWith("Comm Mode:")) {
    commMode = parseValue(line);
  }
}

void sendDataToNano() {
  // Send CSV formatted data to Nano module for SD card logging
  String csv = checkField(utcDate) + "," + checkField(utcTime) + "," +
               checkField(extractNumber(latitude)) + "," + checkField(extractNumber(longitude)) + "," +
               checkField(extractNumber(temperature)) + "," + checkField(extractNumber(humidity)) + "," +
               checkField(extractNumber(pressure)) + "," + checkField(extractNumber(dewPoint)) + "," +
               checkField(extractNumber(windDirection)) + "," + checkField(extractNumber(windSpeed)) + "," +
               checkField(extractNumber(voltage)) + "," + checkField(extractNumber(current)) + "," +
               checkField(extractNumber(power)) + "," + checkField(powerStatus) + "," +
               checkField(commMode);
  
  Serial1.println(csv);
  Serial.println("[ESP32] CSV data sent to Nano for SD logging");
}

String parseValue(String line) {
  int idx = line.indexOf(':');
  if (idx == -1) return "";
  
  String val = line.substring(idx + 1);
  val.trim();
  
  // Clean up the value
  val.replace("  ", " ");
  return val;
}

String checkField(String f) {
  return (f.length() > 0) ? f : "N/A";
}

void resetData() {
  utcDate = "";
  utcTime = "";
  latitude = "";
  longitude = "";
  temperature = "";
  humidity = "";
  pressure = "";
  dewPoint = "";
  windSpeed = "";
  windDirection = "";
  // Keep voltage, current, power, powerStatus, commMode as they come from separate source
}

void serveWebPage() {
  EthernetClient client = server.available();
  if (client) {
    Serial.println("New client connected");
    
    // Read the request
    String request = "";
    while (client.connected() && client.available()) {
      char c = client.read();
      if (c == '\n') break;
      request += c;
    }
    
    // Send HTTP response
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println("Connection: close");
    client.println("Refresh: 30");  // Auto-refresh every 30 seconds
    client.println();
    
    // Send HTML page
    client.println("<!DOCTYPE html>");
    client.println("<html><head><title>AWOS Weather Station</title>");
    client.println("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
    client.println("<style>");
    client.println("body{font-family:Arial,sans-serif;margin:20px;background-color:#f5f5f5;}");
    client.println(".container{max-width:1200px;margin:0 auto;background-color:white;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}");
    client.println("h1{color:#2c3e50;text-align:center;margin-bottom:30px;}");
    client.println("h2{color:#34495e;border-bottom:2px solid #3498db;padding-bottom:10px;}");
    client.println("table{border-collapse:collapse;width:100%;margin-bottom:20px;background-color:white;}");
    client.println("th,td{border:1px solid #ddd;padding:12px;text-align:left;}");
    client.println("th{background-color:#3498db;color:white;font-weight:bold;}");
    client.println("tr:nth-child(even){background-color:#f2f2f2;}");
    client.println(".status{text-align:center;padding:15px;background-color:#e8f5e8;border-radius:5px;margin:20px 0;}");
    client.println(".error{background-color:#ffe8e8;}");
    client.println(".info{font-size:14px;color:#7f8c8d;text-align:center;margin-top:20px;}");
    client.println("</style>");
    client.println("</head><body>");
    client.println("<div class='container'>");
    client.println("<h1>🌤️ AWOS - Automated Weather Observation System</h1>");
    
    // System Information
    client.println("<h2>📊 System Information</h2>");
    client.println("<table>");
    client.println("<tr><th>Parameter</th><th>Value</th></tr>");
    client.println("<tr><td>System IP Address</td><td>192.168.4.177 (Fixed)</td></tr>");
    client.println("<tr><td>UTC Date</td><td>" + checkField(utcDate) + "</td></tr>");
    client.println("<tr><td>UTC Time</td><td>" + checkField(utcTime) + "</td></tr>");
    client.println("<tr><td>Local Time (UTC+5:30)</td><td>" + getLocalTime() + "</td></tr>");
    client.println("<tr><td>System Uptime</td><td>" + String(millis()/1000) + " seconds</td></tr>");
    client.println("<tr><td>SD Card Storage</td><td>Managed by separate Nano module</td></tr>");
    client.println("</table>");

    // Power Status
    client.println("<h2>⚡ Power Status</h2>");
    client.println("<table>");
    client.println("<tr><th>Parameter</th><th>Value</th></tr>");
    client.println("<tr><td>Voltage</td><td>" + checkField(voltage) + "</td></tr>");
    client.println("<tr><td>Current</td><td>" + checkField(current) + "</td></tr>");
    client.println("<tr><td>Power</td><td>" + checkField(power) + " W</td></tr>");
    client.println("<tr><td>Power Status</td><td>" + checkField(powerStatus) + "</td></tr>");
    client.println("<tr><td>Communication Mode</td><td>" + checkField(commMode) + "</td></tr>");
    client.println("</table>");

    // Weather Data
    client.println("<h2>🌡️ Weather Data</h2>");
    client.println("<table>");
    client.println("<tr><th>Parameter</th><th>Value</th></tr>");
    client.println("<tr><td>Temperature</td><td>" + checkField(temperature) + "</td></tr>");
    client.println("<tr><td>Humidity</td><td>" + checkField(humidity) + "</td></tr>");
    client.println("<tr><td>Pressure</td><td>" + checkField(pressure) + "</td></tr>");
    client.println("<tr><td>Dew Point</td><td>" + checkField(dewPoint) + "</td></tr>");
    client.println("<tr><td>Wind Speed</td><td>" + checkField(windSpeed) + "</td></tr>");
    client.println("<tr><td>Wind Direction</td><td>" + checkField(windDirection) + "</td></tr>");
    client.println("</table>");

    // Location Data
    client.println("<h2>📍 Location Data</h2>");
    client.println("<table>");
    client.println("<tr><th>Parameter</th><th>Value</th></tr>");
    client.println("<tr><td>Latitude</td><td>" + checkField(latitude) + "</td></tr>");
    client.println("<tr><td>Longitude</td><td>" + checkField(longitude) + "</td></tr>");
    client.println("</table>");

    // System Status
    String statusClass = (nanoConnected && ethernetConnected) ? "status" : "status error";
    client.println("<div class='" + statusClass + "'>");
    client.println("<h3>System Status</h3>");
    client.println("<p><strong>Nano Module:</strong> " + String(nanoConnected ? "✅ Connected" : "❌ Disconnected") + "</p>");
    client.println("<p><strong>Ethernet:</strong> " + String(ethernetConnected ? "✅ Connected" : "❌ Disconnected") + "</p>");
    client.println("<p><strong>Data Collection:</strong> " + String(collecting ? "✅ Active" : "⏸️ Waiting") + "</p>");
    client.println("<p><strong>SD Card:</strong> 💾 Managed by Nano module</p>");
    client.println("</div>");

    client.println("<div class='info'>");
    client.println("<p><i>📡 Data updates every 30 seconds | 🔄 Page auto-refreshes every 30 seconds</i></p>");
    client.println("<p><small>Last update: " + String(millis()/1000) + " seconds since system boot</small></p>");
    client.println("</div>");

    client.println("</div>");
    client.println("</body></html>");
    
    client.stop();
    Serial.println("Client disconnected");
  }
}