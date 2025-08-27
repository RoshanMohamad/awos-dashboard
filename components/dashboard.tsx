"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard-sidebar";
import { LiveDashboard } from "@/components/live-dashboard";
import { ForecastHistory } from "@/components/forecast-history";
import { Button } from "@/components/ui/button";
import { Menu, Settings, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Dashboard() {
  const router = useRouter();
  const [selectedRunway, setSelectedRunway] = useState("02");
  const [activeTab, setActiveTab] = useState<"live" | "forecast">("live");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex max-h-screen relative">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

      <main className="flex-1 overflow-hidden w-full">
        {/* Header Bar */}
        <div className="bg-card border-b border-border p-3 sticky top-0 z-30">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-purple-300"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-xl font-semibold">
                Automatic Weather Observation System
              </h1>
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
          </div>
        </div>

        {activeTab === "live" ? (
          <LiveDashboard runway={selectedRunway} />
        ) : (
          <ForecastHistory runway={selectedRunway} />
        )}
      </main>
    </div>
  );
}
