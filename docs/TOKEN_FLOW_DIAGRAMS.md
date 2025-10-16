# Token Flow Diagram

## Login → Token Creation

```
User enters credentials
         ↓
    [Sign In Form]
         ↓
┌────────────────────────┐
│  localAuth.signIn()    │
│  - Verify password     │
│  - Create session      │
│  - Generate token      │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│   IndexedDB Storage    │
│  ┌──────────────────┐  │
│  │ sessions store   │  │
│  │ ┌──────────────┐ │  │
│  │ │ Session:     │ │  │
│  │ │ - id         │ │  │
│  │ │ - user_id    │ │  │
│  │ │ - token      │ │  │
│  │ │ - expires_at │ │  │
│  │ └──────────────┘ │  │
│  └──────────────────┘  │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│   localStorage         │
│  awos_session_token:   │
│  "1697234567890_..."   │
└────────┬───────────────┘
         ↓
    [Dashboard]
  User logged in!
```

## Session Restoration

```
Page Refresh/Reload
         ↓
┌────────────────────────┐
│   localStorage         │
│  Get token from:       │
│  awos_session_token    │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│ localDB.               │
│ getSessionByToken()    │
│  - Query IndexedDB     │
│  - Check expiration    │
└────────┬───────────────┘
         ↓
    ┌─────────┐
    │ Valid?  │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    ↓         ↓
[Restore  [Redirect
  User]    to Login]
```

## Logout → Token Deletion

```
User clicks logout
         ↓
┌────────────────────────┐
│  localAuth.signOut()   │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│ Delete from IndexedDB  │
│ sessions.delete(id)    │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│ Remove from localStorage│
│ removeItem('token')    │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│ Clear memory cache     │
│ currentSession = null  │
│ currentUser = null     │
└────────┬───────────────┘
         ↓
   [Login Page]
```

## Token Architecture

```
┌─────────────────────────────────────────────────┐
│                 Browser                         │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │          Application Layer                │ │
│  │                                           │ │
│  │  ┌─────────────┐    ┌─────────────┐     │ │
│  │  │   React     │    │   Auth      │     │ │
│  │  │ Components  │◄───┤  Context    │     │ │
│  │  └─────────────┘    └──────┬──────┘     │ │
│  │                             │            │ │
│  └─────────────────────────────┼────────────┘ │
│                                │              │
│  ┌─────────────────────────────┼────────────┐ │
│  │     Authentication Layer    │            │ │
│  │                             ↓            │ │
│  │  ┌──────────────────────────────────┐   │ │
│  │  │       lib/local-auth.ts          │   │ │
│  │  │  - signIn()                      │   │ │
│  │  │  - signOut()                     │   │ │
│  │  │  - getSession()                  │   │ │
│  │  │  - verifyToken()                 │   │ │
│  │  └────────────────┬─────────────────┘   │ │
│  │                   │                     │ │
│  └───────────────────┼─────────────────────┘ │
│                      │                       │
│  ┌───────────────────┼─────────────────────┐ │
│  │    Database Layer │                     │ │
│  │                   ↓                     │ │
│  │  ┌──────────────────────────────────┐  │ │
│  │  │    lib/local-database.ts         │  │ │
│  │  │  - createSession()               │  │ │
│  │  │  - getSessionByToken()           │  │ │
│  │  │  - deleteSession()               │  │ │
│  │  │  - cleanupExpiredSessions()      │  │ │
│  │  └────────────────┬─────────────────┘  │ │
│  │                   │                    │ │
│  └───────────────────┼────────────────────┘ │
│                      │                      │
│  ┌───────────────────┼────────────────────┐ │
│  │   Storage Layer   │                    │ │
│  │                   ↓                    │ │
│  │  ┌──────────────────────────────────┐ │ │
│  │  │         IndexedDB                │ │ │
│  │  │  ┌────────────────────────────┐  │ │ │
│  │  │  │   sessions store           │  │ │ │
│  │  │  │   - Persistent             │  │ │ │
│  │  │  │   - Queryable              │  │ │ │
│  │  │  │   - Indexed by token       │  │ │ │
│  │  │  └────────────────────────────┘  │ │ │
│  │  └──────────────────────────────────┘ │ │
│  │                                       │ │
│  │  ┌──────────────────────────────────┐ │ │
│  │  │       localStorage               │ │ │
│  │  │  - awos_session_token            │ │ │
│  │  │  - Quick access                  │ │ │
│  │  │  - Session restoration           │ │ │
│  │  └──────────────────────────────────┘ │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Session Lifecycle Timeline

```
Time: 0h (Login)
├─ Token created
├─ Session stored in IndexedDB
└─ Token saved to localStorage
      ↓
Time: 0h - 24h (Active)
├─ Token validated on each request
├─ Session remains valid
└─ User authenticated
      ↓
Time: 24h (Expiration)
├─ Token expires
├─ getSessionByToken() returns undefined
└─ User must login again
      ↓
Time: 24h+ (Cleanup)
├─ cleanupExpiredSessions() called
├─ Expired session deleted from IndexedDB
└─ Storage freed
```

## Multi-Session Management

```
User Device 1 (Browser)          User Device 2 (Browser)
       │                                 │
       ├─ Login                          ├─ Login
       │  Token: abc123                  │  Token: xyz789
       │                                 │
       ↓                                 ↓
┌──────────────────────────────────────────────┐
│            IndexedDB (Shared User)           │
│  ┌────────────────────────────────────────┐  │
│  │ Session 1: token: abc123, device: 1   │  │
│  │ Session 2: token: xyz789, device: 2   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
       │                                 │
       ├─ Logout All Devices ───────────┼─ Both logged out
       │                                 │
       ↓                                 ↓
   All sessions deleted             Session invalidated
```

## Token Validation Flow

```
API Request with Token
         ↓
┌─────────────────────┐
│ Extract token from  │
│ header/cookie       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ verifyToken(token)  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Query IndexedDB     │
│ sessions store      │
└──────────┬──────────┘
           ↓
    ┌──────────┐
    │  Found?  │
    └─────┬────┘
          │
    ┌─────┴─────┐
    │           │
   Yes         No
    │           │
    ↓           ↓
┌─────────┐  ┌────────┐
│ Check   │  │ Return │
│ expiry  │  │  null  │
└────┬────┘  └────────┘
     │
┌────┴─────┐
│          │
Valid   Expired
│          │
↓          ↓
Return   Return
User     null
```
