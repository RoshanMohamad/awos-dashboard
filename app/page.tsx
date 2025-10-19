"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading} = useAuth();
  const router = useRouter();

  // Debug logging
  console.log("Auth loading:", loading);
  console.log("User data:", user);

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) return;

    // If user is authenticated, redirect to dashboard
    if (user) {
      router.push("/dashboard");
      return;
    }

    // If not authenticated, redirect to login
    router.push("/login");
  }, [user, loading, router]);

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

  // Show loading while redirecting (this shouldn't normally be reached)
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
