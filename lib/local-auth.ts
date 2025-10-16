/**
 * Local Authentication System
 * Replaces Supabase Auth for offline operation
 */

import { localDB, User, Session } from './local-database';

// Simple hash function for password (for production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResponse {
  user?: AuthUser;
  session?: Session;
  error?: AuthError;
}

class LocalAuth {
  private currentSession: Session | null = null;
  private currentUser: AuthUser | null = null;

  // Initialize default admin user if no users exist
  async initializeDefaultUser(): Promise<void> {
    try {
      await localDB.init();
      const users = await localDB.getAll<User>('users');
      
      if (users.length === 0) {
        const defaultPassword = 'admin123'; // Change this!
        const passwordHash = await hashPassword(defaultPassword);
        
        const adminUser: User = {
          id: `user_${Date.now()}`,
          email: 'admin@local.awos',
          password_hash: passwordHash,
          name: 'Administrator',
          role: 'admin',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };

        await localDB.add('users', adminUser);
        console.log('Default admin user created:', adminUser.email);
        console.log('Default password:', defaultPassword);
      }
    } catch (error) {
      console.error('Error initializing default user:', error);
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Starting sign in process for:', email);
      
      // Initialize database
      console.log('📦 Initializing database...');
      await localDB.init();
      console.log('✅ Database initialized');
      
      // Get user by email
      console.log('👤 Looking up user...');
      let user;
      try {
        user = await localDB.getUserByEmail(email);
        console.log('👤 getUserByEmail result:', user ? 'User found' : 'User not found');
      } catch (dbError) {
        console.error('❌ Error calling getUserByEmail:', dbError);
        return {
          error: {
            message: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
            code: 'DATABASE_ERROR',
          },
        };
      }

      if (!user) {
        console.log('❌ User not found');
        return {
          error: {
            message: 'Invalid email or password. If this is your first time, the default credentials are: admin@local.awos / admin123',
            code: 'INVALID_CREDENTIALS',
          },
        };
      }

      console.log('✅ User found:', user.email);
      
      // Verify password
      console.log('🔑 Verifying password...');
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        console.log('❌ Password incorrect');
        return {
          error: {
            message: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
          },
        };
      }

      console.log('✅ Password verified');

      // Update last login
      console.log('📝 Updating last login time...');
      await localDB.update('users', {
        ...user,
        last_login: new Date().toISOString(),
      });

      // Create session
      console.log('🎫 Creating session...');
      const session = await localDB.createSession(user.id);
      console.log('✅ Session created:', session.token.substring(0, 20) + '...');
      
      this.currentSession = session;
      this.currentUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      // Store session in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('awos_session_token', session.token);
        console.log('💾 Session saved to localStorage');
      }

      console.log('✅ Sign in successful!');
      return {
        user: this.currentUser,
        session,
      };
    } catch (error) {
      console.error('❌ Sign in error (outer catch):', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      return {
        error: {
          message: error instanceof Error ? error.message : 'Authentication failed. Please check console for details.',
          code: 'AUTH_ERROR',
        },
      };
    }
  }

  // Sign up new user
  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      await localDB.init();
      
      // Check if user already exists
      const existingUser = await localDB.getUserByEmail(email);
      if (existingUser) {
        return {
          error: {
            message: 'User already exists',
            code: 'USER_EXISTS',
          },
        };
      }

      const passwordHash = await hashPassword(password);
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password_hash: passwordHash,
        name,
        role: 'user',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      await localDB.add('users', newUser);

      // Create session
      const session = await localDB.createSession(newUser.id);
      
      this.currentSession = session;
      this.currentUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      };

      // Store session in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('awos_session_token', session.token);
      }

      return {
        user: this.currentUser,
        session,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Sign up failed',
          code: 'SIGNUP_ERROR',
        },
      };
    }
  }

  // Get current session
  async getSession(): Promise<AuthResponse> {
    try {
      await localDB.init();
      
      // Try to get session from memory first
      if (this.currentSession && this.currentUser) {
        const session = await localDB.getSessionByToken(this.currentSession.token);
        if (session) {
          return {
            user: this.currentUser,
            session,
          };
        }
      }

      // Try to restore from localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('awos_session_token');
        if (token) {
          const session = await localDB.getSessionByToken(token);
          if (session) {
            const user = await localDB.get<User>('users', session.user_id);
            if (user) {
              this.currentSession = session;
              this.currentUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              };
              return {
                user: this.currentUser,
                session,
              };
            }
          }
        }
      }

      return {
        error: {
          message: 'No active session',
          code: 'NO_SESSION',
        },
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Session check failed',
          code: 'SESSION_ERROR',
        },
      };
    }
  }

  // Sign out
  async signOut(): Promise<{ error?: AuthError }> {
    try {
      if (this.currentSession) {
        await localDB.deleteSession(this.currentSession.token);
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('awos_session_token');
      }

      this.currentSession = null;
      this.currentUser = null;

      return {};
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Sign out failed',
          code: 'SIGNOUT_ERROR',
        },
      };
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Verify session token (for API routes)
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      await localDB.init();
      const session = await localDB.getSessionByToken(token);
      
      if (!session) {
        return null;
      }

      const user = await localDB.get<User>('users', session.user_id);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Get all active sessions for current user
  async getCurrentUserSessions(): Promise<Session[]> {
    if (!this.currentUser) {
      return [];
    }

    try {
      await localDB.init();
      return await localDB.getUserSessions(this.currentUser.id);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Logout from all devices (delete all sessions)
  async signOutAllDevices(): Promise<{ error?: AuthError }> {
    if (!this.currentUser) {
      return {
        error: {
          message: 'No user logged in',
          code: 'NO_USER',
        },
      };
    }

    try {
      await localDB.init();
      await localDB.deleteAllUserSessions(this.currentUser.id);

      // Clear current session
      if (typeof window !== 'undefined') {
        localStorage.removeItem('awos_session_token');
      }

      this.currentSession = null;
      this.currentUser = null;

      return {};
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Sign out failed',
          code: 'SIGNOUT_ERROR',
        },
      };
    }
  }

  // Clean up expired sessions (call periodically)
  async cleanupExpiredSessions(): Promise<number> {
    try {
      await localDB.init();
      return await localDB.cleanupExpiredSessions();
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const localAuth = new LocalAuth();
export { hashPassword, verifyPassword };
