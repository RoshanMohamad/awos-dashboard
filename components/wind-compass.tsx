"use client";

import { useEffect, useState } from "react";

interface WindCompassProps {
  direction: number;
  speed: number;
}

export function WindCompass({ direction, speed }: WindCompassProps) {
  const compassSize = 240;
  const center = compassSize / 2;
  const [currentDirection, setCurrentDirection] = useState(direction);

  // Smooth direction animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentDirection(direction);
    }, 100);
    return () => clearTimeout(timeout);
  }, [direction]);

  // Convert wind speed to intensity for visual effects
  const speedIntensity = Math.min(speed / 20, 1); // Normalize to 0-1
  const arrowColor =
    speed > 15
      ? "#ef4444"
      : speed > 10
      ? "#f97316"
      : speed > 5
      ? "#22c55e"
      : "#3b82f6";
  const pulseRadius = 8 + speedIntensity * 4;

  // Generate tick marks for degrees
  const tickMarks = [];
  for (let i = 0; i < 360; i += 30) {
    const isCardinal = i % 90 === 0;
    const tickLength = isCardinal ? 15 : 8;
    const tickWidth = isCardinal ? 2 : 1;
    const innerRadius = center - 15;
    const outerRadius = innerRadius - tickLength;

    const x1 = center + Math.cos(((i - 90) * Math.PI) / 180) * innerRadius;
    const y1 = center + Math.sin(((i - 90) * Math.PI) / 180) * innerRadius;
    const x2 = center + Math.cos(((i - 90) * Math.PI) / 180) * outerRadius;
    const y2 = center + Math.sin(((i - 90) * Math.PI) / 180) * outerRadius;

    tickMarks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isCardinal ? "#374151" : "#9ca3af"}
        strokeWidth={tickWidth}
        className="opacity-80"
      />
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative group">
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-xl animate-pulse" />

        <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-full p-4 shadow-2xl border border-slate-200 dark:border-slate-700">
          <svg
            width={compassSize}
            height={compassSize}
            className="drop-shadow-lg"
          >
            <defs>
              {/* Gradient definitions */}
              <radialGradient id="compassGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="70%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </radialGradient>

              <radialGradient
                id="compassGradientDark"
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="70%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              <linearGradient
                id="arrowGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={arrowColor} />
                <stop offset="100%" stopColor={arrowColor} stopOpacity="0.7" />
              </linearGradient>

              {/* Enhanced arrow marker */}
              <marker
                id="arrowhead"
                markerWidth="12"
                markerHeight="10"
                refX="10"
                refY="5"
                orient="auto"
              >
                <path
                  d="M 0 0 L 12 5 L 0 10 L 3 5 Z"
                  fill="url(#arrowGradient)"
                  className="drop-shadow-sm"
                />
              </marker>

              {/* Filters for glowing effects */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background circle with gradient */}
            <circle
              cx={center}
              cy={center}
              r={center - 20}
              fill="url(#compassGradient)"
              className="dark:fill-[url(#compassGradientDark)]"
              stroke="#e2e8f0"
              strokeWidth="2"
            />

            {/* Decorative rings */}
            <circle
              cx={center}
              cy={center}
              r={center - 35}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
              className="opacity-50"
              strokeDasharray="2,4"
            />

            <circle
              cx={center}
              cy={center}
              r={center - 55}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
              className="opacity-30"
              strokeDasharray="1,6"
            />

            {/* Tick marks */}
            <g>{tickMarks}</g>

            {/* Cardinal directions with improved styling */}
            <g className="text-sm font-bold fill-slate-700 dark:fill-slate-300">
              <text
                x={center}
                y="25"
                textAnchor="middle"
                className="font-mono text-base"
              >
                N
              </text>
              <text
                x={compassSize - 20}
                y={center + 5}
                textAnchor="middle"
                className="font-mono text-base"
              >
                E
              </text>
              <text
                x={center}
                y={compassSize - 15}
                textAnchor="middle"
                className="font-mono text-base"
              >
                S
              </text>
              <text
                x="20"
                y={center + 5}
                textAnchor="middle"
                className="font-mono text-base"
              >
                W
              </text>
            </g>

            {/* Secondary directions */}
            <g className="text-xs font-medium fill-slate-500 dark:fill-slate-400">
              <text x={center + 35} y="35" textAnchor="middle">
                NE
              </text>
              <text x={compassSize - 30} y={center - 25} textAnchor="middle">
                SE
              </text>
              <text x={center - 35} y={compassSize - 25} textAnchor="middle">
                SW
              </text>
              <text x="30" y={center - 25} textAnchor="middle">
                NW
              </text>
            </g>

            {/* Center pulsing dot */}
            <circle
              cx={center}
              cy={center}
              r={pulseRadius}
              fill={arrowColor}
              className="animate-pulse opacity-30"
            />

            <circle
              cx={center}
              cy={center}
              r="6"
              fill={arrowColor}
              filter="url(#glow)"
            />

            {/* Enhanced wind direction arrow with smooth transition */}
            <g
              transform={`rotate(${currentDirection} ${center} ${center})`}
              className="transition-transform duration-1000 ease-in-out"
            >
              {/* Arrow shadow */}
              <line
                x1={center}
                y1={center}
                x2={center}
                y2="25"
                stroke="#000000"
                strokeWidth="4"
                markerEnd="url(#arrowhead)"
                className="opacity-20"
                transform="translate(1,1)"
              />

              {/* Main arrow */}
              <line
                x1={center}
                y1={center}
                x2={center}
                y2="25"
                stroke="url(#arrowGradient)"
                strokeWidth="4"
                markerEnd="url(#arrowhead)"
                filter="url(#glow)"
                className="drop-shadow-lg"
              />

              {/* Arrow tail for better visibility */}
              <line
                x1={center}
                y1={center}
                x2={center}
                y2={center + 15}
                stroke={arrowColor}
                strokeWidth="2"
                className="opacity-60"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Enhanced info display */}
      <div className="text-center space-y-3 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <div
              className="text-3xl font-bold transition-colors duration-300"
              style={{ color: arrowColor }}
            >
              {speed.toFixed(1)} <span className="text-lg">m/s</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Wind Speed
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              {Math.round(direction)}°
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Direction
            </div>
          </div>
        </div>

        {/* Wind strength indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Strength:
            </span>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-4 rounded-full transition-colors duration-300 ${
                    i < Math.ceil(speedIntensity * 5)
                      ? "bg-gradient-to-t from-blue-500 to-cyan-400"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
