#!/usr/bin/env node
// Test script for secure MQTT bridge and ingestion endpoint

const testUrl = process.env.INGEST_URL || 'http://localhost:3001/api/ingest';

console.log('🧪 Testing Secure Ingestion Endpoint');
console.log('===================================');
console.log(`Target URL: ${testUrl}`);
console.log('');

async function testIngestion() {
    try {
        // Test 1: Valid sensor reading
        console.log('1. Testing valid sensor reading...');
        const testReading = {
            temperature: 28.5,
            humidity: 65.2,
            pressure: 1013.2,
            windSpeed: 12.5,
            windDirection: 180,
            stationId: 'VCBI',
            timestamp: new Date().toISOString(),
            dataQuality: 'good'
        };

        const response1 = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testReading)
        });

        if (response1.ok) {
            const result1 = await response1.json();
            console.log('✅ Valid reading test passed');
            console.log(`   Created reading ID: ${result1.data?.id || 'N/A'}`);
        } else {
            const error1 = await response1.text();
            console.log(`❌ Valid reading test failed: ${response1.status} ${response1.statusText}`);
            console.log(`   Error: ${error1}`);
        }

        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second

        // Test 2: Minimal reading
        console.log('');
        console.log('2. Testing minimal reading...');
        const minimalReading = {
            temperature: 30.1,
            stationId: 'TEST'
        };

        const response2 = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(minimalReading)
        });

        if (response2.ok) {
            const result2 = await response2.json();
            console.log('✅ Minimal reading test passed');
            console.log(`   Created reading ID: ${result2.data?.id || 'N/A'}`);
        } else {
            const error2 = await response2.text();
            console.log(`❌ Minimal reading test failed: ${response2.status} ${response2.statusText}`);
            console.log(`   Error: ${error2}`);
        }

        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second

        // Test 3: Invalid data (should be rejected)
        console.log('');
        console.log('3. Testing invalid data (should be rejected)...');
        const invalidReading = {
            temperature: "not_a_number", // Invalid type
            humidity: -10, // Invalid range
            stationId: 'TEST'
        };

        const response3 = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invalidReading)
        });

        if (!response3.ok && response3.status === 400) {
            console.log('✅ Invalid data test passed (correctly rejected)');
            const error3 = await response3.json();
            console.log(`   Validation errors: ${error3.details?.length || 0} field(s)`);
        } else {
            console.log(`❌ Invalid data test failed: expected 400, got ${response3.status}`);
        }

        console.log('');
        console.log('🎉 All tests completed!');
        console.log('');
        console.log('Next steps:');
        console.log('- Check server logs for admin client usage');
        console.log('- Test MQTT bridge with: node scripts/mqtt-bridge.js');
        console.log('- Verify data appears in dashboard UI');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch !== 'function') {
    console.error('❌ This test requires Node.js 18+ or install node-fetch');
    process.exit(1);
}

testIngestion();
