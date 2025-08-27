"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function SignInButton() {
  const { user, signOut, signInWithGoogle } = useAuth();

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
