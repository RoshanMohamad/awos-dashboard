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
      console.log(`Attempting ${isSignUp ? 'sign-up' : 'sign-in'} for:`, email);

      const { error } = isSignUp
        ? await signUp(email, password)
        : await signInWithEmail(email, password);

      if (error) {
        console.error("Email auth error:", error);
        const errorMessage = error.message || 'Authentication failed. Please try again.';
        alert(`${isSignUp ? "Sign-up" : "Sign-in"} failed: ${errorMessage}`);
      } else {
        console.log('✅ Authentication successful!');
        if (isSignUp) {
          alert("Account created successfully! You can now sign in.");
          setIsSignUp(false);
        } else {
          console.log('Redirecting to dashboard...');
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error during email auth:", error);
      alert("An unexpected error occurred. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            {isSignUp
              ? "Sign up to access the dashboard"
              : "Sign in to continue to the dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-1 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="mb-1 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <div className="flex items-center justify-between p-4 pt-0">
          <Button
            variant="outline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already have an account?" : "Create an account"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
