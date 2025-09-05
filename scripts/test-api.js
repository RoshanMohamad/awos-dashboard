#!/usr/bin/env node

/**
 * AWOS Dashboard API Test Suite
 * 
 * This script tests all API endpoints to ensure they're working correctly.
 * It can be used for integration testing and health monitoring.
 * 
 * Usage:
 *   node scripts/test-api.js
 *   npm run test-api
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { performance } = require('perf_hooks');

// Configuration
const config = {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    timeout: 10000,
    verbose: process.env.VERBOSE === 'true'
};

// Test data
const sampleSensorData = {
    stationId: 'TEST001',
    timestamp: new Date().toISOString(),
    temperature: 25.5,
    humidity: 60.2,
    pressure: 1013.25,
    windSpeed: 5.2,
    windDirection: 180,
    windGust: 7.8,
    visibility: 10000,
    precipitation1h: 0.0,
    weatherCode: 800,
    weatherDescription: 'Clear sky',
    dataQuality: 'good',
    batteryVoltage: 3.7,
    signalStrength: -65
};

// Test results tracking
const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    timings: {}
};

// Utility functions
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
    
    if (level === 'error') {
        console.error(`${prefix} ${message}`);
    } else if (config.verbose || level === 'info') {
        console.log(`${prefix} ${message}`);
    }
}

function logTest(name, passed, duration, details = '') {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const timing = duration ? ` (${duration}ms)` : '';
    log(`${status} ${name}${timing}${details ? ' - ' + details : ''}`, passed ? 'info' : 'error');
}

function makeRequest(endpoint, options = {}) {
    return new Promise((resolve) => {
        const url = new URL(endpoint, config.baseUrl);
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const start = performance.now();
        
        const requestOptions = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
                'User-Agent': 'AWOS-Test-Suite/1.0',
                ...options.headers
            },
            timeout: config.timeout
        };
        
        const req = httpModule.request(requestOptions, (res) => {
            const duration = Math.round(performance.now() - start);
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                let parsedData = null;
                try {
                    if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
                        parsedData = JSON.parse(data);
                    } else {
                        parsedData = data;
                    }
                } catch (e) {
                    parsedData = data;
                }
                
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    data: parsedData,
                    duration,
                    headers: res.headers
                });
            });
        });
        
        req.on('error', (error) => {
            const duration = Math.round(performance.now() - start);
            resolve({
                ok: false,
                status: 0,
                statusText: error.message,
                data: null,
                duration,
                error
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            const duration = Math.round(performance.now() - start);
            resolve({
                ok: false,
                status: 0,
                statusText: 'Request timeout',
                data: null,
                duration,
                error: new Error('Request timeout')
            });
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

function runTest(name, testFn) {
    return new Promise(async (resolve) => {
        results.total++;
        
        try {
            const start = performance.now();
            const result = await testFn();
            const duration = Math.round(performance.now() - start);
            
            results.timings[name] = duration;
            
            if (result.passed) {
                results.passed++;
                logTest(name, true, duration, result.details);
            } else {
                results.failed++;
                results.errors.push({ test: name, error: result.error });
                logTest(name, false, duration, result.error);
            }
            
            resolve(result);
        } catch (error) {
            results.failed++;
            results.errors.push({ test: name, error: error.message });
            logTest(name, false, 0, error.message);
            resolve({ passed: false, error: error.message });
        }
    });
}

// Test functions
async function testHealthEndpoint() {
    const response = await makeRequest('/api/health');
    
    if (!response.ok) {
        return { passed: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const data = response.data;
    if (!data.status || !data.timestamp) {
        return { passed: false, error: 'Missing required fields in health response' };
    }
    
    return { 
        passed: true, 
        details: `Status: ${data.status}, Uptime: ${data.uptime}s` 
    };
}

async function testDbHealthEndpoint() {
    const response = await makeRequest('/api/db/health');
    
    if (!response.ok) {
        return { passed: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const data = response.data;
    if (typeof data.ok !== 'boolean') {
        return { passed: false, error: 'Invalid response format' };
    }
    
    return { 
        passed: true, 
        details: `DB Status: ${data.ok ? 'healthy' : 'unhealthy'}` 
    };
}

async function testIngestEndpoint() {
    const response = await makeRequest('/api/ingest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sampleSensorData)
    });
    
    if (!response.ok) {
        return { passed: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const data = response.data;
    if (!data.ok) {
        return { passed: false, error: data.error || 'Ingest failed' };
    }
    
    return { 
        passed: true, 
        details: `Ingested data for station ${sampleSensorData.stationId}` 
    };
}

async function testReadingsEndpoint() {
    // Test without parameters
    let response = await makeRequest('/api/readings');
    
    if (!response.ok) {
        return { passed: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    let data = response.data;
    if (!data.ok || !Array.isArray(data.data)) {
        return { passed: false, error: 'Invalid response format' };
    }
    
    // Test with station filter
    response = await makeRequest('/api/readings?stationId=TEST001&limit=5');
    
    if (!response.ok) {
        return { passed: false, error: 'Failed with query parameters' };
    }
    
    data = response.data;
    if (!data.pagination || typeof data.pagination.total !== 'number') {
        return { passed: false, error: 'Missing pagination info' };
    }
    
    return { 
        passed: true, 
        details: `Retrieved ${data.data.length} readings, total: ${data.pagination.total}` 
    };
}

async function testCurrentReadingsEndpoint() {
    const response = await makeRequest('/api/readings/current');
    
    if (!response.ok) {
        return { passed: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const data = response.data;
    if (!data.ok) {
        return { passed: false, error: data.error || 'Failed to get current readings' };
    }
    
    return { 
        passed: true, 
        details: `Retrieved current readings for ${Object.keys(data.data || {}).length} stations` 
    };
}

async function testEnvCheckEndpoint() {
    const response = await makeRequest('/api/env-check');
    
    if (!response.ok) {
        return { passed: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const data = response.data;
    if (typeof data.configured !== 'boolean') {
        return { passed: false, error: 'Invalid response format' };
    }
    
    return { 
        passed: true, 
        details: `Environment ${data.configured ? 'properly configured' : 'has missing variables'}` 
    };
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting AWOS Dashboard API Tests');
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`Timeout: ${config.timeout}ms\n`);
    
    const startTime = performance.now();
    
    // Core functionality tests
    await runTest('Health Check', testHealthEndpoint);
    await runTest('Database Health', testDbHealthEndpoint);
    await runTest('Environment Check', testEnvCheckEndpoint);
    
    // API endpoint tests
    await runTest('Data Ingestion', testIngestEndpoint);
    await runTest('Readings Retrieval', testReadingsEndpoint);
    await runTest('Current Readings', testCurrentReadingsEndpoint);
    
    const totalTime = Math.round(performance.now() - startTime);
    
    // Results summary
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed} ✓`);
    console.log(`Failed: ${results.failed} ✗`);
    console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
    console.log(`Total Time: ${totalTime}ms`);
    
    if (results.failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.errors.forEach(({ test, error }) => {
            console.log(`  • ${test}: ${error}`);
        });
    }
    
    if (config.verbose) {
        console.log('\n⏱️ Individual Timings:');
        Object.entries(results.timings).forEach(([test, duration]) => {
            console.log(`  • ${test}: ${duration}ms`);
        });
    }
    
    console.log('\n' + (results.failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed.'));
    
    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
AWOS Dashboard API Test Suite

Usage: node scripts/test-api.js [options]

Options:
  --help, -h        Show this help message
  --verbose         Show detailed output
  --base-url URL    Set the base URL to test (default: http://localhost:3000)

Environment Variables:
  API_BASE_URL      Base URL for the API
  VERBOSE           Set to 'true' for verbose output
`);
    process.exit(0);
}

// Parse command line arguments
const baseUrlIndex = process.argv.indexOf('--base-url');
if (baseUrlIndex !== -1 && process.argv[baseUrlIndex + 1]) {
    config.baseUrl = process.argv[baseUrlIndex + 1];
}

if (process.argv.includes('--verbose')) {
    config.verbose = true;
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
