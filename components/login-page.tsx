"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Plane, Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const { signInWithGoogle, signInWithEmail, signUp } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await signInWithGoogle();

      if (error) {
        console.error("Google sign-in error:", error);
        alert(`Sign-in failed: ${error.message}`);
      }
      // Supabase will handle the redirect automatically
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      alert("An unexpected error occurred during sign-in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      const { error } = isSignUp
        ? await signUp(email, password)
        : await signInWithEmail(email, password);

      if (error) {
        console.error("Email auth error:", error);
        alert(`${isSignUp ? "Sign-up" : "Sign-in"} failed: ${error.message}`);
      } else {
        if (isSignUp) {
          alert("Check your email for verification link!");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error during email auth:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Plane className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to AWOS</CardTitle>
          <CardDescription>
            Automatic Weather Observation System
            <br />
            Colombo International Airport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Re-enable Google OAuth - make sure to configure redirect URIs first */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2"
            size="lg"
          >
            <Chrome className="h-5 w-5" />
            <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>Authorized personnel only</p>
            <p className="mt-1">Contact system administrator for access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
