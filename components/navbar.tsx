"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/auth/signin-button";
import { PWAConnectionStatus } from "@/components/pwa-connection-status";
import { Sun, Moon, Menu, Settings, FileText, MapPin, Clock } from "lucide-react";
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
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time only on client side to prevent hydration mismatch
    setCurrentTime(new Date());
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-b border-border/50 backdrop-blur-md shadow-sm">
        <div className="max-w-full mx-auto px-4 lg:px-6">
          <div className="h-16 flex items-center justify-between w-full">
            
            {/* Left Section - Menu & Logo */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 transition-colors duration-200"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">AW</span>
                </div>
                <div>
                  <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                    AWOS Dashboard
                  </Link>
                  <div className="text-xs text-muted-foreground font-medium">
                    Weather Observation System
                  </div>
                </div>
              </div>
            </div>

            {/* Center Section - Location & Time Info */}
            <div className="hidden lg:flex items-center space-x-8">
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-border/30 shadow-sm">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-foreground">
                    Runway {selectedRunway} End
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Colombo International Airport (CIAR)
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-border/30 shadow-sm">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                <div className="text-center">
                  <div className="text-xs text-muted-foreground font-medium">
                    UTC Time
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentTime ? currentTime.toUTCString().split(" ").slice(1, 4).join(" ") : "-- --- ----"}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - User Menu & Controls */}
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-1">
                <PWAConnectionStatus />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 transition-colors duration-200"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full hover:bg-accent border-2 border-transparent hover:border-border/30 transition-all duration-200"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-sm font-semibold">
                        U
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-medium text-sm">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Weather Admin</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        admin@awos.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Settings className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/reports")}
                    className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <FileText className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Reports</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <SignInButton />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
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

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
