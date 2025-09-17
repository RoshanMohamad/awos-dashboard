"use client";

import { ForecastHistory } from "@/components/forecast-history";
import { useState } from "react";

export default function ForecastPage() {
  const [selectedRunway] = useState("VCBI"); // Default to VCBI station

  return (
    <div className="min-h-screen">
      <ForecastHistory runway={selectedRunway} />
    </div>
  );
}