// Dummy ESP32 Sensor Data Feed Generator
// Simulates realistic weather station data for testing
// Data format matches ESP32 API endpoint expectations

function generateDummyReading() {
  const now = new Date();
  const utcDate = now.toISOString().split('T')[0].replace(/-/g, '');
  const utcTime = now.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
  
  const temp = 20 + Math.random() * 15; // 20-35°C
  const humidity = 40 + Math.random() * 40; // 40-80%
  
  // Calculate dew point using Magnus formula
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  
  const voltage = 11 + Math.random() * 2; // 11-13V (typical 12V battery)
  const onBattery = Math.random() > 0.7; // 30% chance on battery
  
  return {
    temperature: parseFloat(temp.toFixed(2)),
    humidity: parseFloat(humidity.toFixed(2)),
    pressure: parseFloat((1010 + Math.random() * 20).toFixed(2)), // 1010-1030 hPa
    dewPoint: parseFloat(dewPoint.toFixed(2)),
    windSpeed: parseFloat((Math.random() * 15).toFixed(2)), // 0-15 m/s
    windDirection: Math.floor(Math.random() * 360), // 0-360 degrees
    lat: 12.9716, // Bangalore coordinates (example)
    lng: 77.5946,
    utcDate: utcDate,
    utcTime: utcTime,
    voltage: parseFloat(voltage.toFixed(2)),
    current: parseFloat((Math.random() * 2).toFixed(2)), // 0-2A
    power: parseFloat((voltage * (Math.random() * 2)).toFixed(2)),
    powerStatus: onBattery ? 'BATTERY' : 'GRID',
    commMode: 'ETHERNET',
    lastPacketTime: Date.now(),
    stationId: 'VCBI'  // Match what the API expects
  };
}

// Send dummy data to localhost API (uses Node.js https module)
async function sendDummyData() {
  const reading = generateDummyReading();
  
  console.log('\n📡 Sending dummy data at', new Date().toLocaleTimeString());
  console.log('   Temperature:', reading.temperature, '°C');
  console.log('   Humidity:', reading.humidity, '%');
  console.log('   Wind Speed:', reading.windSpeed, 'm/s');
  console.log('   Power Status:', reading.powerStatus);
  
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(reading);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/esp32',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('✅ Response:', result.message);
          console.log('   Response time:', result.responseTime);
          resolve(result);
        } catch (e) {
          console.log('✅ Data sent successfully');
          resolve({ success: true });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
      console.error('   Make sure the Next.js server is running on port 3000');
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Continuous feed mode
async function startContinuousFeed(intervalSeconds = 10) {
  console.log(`🚀 Starting dummy feed (every ${intervalSeconds} seconds)...`);
  console.log('Press Ctrl+C to stop\n');
  
  // Send first reading immediately
  await sendDummyData();
  
  // Then send every interval
  setInterval(sendDummyData, intervalSeconds * 1000);
}

// Run when executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const interval = args[0] ? parseInt(args[0]) : 10;
  
  startContinuousFeed(interval);
}

module.exports = { generateDummyReading, sendDummyData, startContinuousFeed };
