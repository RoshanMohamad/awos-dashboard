// Simple test to add a few sample records directly via API
const testData = [
  {
    "stationId": "VCBI",
    "timestamp": new Date().toISOString(),
    "temperature": 28.5,
    "humidity": 75.2,
    "pressure": 1012.3,
    "windSpeed": 8.5,
    "windDirection": 135,
    "windGust": 12.1,
    "visibility": 9500,
    "precipitation1h": 0,
    "precipitation3h": 0,
    "precipitation6h": 0,
    "precipitation24h": 0,
    "weatherCode": 801,
    "weatherDescription": "Few clouds",
    "cloudCoverage": 15,
    "cloudBase": 2000,
    "dewPoint": 24.1,
    "seaLevelPressure": 1013.1,
    "altimeterSetting": 29.89,
    "batteryVoltage": 13.2,
    "solarPanelVoltage": 20.5,
    "signalStrength": -52,
    "dataQuality": "good"
  },
  {
    "stationId": "VCRI", 
    "timestamp": new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    "temperature": 29.2,
    "humidity": 72.8,
    "pressure": 1013.1,
    "windSpeed": 6.2,
    "windDirection": 180,
    "windGust": 9.8,
    "visibility": 8200,
    "precipitation1h": 0,
    "precipitation3h": 0,
    "precipitation6h": 0,
    "precipitation24h": 0,
    "weatherCode": 800,
    "weatherDescription": "Clear sky",
    "cloudCoverage": 5,
    "cloudBase": 2500,
    "dewPoint": 24.8,
    "seaLevelPressure": 1013.8,
    "altimeterSetting": 29.92,
    "batteryVoltage": 12.8,
    "solarPanelVoltage": 19.3,
    "signalStrength": -48,
    "dataQuality": "good"
  }
];

// Output as JSON for manual testing
console.log('Sample data for API testing:');
console.log(JSON.stringify(testData, null, 2));
console.log('\nTo manually add this data, make a POST request to:');
console.log('URL: http://localhost:3001/api/ingest');
console.log('Method: POST');
console.log('Content-Type: application/json');
console.log('Body: [paste the JSON above]');
