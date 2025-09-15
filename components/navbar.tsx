"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/auth/signin-button";
import { PWAConnectionStatus } from "@/components/pwa-connection-status";
import { Sun, Moon, Menu,Settings,FileText } from "lucide-react";
import { LiveDashboard } from "@/components/live-dashboard";
import { ForecastHistory } from "@/components/forecast-history";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar } from "@/components/dashboard-sidebar";

export default function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [selectedRunway, setSelectedRunway] = useState("02");
  const [activeTab, setActiveTab] = useState<"live" | "forecast">("live");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-1">
        <div className="h-14 flex items-center justify-between w-full">
          <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-blue-400 bg-blue-600"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar
          selectedRunway={selectedRunway}
          activeTab={activeTab}
          onRunwayChange={setSelectedRunway}
          onTabChange={setActiveTab}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
          {/* Logo and Title */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center">
              <Image
                src="/placeholder-logo.svg"
                alt="logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <Link href="/" className="text-lg font-semibold">
              AWOS
            </Link>
          </div>

         <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Runway {selectedRunway} End
                </div>
                <div className="text-sm text-gray-600">
                  Colombo International Airport (CIAR)
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">UTC Time :</div>
                <div className="font-mono font-bold">
                  {new Date().toUTCString().split(" ")[4]}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">UTC Date :</div>
                <div className="font-mono font-bold">
                  {new Date().toUTCString().split(" ").slice(1, 4).join(" ")}
                </div>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full hover:bg-accent"
                  >
                    <Avatar className="h-8 w-8" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal"></DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/reports")}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Reports</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          {/* Actions Right */}
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
        </div>
      </div>
    </header>
  );
}
