"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SupabaseStatus } from "@/components/supabase-status";

export default function Home() {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();

  // Debug logging
  console.log("Auth loading:", loading);
  console.log("User data:", user);
  console.log("Supabase client:", supabase);

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;

    // If Supabase is not configured, stay on home to show config message
    if (supabase === null) return;

    // If user is authenticated, redirect to dashboard
    if (user) {
      router.push("/dashboard");
      return;
    }

    // If not authenticated, redirect to login
    router.push("/login");
  }, [user, loading, supabase, router]);

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

  // Show configuration message if Supabase is not configured
  if (supabase === null) {
    return (
      <div>
        <SupabaseStatus />
        <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              AWOS Dashboard
            </h1>
            <p className="text-gray-600 mb-6">
              Automatic Weather Observation System - Colombo International
              Airport
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ Supabase environment variables are not configured.
                Authentication and database features are disabled.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                💡 Please configure your environment variables in Vercel
                Dashboard: Settings → Environment Variables
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
