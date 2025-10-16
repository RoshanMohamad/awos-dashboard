"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { localAuth, AuthUser, AuthError } from "@/lib/local-auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      try {
        await localAuth.initializeDefaultUser();
        const { user: restoredUser, error } = await localAuth.getSession();
        
        if (restoredUser && !error) {
          setUser(restoredUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signInWithGoogle = async () => {
    return {
      error: {
        message: "Google OAuth not available in local mode. Use email/password authentication.",
        code: "NOT_AVAILABLE",
      } as AuthError,
    };
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: signedInUser, error } = await localAuth.signIn(email, password);
      
      if (error) {
        return { error };
      }

      setUser(signedInUser || null);
      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Sign in failed",
          code: "SIGNIN_ERROR",
        } as AuthError,
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string = "User") => {
    setLoading(true);
    try {
      const { user: newUser, error } = await localAuth.signUp(email, password, name);
      
      if (error) {
        return { error };
      }

      setUser(newUser || null);
      return { error: null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Sign up failed",
          code: "SIGNUP_ERROR",
        } as AuthError,
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await localAuth.signOut();
      
      if (!error) {
        setUser(null);
      }

      return { error: error || null };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Sign out failed",
          code: "SIGNOUT_ERROR",
        } as AuthError,
      };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
