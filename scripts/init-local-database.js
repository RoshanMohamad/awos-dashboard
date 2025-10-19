// Local Database Initialization Script
// Run this to set up default user and station for offline operation

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Data directory
const DATA_DIR = path.join(process.cwd(), 'data');
const INIT_FILE = path.join(DATA_DIR, 'database_init.json');

// Default configuration
const DEFAULT_CONFIG = {
  user: {
    id: 'user_default_admin',
    email: 'admin@local.awos',
    password: 'admin123', // Will be hashed
    name: 'Administrator',
    role: 'admin',
    created_at: new Date().toISOString(),
    last_login: null
  },
  station: {
    id: 'VCBI-ESP32',
    name: 'Runway 02 End',
    location: 'Bandaranaike International Airport',
    latitude: 7.1807,
    longitude: 79.8842,
    elevation: 9,
    active: true,
    created_at: new Date().toISOString()
  },
  settings: {
    database_version: 1,
    initialized_at: new Date().toISOString(),
    offline_mode: true,
    polling_interval: 2000,
    data_retention_days: 90
  }
};

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Local Database...\n');

    // Create data directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('✅ Data directory created:', DATA_DIR);

    // Hash the password
    const hashedPassword = hashPassword(DEFAULT_CONFIG.user.password);
    DEFAULT_CONFIG.user.password_hash = hashedPassword;
    delete DEFAULT_CONFIG.user.password;

    // Write initialization file
    await fs.writeFile(
      INIT_FILE,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
      'utf-8'
    );
    console.log('✅ Database initialization file created:', INIT_FILE);

    // Create empty sensor readings file
    const readingsFile = path.join(DATA_DIR, 'sensor_readings.json');
    try {
      await fs.access(readingsFile);
      console.log('ℹ️  Sensor readings file already exists');
    } catch {
      await fs.writeFile(readingsFile, '[]', 'utf-8');
      console.log('✅ Empty sensor readings file created');
    }

    console.log('\n📊 Database Initialized Successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('Default Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('Email:    admin@local.awos');
    console.log('Password: admin123');
    console.log('═══════════════════════════════════════\n');
    console.log('⚠️  IMPORTANT: Change password after first login!\n');
    console.log('Default Station:');
    console.log('═══════════════════════════════════════');
    console.log('Station ID:', DEFAULT_CONFIG.station.id);
    console.log('Name:      ', DEFAULT_CONFIG.station.name);
    console.log('Location:  ', DEFAULT_CONFIG.station.location);
    console.log('Latitude:  ', DEFAULT_CONFIG.station.latitude);
    console.log('Longitude: ', DEFAULT_CONFIG.station.longitude);
    console.log('═══════════════════════════════════════\n');

    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, hashPassword, DEFAULT_CONFIG };
