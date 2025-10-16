"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function SignInButton() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (user) {
    return (
      <Button variant="ghost" onClick={handleSignOut}>
        Sign out
      </Button>
    );
  }

  return (
    <Button variant="default" onClick={() => router.push('/login')}>
      Sign in
    </Button>
  );
}
