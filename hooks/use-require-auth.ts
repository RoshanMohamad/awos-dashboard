"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

/**
 * Hook to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth(redirectTo: string = "/login") {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Don't redirect if already on login or public pages
    if (pathname === redirectTo || pathname === "/") return;

    // Redirect if not authenticated
    if (!user) {
      console.log("🔒 Redirecting unauthenticated user to:", redirectTo);
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo, pathname]);

  return { user, loading };
}
