/**
 * AWOS Dashboard - Login Diagnostic Script
 * 
 * Run this in your browser console (F12) to diagnose login issues
 * 
 * Usage:
 * 1. Open your browser's Developer Tools (F12)
 * 2. Go to the Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 */

(async function awosLoginDiagnostic() {
  console.log('🔍 AWOS Login Diagnostic Starting...\n');
  
  const issues = [];
  const fixes = [];
  
  // Test 1: Check IndexedDB Support
  console.log('Test 1: IndexedDB Support');
  if (typeof indexedDB !== 'undefined') {
    console.log('✅ IndexedDB is supported');
  } else {
    console.log('❌ IndexedDB is NOT supported');
    issues.push('IndexedDB not supported - use a modern browser');
    return;
  }
  
  // Test 2: Check Crypto API
  console.log('\nTest 2: Web Crypto API');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    console.log('✅ Web Crypto API is available');
    
    // Test hashing
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode('test');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      console.log('✅ SHA-256 hashing works');
      console.log('   Test hash:', hash.substring(0, 20) + '...');
    } catch (error) {
      console.log('❌ Crypto API error:', error);
      issues.push('Crypto API not working properly');
    }
  } else {
    console.log('❌ Web Crypto API is NOT available');
    issues.push('Web Crypto API not available');
  }
  
  // Test 3: Check Database Exists
  console.log('\nTest 3: Check Database');
  const databases = await indexedDB.databases();
  const awosDB = databases.find(db => db.name === 'awos_database');
  
  if (awosDB) {
    console.log('✅ Database exists:', awosDB.name, 'v' + awosDB.version);
  } else {
    console.log('⚠️  Database does not exist yet');
    console.log('   It will be created on first use');
  }
  
  // Test 4: Check Users
  console.log('\nTest 4: Check Users in Database');
  try {
    const dbRequest = indexedDB.open('awos_database', 1);
    
    await new Promise((resolve, reject) => {
      dbRequest.onerror = () => reject(dbRequest.error);
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      
      dbRequest.onupgradeneeded = (event) => {
        console.log('   Database being created/upgraded...');
        const db = event.target.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
          console.log('   Created users store');
        }
        
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('user_id', 'user_id', { unique: false });
          sessionsStore.createIndex('token', 'token', { unique: true });
          sessionsStore.createIndex('expires_at', 'expires_at', { unique: false });
          console.log('   Created sessions store');
        }
        
        if (!db.objectStoreNames.contains('sensor_readings')) {
          const readingsStore = db.createObjectStore('sensor_readings', { keyPath: 'id' });
          readingsStore.createIndex('timestamp', 'timestamp', { unique: false });
          readingsStore.createIndex('station_id', 'station_id', { unique: false });
          console.log('   Created sensor_readings store');
        }
        
        if (!db.objectStoreNames.contains('stations')) {
          const stationsStore = db.createObjectStore('stations', { keyPath: 'id' });
          stationsStore.createIndex('name', 'name', { unique: false });
          console.log('   Created stations store');
        }
        
        if (!db.objectStoreNames.contains('aggregates')) {
          db.createObjectStore('aggregates', { keyPath: 'id' });
          console.log('   Created aggregates store');
        }
      };
    });
    
    const db = dbRequest.result;
    
    if (!db.objectStoreNames.contains('users')) {
      console.log('❌ Users store does not exist');
      issues.push('Database structure incomplete');
      fixes.push('Reload the page to create database structure');
    } else {
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const users = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      console.log(`✅ Found ${users.length} user(s) in database`);
      
      if (users.length === 0) {
        console.log('⚠️  No users exist - default user should be created');
        issues.push('No users in database');
        fixes.push('Page needs to run initializeDefaultUser()');
      } else {
        users.forEach(user => {
          console.log(`   - ${user.email} (${user.role})`);
        });
        
        const admin = users.find(u => u.email === 'admin@local.awos');
        if (admin) {
          console.log('✅ Default admin user exists');
        } else {
          console.log('⚠️  Default admin user not found');
          issues.push('Default admin user missing');
        }
      }
    }
    
    db.close();
    
  } catch (error) {
    console.log('❌ Error accessing database:', error);
    issues.push('Cannot access database: ' + error.message);
  }
  
  // Test 5: Check localStorage
  console.log('\nTest 5: Check localStorage');
  try {
    const token = localStorage.getItem('awos_session_token');
    if (token) {
      console.log('✅ Session token found in localStorage');
      console.log('   Token:', token.substring(0, 30) + '...');
    } else {
      console.log('ℹ️  No session token in localStorage (not logged in)');
    }
  } catch (error) {
    console.log('❌ Cannot access localStorage:', error);
    issues.push('localStorage not accessible');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  
  if (issues.length === 0) {
    console.log('✅ No issues found!');
    console.log('\nIf you still can\'t login, try:');
    console.log('1. Use credentials: admin@local.awos / admin123');
    console.log('2. Check browser console for error messages during login');
    console.log('3. Clear all data and reload (see fix script below)');
  } else {
    console.log('❌ Issues found:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
    
    if (fixes.length > 0) {
      console.log('\n💡 Suggested fixes:');
      fixes.forEach((fix, i) => {
        console.log(`   ${i + 1}. ${fix}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('QUICK FIX SCRIPT');
  console.log('='.repeat(50));
  console.log('Run this to reset everything:\n');
  console.log(`
async function resetAWOS() {
  localStorage.clear();
  await new Promise(resolve => {
    const req = indexedDB.deleteDatabase('awos_database');
    req.onsuccess = req.onerror = resolve;
  });
  console.log('✅ Reset complete! Reloading page...');
  location.reload();
}
resetAWOS();
  `.trim());
  
  console.log('\n' + '='.repeat(50));
  console.log('MANUAL USER CREATION SCRIPT');
  console.log('='.repeat(50));
  console.log('If no default user, run this:\n');
  console.log(`
async function createDefaultUser() {
  const dbRequest = indexedDB.open('awos_database', 1);
  
  dbRequest.onsuccess = async (event) => {
    const db = event.target.result;
    
    // Hash password
    const encoder = new TextEncoder();
    const data = encoder.encode('admin123');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    
    const adminUser = {
      id: 'user_' + Date.now(),
      email: 'admin@local.awos',
      password_hash: password_hash,
      name: 'Administrator',
      role: 'admin',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };
    
    store.add(adminUser);
    
    transaction.oncomplete = () => {
      console.log('✅ Admin user created!');
      console.log('   Email: admin@local.awos');
      console.log('   Password: admin123');
    };
    
    transaction.onerror = (err) => {
      console.log('❌ Error:', transaction.error);
    };
    
    db.close();
  };
}
createDefaultUser();
  `.trim());
  
  console.log('\n\n🔍 Diagnostic complete!');
  
})();
