"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Plane,
  X,
  Settings,
  FileText,
  Monitor,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  selectedRunway: string;
  activeTab: "live" | "forecast";
  onRunwayChange: (runway: string) => void;
  onTabChange: (tab: "live" | "forecast") => void;
  onClose: () => void;
}

export function Sidebar({
  selectedRunway,
  activeTab,
  onRunwayChange,
  onTabChange,
  onClose,
}: SidebarProps) {
  const router = useRouter();
  const [openRunways, setOpenRunways] = useState<Record<string, boolean>>({
    "02": true,
    "04": false,
  });

  const toggleRunway = (runway: string) => {
    setOpenRunways((prev) => ({
      ...prev,
      [runway]: !prev[runway],
    }));
  };

  const handleTabClick = (runway: string, tab: "live" | "forecast") => {
    onRunwayChange(runway);
    onTabChange(tab);
    if (!openRunways[runway]) {
      toggleRunway(runway);
    }
    onClose(); // Close sidebar after selection
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Logo Header with Close Button */}
      <div className="p-4 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sidebar-foreground">Navigation</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-card border-2 border-sidebar-primary rounded-full flex items-center justify-center">
            <div className="text-center">
              <Plane className="h-6 w-6 text-sidebar-primary mx-auto" />
              <div className="text-xs text-sidebar-primary font-bold">AASL</div>
            </div>
          </div>
          <div>
            <h1 className="font-bold text-sm text-sidebar-foreground">
              Airport & Aviation Services
            </h1>
            <p className="text-xs text-muted-foreground">
              (Sri Lanka) Private Limited
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 bg-transparent">
        <div className="p-4 space-y-2">
          {/* Runway 02 End */}
          <div className="rounded bg-sidebar-accent/50">
            <Collapsible
              open={openRunways["02"]}
              onOpenChange={() => toggleRunway("02")}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto text-left"
                >
                  {openRunways["02"] ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <div className="font-medium text-sidebar-foreground">
                    Runway 02 End
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-6 space-y-1 pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sm",
                    selectedRunway === "02" &&
                      activeTab === "live" &&
                      "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  )}
                  onClick={() => handleTabClick("02", "live")}
                >
                  ▶ Live Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sm",
                    selectedRunway === "02" &&
                      activeTab === "forecast" &&
                      "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  )}
                  onClick={() => {
                router.push("/forecast");
                onClose();
              }}
                >
                  ▶ Forecast & History
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Runway 04 End */}
          <div className="rounded bg-sidebar-accent/50">
            <Collapsible
              open={openRunways["04"]}
              onOpenChange={() => toggleRunway("04")}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto text-left"
                >
                  {openRunways["04"] ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <div className="font-medium text-sidebar-foreground">
                    Runway 04 End
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-6 space-y-1 pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sm",
                    selectedRunway === "04" &&
                      activeTab === "live" &&
                      "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  )}
                  onClick={() => handleTabClick("04", "live")}
                >
                  ▶ Live Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sm",
                    selectedRunway === "04" &&
                      activeTab === "forecast" &&
                      "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  )}
                  onClick={() => {
                router.push("/forecast");
                onClose();
              }}
                >
                  ▶ Forecast & History
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* System Pages */}
          <div className="mt-4 space-y-1">
            <h3 className="text-xs font-semibold text-sidebar-foreground uppercase tracking-wide px-3 py-2">
              System
            </h3>

            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                router.push("/forecast");
                onClose();
              }}
            >
              <Info className="h-4 w-4 mr-2" />
              Forecast & History
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                router.push("/reports");
                onClose();
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                router.push("/system");
                onClose();
              }}
            >
              <Monitor className="h-4 w-4 mr-2" />
              System Status
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                router.push("/settings");
                onClose();
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>


          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground text-center">
          Weather Monitoring System
        </div>
      </div>
    </div>
  );
}
