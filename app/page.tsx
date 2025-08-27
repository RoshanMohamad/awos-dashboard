"use client";

import { useAuth } from "@/contexts/auth-context";
import { LoginPage } from "@/components/login-page";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  const { user, loading } = useAuth();

  // Debug logging
  console.log("Auth loading:", loading);
  console.log("User data:", user);

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

  if (!user) {
    return (
      <div>
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          Debug: No user authenticated
        </div>
        <LoginPage />
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
        Debug: Authenticated as {user.email}
      </div>
      <Dashboard />
    </div>
  );
}
