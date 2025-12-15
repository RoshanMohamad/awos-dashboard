"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard-sidebar";
import { LiveDashboard } from "@/components/live-dashboard";
import { ForecastHistory } from "@/components/forecast-history";
import { Button } from "@/components/ui/button";
import { Menu, Settings, FileText } from "lucide-react";


export function Dashboard() {
  const router = useRouter();
  // Use "02" as the default runway to match sidebar navigation
  const [selectedRunway, setSelectedRunway] = useState("02");
  const [activeTab, setActiveTab] = useState<"live" | "forecast">("live");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Convert runway ID to station ID for API calls
  const getStationId = (runway: string) => {
    // Map runway numbers to station IDs
    const runwayToStation = {
      "02": "VCBI",
      "04": "VCBI-04",
      "VCBI": "VCBI"
    };
    return runwayToStation[runway as keyof typeof runwayToStation] || runway;
  };

  return (
    <div className="flex max-auto relative">
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
        {activeTab === "live" ? (
          <LiveDashboard runway={getStationId(selectedRunway)} />
        ) : (
          <ForecastHistory runway={getStationId(selectedRunway)} />
        )}
      </main>
    </div>
  );
}