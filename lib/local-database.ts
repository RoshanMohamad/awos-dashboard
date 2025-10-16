/**
 * Local IndexedDB Database Layer
 * Replaces Supabase for offline-first operation
 */

const DB_NAME = 'awos_database';
const DB_VERSION = 1;

// Database stores
const STORES = {
  SENSOR_READINGS: 'sensor_readings',
  STATIONS: 'stations',
  USERS: 'users',
  SESSIONS: 'sessions',
  AGGREGATES: 'aggregates',
};

interface SensorReading {
  id: string;
  timestamp: string;
  station_id: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  wind_gust: number | null;
  visibility: number | null;
  precipitation_1h: number | null;
  precipitation_3h: number | null;
  precipitation_6h: number | null;
  precipitation_24h: number | null;
  weather_code: number | null;
  weather_description: string | null;
  cloud_coverage: number | null;
  cloud_base: number | null;
  dew_point: number | null;
  sea_level_pressure: number | null;
  altimeter_setting: number | null;
  battery_voltage: number | null;
  solar_panel_voltage: number | null;
  signal_strength: number | null;
  data_quality: string;
  created_at: string;
  updated_at: string;
}

interface Station {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  elevation: number;
  active: boolean;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: string;
  last_login: string;
}

interface Session {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  expires_at: string;
}

class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB is only available in browser environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create sensor_readings store
        if (!db.objectStoreNames.contains(STORES.SENSOR_READINGS)) {
          const readingsStore = db.createObjectStore(STORES.SENSOR_READINGS, { keyPath: 'id' });
          readingsStore.createIndex('timestamp', 'timestamp', { unique: false });
          readingsStore.createIndex('station_id', 'station_id', { unique: false });
          readingsStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Create stations store
        if (!db.objectStoreNames.contains(STORES.STATIONS)) {
          const stationsStore = db.createObjectStore(STORES.STATIONS, { keyPath: 'id' });
          stationsStore.createIndex('name', 'name', { unique: false });
          stationsStore.createIndex('active', 'active', { unique: false });
        }

        // Create users store
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
          usersStore.createIndex('email', 'email', { unique: true });
        }

        // Create sessions store
        if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
          const sessionsStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
          sessionsStore.createIndex('user_id', 'user_id', { unique: false });
          sessionsStore.createIndex('token', 'token', { unique: true });
          sessionsStore.createIndex('expires_at', 'expires_at', { unique: false });
        }

        // Create aggregates store
        if (!db.objectStoreNames.contains(STORES.AGGREGATES)) {
          db.createObjectStore(STORES.AGGREGATES, { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // Generic CRUD operations
  async add<T>(storeName: string, data: T): Promise<string> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, data: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query<T>(
    storeName: string,
    indexName?: string,
    query?: IDBValidKey | IDBKeyRange,
    limit?: number
  ): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = query ? source.getAll(query, limit) : source.getAll(undefined, limit);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sensor Readings specific methods
  async addSensorReading(reading: Omit<SensorReading, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const fullReading: SensorReading = {
      ...reading,
      id,
      created_at: now,
      updated_at: now,
    };
    return this.add(STORES.SENSOR_READINGS, fullReading);
  }

  async getSensorReadings(options?: {
    stationId?: string;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }): Promise<SensorReading[]> {
    const allReadings = await this.getAll<SensorReading>(STORES.SENSOR_READINGS);
    
    let filtered = allReadings;

    if (options?.stationId) {
      filtered = filtered.filter(r => r.station_id === options.stationId);
    }

    if (options?.startTime) {
      filtered = filtered.filter(r => r.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      filtered = filtered.filter(r => r.timestamp <= options.endTime!);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  async getLatestReading(stationId?: string): Promise<SensorReading | undefined> {
    const readings = await this.getSensorReadings({ stationId, limit: 1 });
    return readings[0];
  }

  // Station methods
  async addStation(station: Omit<Station, 'id' | 'created_at'>): Promise<string> {
    const id = `station_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullStation: Station = {
      ...station,
      id,
      created_at: new Date().toISOString(),
    };
    return this.add(STORES.STATIONS, fullStation);
  }

  async getStations(activeOnly: boolean = true): Promise<Station[]> {
    const stations = await this.getAll<Station>(STORES.STATIONS);
    return activeOnly ? stations.filter(s => s.active) : stations;
  }

  // User methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.USERS], 'readonly');
      const store = transaction.objectStore(STORES.USERS);
      const index = store.index('email');
      const request = index.get(email);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Session methods
  async createSession(userId: string): Promise<Session> {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = this.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const session: Session = {
      id,
      user_id: userId,
      token,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    await this.add(STORES.SESSIONS, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SESSIONS], 'readonly');
      const store = transaction.objectStore(STORES.SESSIONS);
      const index = store.index('token');
      const request = index.get(token);

      request.onsuccess = () => {
        const session = request.result;
        if (session && new Date(session.expires_at) > new Date()) {
          resolve(session);
        } else {
          resolve(undefined);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(token: string): Promise<void> {
    const session = await this.getSessionByToken(token);
    if (session) {
      await this.delete(STORES.SESSIONS, session.id);
    }
  }

  // Delete all sessions for a user (useful for logout from all devices)
  async deleteAllUserSessions(userId: string): Promise<void> {
    const db = await this.ensureDB();
    const sessions = await this.query<Session>(STORES.SESSIONS, 'user_id', userId);
    
    for (const session of sessions) {
      await this.delete(STORES.SESSIONS, session.id);
    }
  }

  // Get all active sessions for a user
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessions = await this.query<Session>(STORES.SESSIONS, 'user_id', userId);
    const now = new Date();
    
    // Filter out expired sessions
    return sessions.filter(session => new Date(session.expires_at) > now);
  }

  // Clean up expired sessions (run periodically)
  async cleanupExpiredSessions(): Promise<number> {
    const db = await this.ensureDB();
    const allSessions = await this.getAll<Session>(STORES.SESSIONS);
    const now = new Date();
    let deletedCount = 0;

    for (const session of allSessions) {
      if (new Date(session.expires_at) <= now) {
        await this.delete(STORES.SESSIONS, session.id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  private generateToken(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = Object.values(STORES);
    
    for (const storeName of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

// Export singleton instance
export const localDB = new LocalDatabase();
export { STORES };
export type { SensorReading, Station, User, Session };
