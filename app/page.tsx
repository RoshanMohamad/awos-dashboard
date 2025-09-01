"use client";

import { useAuth } from "@/contexts/auth-context";
import { LoginPage } from "@/components/login-page";
import { Dashboard } from "@/components/dashboard";
import { SupabaseStatus } from "@/components/supabase-status";

export default function Home() {
  const { user, loading, supabase } = useAuth();

  // Debug logging
  console.log("Auth loading:", loading);
  console.log("User data:", user);
  console.log("Supabase client:", supabase);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          <p className="mt-2 text-sm text-gray-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SupabaseStatus />
      {supabase === null ? (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              AWOS Dashboard
            </h1>
            <p className="text-gray-600 mb-6">
              Automatic Weather Observation System
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                Configuration required: Please set up Supabase environment
                variables in your deployment settings.
              </p>
            </div>
          </div>
        </div>
      ) : !user ? (
        <div>
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
            Debug: No user authenticated
          </div>
          <LoginPage />
        </div>
      ) : (
        <div>
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
            Debug: Authenticated as {user.email}
          </div>
          <Dashboard />
        </div>
      )}
    </div>
  );
}
