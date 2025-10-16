# Local Token Management - Complete Guide

## Overview

The local authentication system uses **session tokens** stored in IndexedDB for user authentication. Tokens are completely managed locally without any internet connection.

## Token Architecture

### Storage Locations

1. **IndexedDB** (`sessions` store)
   - Primary storage
   - Persistent across browser sessions
   - Queryable by user ID or token

2. **localStorage** (`awos_session_token`)
   - Quick access storage
   - Used for session restoration
   - Cleared on logout

3. **In-Memory** (AuthContext)
   - Current session cache
   - Fast access during runtime

## Token Lifecycle

### 1. Token Creation (Login)

```typescript
// Automatic on successful login
const { user, session } = await localAuth.signIn('admin@local.awos', 'admin123');

// Session object created:
{
  id: "session_1697234567890_abc123",
  user_id: "user_1697234567890",
  token: "1697234567890_xyz789_abc123",
  created_at: "2025-10-15T10:30:00.000Z",
  expires_at: "2025-10-16T10:30:00.000Z"  // 24 hours later
}
```

**What happens:**
1. Password is verified
2. Unique token is generated
3. Session is created in IndexedDB
4. Token is saved to localStorage
5. Session returned to client

### 2. Token Validation (Every Request)

```typescript
// Automatic session restoration
const { user, session } = await localAuth.getSession();

// Or verify specific token (for API routes)
const user = await localAuth.verifyToken(token);
```

**What happens:**
1. Token retrieved from localStorage
2. Session looked up in IndexedDB
3. Expiration date checked
4. User data returned if valid
5. Returns null if expired or invalid

### 3. Token Deletion (Logout)

```typescript
// Single device logout
await localAuth.signOut();

// All devices logout
await localAuth.signOutAllDevices();
```

**What happens:**
1. Session deleted from IndexedDB
2. Token removed from localStorage
3. In-memory cache cleared

## Available Methods

### Database Methods (`lib/local-database.ts`)

#### Create Session
```typescript
const session = await localDB.createSession(userId);
```

#### Get Session by Token
```typescript
const session = await localDB.getSessionByToken(token);
// Returns undefined if expired or not found
```

#### Delete Single Session
```typescript
await localDB.deleteSession(token);
```

#### Delete All User Sessions
```typescript
await localDB.deleteAllUserSessions(userId);
// Useful for "logout from all devices"
```

#### Get All Active Sessions for User
```typescript
const sessions = await localDB.getUserSessions(userId);
// Returns only non-expired sessions
```

#### Cleanup Expired Sessions
```typescript
const deletedCount = await localDB.cleanupExpiredSessions();
console.log(`Cleaned up ${deletedCount} expired sessions`);
```

### Auth Methods (`lib/local-auth.ts`)

#### Sign In (Creates Token)
```typescript
const { user, session, error } = await localAuth.signIn(email, password);
```

#### Get Current Session
```typescript
const { user, session, error } = await localAuth.getSession();
```

#### Sign Out (Deletes Token)
```typescript
const { error } = await localAuth.signOut();
```

#### Sign Out All Devices
```typescript
const { error } = await localAuth.signOutAllDevices();
```

#### Get Current User's Sessions
```typescript
const sessions = await localAuth.getCurrentUserSessions();
console.log(`User has ${sessions.length} active sessions`);
```

#### Verify Token (for API)
```typescript
const user = await localAuth.verifyToken(token);
if (user) {
  // Token is valid
}
```

#### Cleanup Expired Sessions
```typescript
const count = await localAuth.cleanupExpiredSessions();
```

## Token Format

```typescript
interface Session {
  id: string;           // Unique session ID
  user_id: string;      // Associated user
  token: string;        // Authentication token
  created_at: string;   // ISO timestamp
  expires_at: string;   // ISO timestamp (24h from creation)
}
```

### Token Generation

Tokens are generated using:
```typescript
`${Date.now()}_${random()}_${random()}`
// Example: "1697234567890_xyz789_abc123"
```

- **Timestamp**: Ensures uniqueness
- **Random strings**: Additional entropy
- **No encryption**: Stored locally only

## Usage Examples

### Basic Login/Logout

```typescript
// Login
const result = await localAuth.signIn('admin@local.awos', 'admin123');
if (result.error) {
  console.error('Login failed:', result.error.message);
} else {
  console.log('Logged in as:', result.user?.email);
  console.log('Token:', result.session?.token);
}

// Logout
await localAuth.signOut();
```

### Check Active Sessions

```typescript
// Get all sessions for current user
const sessions = await localAuth.getCurrentUserSessions();

sessions.forEach(session => {
  console.log('Session:', {
    created: new Date(session.created_at).toLocaleString(),
    expires: new Date(session.expires_at).toLocaleString(),
    token: session.token.substring(0, 20) + '...'
  });
});
```

### API Authentication

```typescript
// In an API route
export async function GET(request: Request) {
  // Get token from header or cookie
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify token
  const user = await localAuth.verifyToken(token);
  
  if (!user) {
    return new Response('Invalid token', { status: 401 });
  }

  // User is authenticated
  return Response.json({ message: 'Authenticated', user });
}
```

### Session Cleanup (Periodic Task)

```typescript
// Run daily or when app starts
async function cleanupOldSessions() {
  const count = await localAuth.cleanupExpiredSessions();
  console.log(`Removed ${count} expired sessions`);
}

// Run on app initialization
cleanupOldSessions();

// Or run periodically
setInterval(cleanupOldSessions, 24 * 60 * 60 * 1000); // Daily
```

## Security Features

### 1. Token Expiration
- Default: 24 hours
- Automatically invalidated
- Cleanup removes expired tokens

### 2. Password Hashing
- SHA-256 hashing (client-side)
- Passwords never stored in plain text
- For production: Consider bcrypt or argon2

### 3. Local-Only Storage
- No network transmission
- IndexedDB is origin-isolated
- No cross-site access

### 4. Session Validation
- Expiration checked on every access
- Invalid tokens return null
- User must re-authenticate

## Token Configuration

### Change Token Expiration

Edit `lib/local-database.ts`:

```typescript
async createSession(userId: string): Promise<Session> {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const token = this.generateToken();
  const now = new Date();
  
  // Change this duration
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  // Examples:
  // 1 hour:  1 * 60 * 60 * 1000
  // 7 days:  7 * 24 * 60 * 60 * 1000
  // 30 days: 30 * 24 * 60 * 60 * 1000
  
  // ... rest of code
}
```

### Custom Token Format

Edit the `generateToken()` method:

```typescript
private generateToken(): string {
  // Default format
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Or use UUID-like format
  // return crypto.randomUUID(); // Requires browser support
  
  // Or custom format
  // return `awos_${Date.now()}_${someCustomLogic}`;
}
```

## Troubleshooting

### Token Not Persisting

**Problem:** User logged out after page refresh

**Solution:**
```typescript
// Check if token is in localStorage
const token = localStorage.getItem('awos_session_token');
console.log('Stored token:', token);

// Manually restore session
if (token) {
  const session = await localDB.getSessionByToken(token);
  console.log('Session:', session);
}
```

### Too Many Sessions

**Problem:** User has multiple active sessions

**Solution:**
```typescript
// Delete all sessions except current
const sessions = await localAuth.getCurrentUserSessions();
console.log(`Active sessions: ${sessions.length}`);

// Keep only the most recent
if (sessions.length > 1) {
  await localAuth.signOutAllDevices();
  // Then sign in again to create fresh session
}
```

### Expired Session Not Cleaned

**Problem:** Expired sessions still in database

**Solution:**
```typescript
// Manual cleanup
const count = await localAuth.cleanupExpiredSessions();
console.log(`Removed ${count} expired sessions`);

// Set up automatic cleanup
setInterval(async () => {
  await localAuth.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Every hour
```

### IndexedDB Full

**Problem:** Too many sessions stored

**Solution:**
```typescript
// Clear all sessions
await localDB.clearAllData(); // Warning: Deletes everything!

// Or just clear sessions
const allSessions = await localDB.getAll('sessions');
for (const session of allSessions) {
  await localDB.delete('sessions', session.id);
}
```

## Best Practices

### 1. Regular Cleanup
```typescript
// Add to your app initialization
useEffect(() => {
  localAuth.cleanupExpiredSessions();
}, []);
```

### 2. Logout on Long Inactivity
```typescript
let lastActivity = Date.now();

window.addEventListener('click', () => {
  lastActivity = Date.now();
});

setInterval(() => {
  const inactiveMinutes = (Date.now() - lastActivity) / (1000 * 60);
  if (inactiveMinutes > 30) { // 30 minutes
    localAuth.signOut();
  }
}, 60000); // Check every minute
```

### 3. Session Rotation
```typescript
// Refresh token before expiration
async function refreshSession() {
  const { user } = await localAuth.getSession();
  if (user) {
    await localAuth.signOut();
    // User must sign in again to get fresh token
  }
}
```

### 4. Multiple Device Management
```typescript
// Show all active sessions to user
const sessions = await localAuth.getCurrentUserSessions();

// Let user revoke specific sessions
async function revokeSession(sessionId: string) {
  await localDB.delete('sessions', sessionId);
}

// Or revoke all except current
await localAuth.signOutAllDevices();
```

## Summary

✅ **Tokens are fully managed locally**
- Created automatically on login
- Stored in IndexedDB + localStorage
- Validated on every request
- Deleted on logout
- Auto-expire after 24 hours

✅ **No internet required**
- Everything works offline
- No external API calls
- Local database only

✅ **Full CRUD operations**
- Create: `createSession()`
- Read: `getSessionByToken()`
- Update: N/A (create new session instead)
- Delete: `deleteSession()`, `deleteAllUserSessions()`

✅ **Security features**
- Token expiration
- Password hashing
- Local-only storage
- Automatic cleanup

---

For more information, see:
- `lib/local-database.ts` - Database implementation
- `lib/local-auth.ts` - Authentication logic
- `contexts/auth-context.tsx` - React integration
