"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function AuthCallback() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // For local auth, we don't have OAuth callbacks
    // Just check if user is logged in and redirect
    if (user) {
      console.log("User authenticated, redirecting to dashboard");
      router.push("/dashboard");
    } else {
      console.log("No user session, redirecting to login");
      router.push("/login");
    }
  }, [router, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
        <p className="mt-2 text-sm text-gray-500">
          Please wait
        </p>
      </div>
    </div>
  );
}
