// Network Configuration Helper
// Detects PC IP and generates ESP32 Arduino code configuration

const os = require('os');
const fs = require('fs').promises;
const path = require('path');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address,
          netmask: iface.netmask,
          mac: iface.mac
        });
      }
    }
  }

  return addresses;
}

function getDefaultGateway(ipAddress) {
  // Extract first 3 octets and add .1 for typical router
  const parts = ipAddress.split('.');
  return `${parts[0]}.${parts[1]}.${parts[2]}.1`;
}

function suggestESP32IP(pcIP) {
  // Suggest an IP in same subnet but different from PC
  const parts = pcIP.split('.');
  const lastOctet = parseInt(parts[3]);
  
  // Suggest something unlikely to conflict
  const suggestedOctet = lastOctet < 200 ? 177 : 217;
  
  return `${parts[0]}.${parts[1]}.${parts[2]}.${suggestedOctet}`;
}

function generateESP32Config(pcIP, esp32IP, gateway) {
  const [pc1, pc2, pc3, pc4] = pcIP.split('.');
  const [esp1, esp2, esp3, esp4] = esp32IP.split('.');
  const [gw1, gw2, gw3, gw4] = gateway.split('.');

  return `
// ============================================
// NETWORK CONFIGURATION - AUTO-GENERATED
// Generated: ${new Date().toISOString()}
// ============================================

// Your PC's IP Address (where Next.js server runs)
IPAddress serverIP(${pc1}, ${pc2}, ${pc3}, ${pc4});

// ESP32's Static IP Address
IPAddress esp32IP(${esp1}, ${esp2}, ${esp3}, ${esp4});

// Router Gateway IP Address
IPAddress gateway(${gw1}, ${gw2}, ${gw3}, ${gw4});

// Subnet Mask (typically for home networks)
IPAddress subnet(255, 255, 255, 0);

// DNS Server (use router IP for local network)
IPAddress dns(${gw1}, ${gw2}, ${gw3}, ${gw4});

// Server Port (Next.js development server)
const int SERVER_PORT = 3000;

// API Endpoint Path
const char* API_ENDPOINT = "/api/esp32";

// ============================================
// INSTRUCTIONS:
// 1. Copy the above configuration
// 2. Open: scripts/esp32-Local-Ethernet.ino
// 3. Replace lines 36-43 with this configuration
// 4. Upload to ESP32 via Arduino IDE
// ============================================
`;
}

async function generateDotEnv(pcIP, esp32IP, gateway) {
  return `# AWOS Dashboard - Local Network Configuration
# Auto-generated: ${new Date().toISOString()}

# Your PC's IP address (where Next.js server runs)
NEXT_PUBLIC_PC_IP=${pcIP}

# Next.js server port
NEXT_PUBLIC_SERVER_PORT=3000

# Full server URL for local access
NEXT_PUBLIC_API_URL=http://localhost:3000

# ESP32 static IP address
NEXT_PUBLIC_ESP32_IP=${esp32IP}

# Router gateway IP address
NEXT_PUBLIC_GATEWAY_IP=${gateway}

# Subnet mask
NEXT_PUBLIC_SUBNET=255.255.255.0

# Default station ID (must match ESP32 code)
NEXT_PUBLIC_DEFAULT_STATION_ID=VCBI-ESP32

# Offline mode (always true for local setup)
NEXT_PUBLIC_OFFLINE_MODE=true

# Debug mode
NEXT_PUBLIC_DEBUG_MODE=true
`;
}

async function main() {
  console.log('🔍 Network Configuration Helper\n');
  console.log('═══════════════════════════════════════════════\n');

  // Detect network interfaces
  const interfaces = getLocalIPAddress();

  if (interfaces.length === 0) {
    console.log('❌ No network interfaces detected!');
    console.log('   Please connect to a network (Ethernet or WiFi)\n');
    return;
  }

  console.log('📡 Detected Network Interfaces:\n');
  interfaces.forEach((iface, index) => {
    console.log(`[${index + 1}] ${iface.interface}`);
    console.log(`    IP Address: ${iface.address}`);
    console.log(`    Subnet:     ${iface.netmask}`);
    console.log(`    MAC:        ${iface.mac}`);
    console.log('');
  });

  // Select primary interface (first non-loopback)
  const primaryInterface = interfaces[0];
  const pcIP = primaryInterface.address;
  const gateway = getDefaultGateway(pcIP);
  const esp32IP = suggestESP32IP(pcIP);

  console.log('═══════════════════════════════════════════════');
  console.log('✅ Recommended Configuration:');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`PC IP Address:    ${pcIP}`);
  console.log(`ESP32 IP Address: ${esp32IP}`);
  console.log(`Gateway (Router): ${gateway}`);
  console.log(`Subnet Mask:      255.255.255.0`);
  console.log('');

  // Generate ESP32 configuration
  const esp32Config = generateESP32Config(pcIP, esp32IP, gateway);
  
  console.log('═══════════════════════════════════════════════');
  console.log('📋 ESP32 Arduino Code Configuration:');
  console.log('═══════════════════════════════════════════════');
  console.log(esp32Config);

  // Save to file
  const configOutputPath = path.join(process.cwd(), 'esp32-network-config.txt');
  await fs.writeFile(configOutputPath, esp32Config, 'utf-8');
  console.log(`✅ Configuration saved to: ${configOutputPath}\n`);

  // Generate .env.local content
  const dotEnvContent = await generateDotEnv(pcIP, esp32IP, gateway);
  const dotEnvPath = path.join(process.cwd(), '.env.local.generated');
  await fs.writeFile(dotEnvPath, dotEnvContent, 'utf-8');
  console.log(`✅ .env.local template saved to: ${dotEnvPath}`);
  console.log(`   Copy this to .env.local if needed\n`);

  // Display testing commands
  console.log('═══════════════════════════════════════════════');
  console.log('🧪 Testing Commands:');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`# Test if router is reachable:`);
  console.log(`ping ${gateway}\n`);
  console.log(`# Test if ESP32 IP is free:`);
  console.log(`ping ${esp32IP}`);
  console.log(`(Should timeout if IP is free)\n`);
  console.log(`# Test Next.js server locally:`);
  console.log(`curl http://localhost:3000\n`);
  console.log(`# Test Next.js server from network:`);
  console.log(`curl http://${pcIP}:3000\n`);

  console.log('═══════════════════════════════════════════════');
  console.log('📱 Access Dashboard:');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`Local:    http://localhost:3000`);
  console.log(`Network:  http://${pcIP}:3000`);
  console.log(`Mobile:   http://${pcIP}:3000`);
  console.log('');

  console.log('═══════════════════════════════════════════════');
  console.log('🔐 Default Login:');
  console.log('═══════════════════════════════════════════════\n');
  console.log('Email:    admin@local.awos');
  console.log('Password: admin123');
  console.log('');

  console.log('═══════════════════════════════════════════════');
  console.log('⚠️  Next Steps:');
  console.log('═══════════════════════════════════════════════\n');
  console.log('1. Update .env.local with detected IP addresses');
  console.log('2. Copy ESP32 configuration to Arduino code');
  console.log('3. Upload code to ESP32');
  console.log('4. Connect Ethernet cables');
  console.log('5. Start server: npm run dev');
  console.log('6. Monitor ESP32 Serial: 115200 baud');
  console.log('');

  console.log('✅ Configuration helper complete!\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getLocalIPAddress,
  getDefaultGateway,
  suggestESP32IP,
  generateESP32Config,
  generateDotEnv
};
