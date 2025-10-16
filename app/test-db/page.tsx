"use client";

import { useEffect, useState } from "react";
import { localDB } from "@/lib/local-database";
import { localAuth } from "@/lib/local-auth";

interface DbStatus {
  users: any[];
  sessions: any[];
  initialized: boolean;
  error?: string;
}

export default function TestDbPage() {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>("");

  useEffect(() => {
    checkDatabase();
  }, []);

  async function checkDatabase() {
    setLoading(true);
    try {
      console.log("🔍 Checking database status...");

      // Initialize database
      await localDB.init();
      console.log("✅ Database initialized");

      // Initialize default user
      await localAuth.initializeDefaultUser();
      console.log("✅ Default user initialized");

      // Get all users
      const users = await localDB.getAll("users");
      console.log("✅ Found users:", users);

      // Get all sessions
      const sessions = await localDB.getAll("sessions");
      console.log("✅ Found sessions:", sessions);

      setStatus({
        users: users.map((u: any) => ({
          email: u.email,
          role: u.role,
          name: u.name,
          created_at: u.created_at,
        })),
        sessions: sessions.map((s: any) => ({
          user_id: s.user_id,
          token: s.token.substring(0, 20) + "...",
          expires_at: s.expires_at,
        })),
        initialized: true,
      });
    } catch (error) {
      console.error("❌ Error:", error);
      setStatus({
        users: [],
        sessions: [],
        initialized: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  async function testLogin() {
    setTestResult("Testing login...");
    try {
      const email = "admin@local.awos";
      const password = "admin123";

      console.log("🔐 Testing login with:", email);

      const result = await localAuth.signIn(email, password);

      if (result.error) {
        setTestResult(`❌ Login failed: ${result.error.message}`);
        console.error("Login error:", result.error);
      } else {
        setTestResult(`✅ Login successful! User: ${result.user?.email}`);
        console.log("Login success:", result.user);
      }
    } catch (error) {
      setTestResult(`❌ Exception: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Login exception:", error);
    }
  }

  async function createTestUser() {
    setTestResult("Creating test user...");
    try {
      await localDB.init();

      const encoder = new TextEncoder();
      const data = encoder.encode("test123");
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const user = {
        id: `user_${Date.now()}`,
        email: "test@local.awos",
        password_hash: passwordHash,
        name: "Test User",
        role: "user",
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };

      await localDB.add("users", user);
      setTestResult("✅ Test user created: test@local.awos / test123");
      await checkDatabase();
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function clearDatabase() {
    setTestResult("Clearing database...");
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
        await new Promise<void>((resolve, reject) => {
          const req = indexedDB.deleteDatabase("awos_database");
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        setTestResult("✅ Database cleared! Refreshing...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Test Page</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Status</h2>

          {loading ? (
            <p>Loading...</p>
          ) : status?.error ? (
            <div className="text-red-600">
              <p className="font-semibold">Error:</p>
              <p>{status.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Users ({status?.users.length || 0}):</h3>
                {status?.users.length === 0 ? (
                  <p className="text-gray-500">No users found</p>
                ) : (
                  <ul className="space-y-2">
                    {status?.users.map((user, i) => (
                      <li key={i} className="border-l-4 border-blue-500 pl-4">
                        <p>
                          <strong>Email:</strong> {user.email}
                        </p>
                        <p>
                          <strong>Role:</strong> {user.role}
                        </p>
                        <p>
                          <strong>Name:</strong> {user.name}
                        </p>
                        <p className="text-sm text-gray-500">Created: {user.created_at}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Sessions ({status?.sessions.length || 0}):</h3>
                {status?.sessions.length === 0 ? (
                  <p className="text-gray-500">No active sessions</p>
                ) : (
                  <ul className="space-y-2">
                    {status?.sessions.map((session, i) => (
                      <li key={i} className="border-l-4 border-green-500 pl-4">
                        <p>
                          <strong>Token:</strong> {session.token}
                        </p>
                        <p>
                          <strong>User ID:</strong> {session.user_id}
                        </p>
                        <p className="text-sm text-gray-500">Expires: {session.expires_at}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={checkDatabase}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Refresh Status
            </button>

            <button
              onClick={testLogin}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Test Login
            </button>

            <button
              onClick={createTestUser}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Create Test User
            </button>

            <button
              onClick={clearDatabase}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Clear Database
            </button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <pre className="whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Default Credentials</h2>
          <p className="mb-2">
            <strong>Email:</strong> admin@local.awos
          </p>
          <p>
            <strong>Password:</strong> admin123
          </p>
        </div>
      </div>
    </div>
  );
}
