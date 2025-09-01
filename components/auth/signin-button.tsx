"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function SignInButton() {
  const { user, signOut, signInWithGoogle, supabase } = useAuth();

  // If Supabase is not configured, show a disabled button
  if (supabase === null) {
    return (
      <Button variant="ghost" disabled>
        Auth Disabled
      </Button>
    );
  }

  if (user) {
    return (
      <Button variant="ghost" onClick={() => signOut()}>
        Sign out
      </Button>
    );
  }

  return (
    <Button variant="default" onClick={() => signInWithGoogle()}>
      Sign in
    </Button>
  );
}
