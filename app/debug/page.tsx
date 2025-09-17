"use client";

import { RealTimeDebugPanel } from "@/components/realtime-debug-panel";

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Real-Time Dashboard Debug</h1>
          <RealTimeDebugPanel />
        </div>
      </div>
    </div>
  );
}