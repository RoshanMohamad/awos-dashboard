"use client";

import { useState, useEffect } from "react";

const Compass = () => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-rotate compass needle simulation
  useEffect(() => {
    if (!isDragging) {
      const interval = setInterval(() => {
        setRotation((prev) => (prev + 0.5) % 360);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isDragging]);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const degreeMarks = Array.from({ length: 36 }, (_, i) => i * 10);
  const cardinalDirections = [
    { angle: 0, label: "N", isMain: true },
    { angle: 45, label: "NE", isMain: false },
    { angle: 90, label: "E", isMain: true },
    { angle: 135, label: "SE", isMain: false },
    { angle: 180, label: "S", isMain: true },
    { angle: 225, label: "SW", isMain: false },
    { angle: 270, label: "W", isMain: true },
    { angle: 315, label: "NW", isMain: false },
  ];

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-compass-brass to-compass-glow bg-clip-text text-transparent">
          Maritime Compass
        </h1>
        <p className="text-muted-foreground text-lg">
          Bearing: {Math.round(rotation)}°
        </p>
      </div>

      <div className="relative">
        {/* Outer brass frame */}
        <div 
          className="relative w-96 h-96 rounded-full shadow-2xl"
          style={{
            background: "var(--gradient-brass)",
            boxShadow: "var(--shadow-compass)",
          }}
        >
          {/* Inner bezel */}
          <div 
            className="absolute inset-4 rounded-full border-4 border-compass-bronze"
            style={{
              background: "var(--gradient-depth)",
              boxShadow: "var(--shadow-inner)",
            }}
          >
            {/* Compass face */}
            <div 
              className="absolute inset-2 rounded-full border border-compass-bronze/30"
              style={{
                background: "var(--gradient-compass-face)",
              }}
            >
              {/* Degree markings */}
              <div className="absolute inset-0">
                {degreeMarks.map((degree) => (
                  <div
                    key={degree}
                    className="absolute w-0.5 bg-compass-bronze origin-bottom"
                    style={{
                      height: degree % 30 === 0 ? "20px" : degree % 10 === 0 ? "12px" : "8px",
                      left: "50%",
                      bottom: "50%",
                      transform: `translateX(-50%) rotate(${degree}deg)`,
                      transformOrigin: "50% 100%",
                    }}
                  />
                ))}
              </div>

              {/* Cardinal directions */}
              <div className="absolute inset-0">
                {cardinalDirections.map((direction) => (
                  <div
                    key={direction.label}
                    className="absolute font-bold transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${50 + 35 * Math.sin((direction.angle * Math.PI) / 180)}%`,
                      top: `${50 - 35 * Math.cos((direction.angle * Math.PI) / 180)}%`,
                      color: direction.isMain ? "hsl(var(--compass-needle-north))" : "hsl(var(--compass-bronze))",
                      fontSize: direction.isMain ? "1.25rem" : "1rem",
                      textShadow: "0 1px 2px hsl(var(--compass-shadow) / 0.8)",
                    }}
                  >
                    {direction.label}
                  </div>
                ))}
              </div>

              {/* Center pivot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-compass-bronze border-2 border-compass-brass z-20" />

              {/* Compass needle */}
              <div
                className="absolute top-1/2 left-1/2 origin-center cursor-pointer transition-transform duration-1000 ease-out"
                style={{
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  transition: isDragging ? "none" : "var(--transition-needle)",
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* North pointer (red) */}
                <div 
                  className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-0 h-0 z-10"
                  style={{
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderBottom: "80px solid hsl(var(--compass-needle-north))",
                    filter: "drop-shadow(var(--shadow-needle))",
                  }}
                />
                
                {/* South pointer (white) */}
                <div 
                  className="absolute top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 z-10"
                  style={{
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "60px solid hsl(var(--compass-needle-south))",
                    filter: "drop-shadow(0 -2px 4px hsl(var(--compass-shadow) / 0.4))",
                  }}
                />
              </div>

              {/* Glass reflection effect */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, transparent 0%, hsl(var(--compass-glow) / 0.1) 30%, transparent 70%)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Compass base */}
        <div 
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-80 h-12 rounded-full opacity-60"
          style={{
            background: "var(--gradient-brass)",
            boxShadow: "0 8px 20px hsl(var(--compass-shadow) / 0.6)",
          }}
        />
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Click and hold the needle to stop auto-rotation
        </p>
        <p className="text-xs text-muted-foreground/70">
          Traditional maritime compass design
        </p>
      </div>
    </div>
  );
};

export default Compass;