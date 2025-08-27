"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SystemStatus } from "@/components/system-status";
import { ArrowLeft, Activity, Monitor, Clock } from "lucide-react";

export default function SystemPage() {
  const router = useRouter();

  useEffect(() => {
    // public page now; keep router for navigation
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Monitor className="h-6 w-6 text-blue-600" />
                <span>System Monitor</span>
              </h1>
              <p className="text-gray-600">
                Real-time system health and performance monitoring
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <Activity className="h-3 w-3 mr-1" />
            All Systems Operational
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <SystemStatus className="w-full" />
      </div>
    </div>
  );
}
