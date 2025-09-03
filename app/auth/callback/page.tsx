"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();

      if (!supabase) {
        console.error("Supabase client not initialized");
        router.push("/login?error=config");
        return;
      }

      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          router.push("/login?error=auth_failed");
          return;
        }

        if (data.session) {
          console.log("Auth successful, redirecting to dashboard");
          // Successful authentication, redirect to dashboard
          router.push("/dashboard");
        } else {
          console.log("No session found, redirecting to login");
          router.push("/login");
        }
      } catch (error) {
        console.error("Unexpected error during auth callback:", error);
        router.push("/login?error=unexpected");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
        <p className="mt-2 text-sm text-gray-500">
          Please wait while we redirect you
        </p>
      </div>
    </div>
  );
}
