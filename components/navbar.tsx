"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/auth/signin-button";
import { PWAConnectionStatus } from "@/components/pwa-connection-status";
import { Sun, Moon, Menu } from "lucide-react";

export default function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between">
            <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center">
              <Image src="/placeholder-logo.svg" alt="logo" width={20} height={20} className="w-5 h-5" />
            </div>
            </div>
            <Link href="/" className="text-sm font-semibold">
              AWOS
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/reports"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Reports
            </Link>
            <Link
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Settings
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <PWAConnectionStatus />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <SignInButton />
          </div>
       
    </header>
  );
}
