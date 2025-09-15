'use client';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Gauge } from "lucide-react";

interface PressureMeterProps {
  value?: number;
  min?: number;
  max?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  unit?: string;
  title?: string;
}

export const PressureMeter = ({
  value: initialValue = 45,
  min = 0,
  max = 100,
  warningThreshold = 60,
  dangerThreshold = 80,
  unit = "PSI",
  title = "Pressure Monitor"
}: PressureMeterProps) => {
  const [value, setValue] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate needle angle (-135deg to 135deg, total 270deg range)
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const angle = -135 + (percentage * 270);

  // Determine status and color
  const getStatus = () => {
    if (value >= dangerThreshold) return { status: "DANGER", color: "gauge-danger" };
    if (value >= warningThreshold) return { status: "WARNING", color: "gauge-warning" };
    return { status: "SAFE", color: "gauge-safe" };
  };

  const { status, color } = getStatus();

  // Create tick marks for the gauge
  const tickMarks = [];
  for (let i = 0; i <= 10; i++) {
    const tickAngle = -135 + (i * 27); // 270deg / 10 = 27deg per tick
    const tickValue = min + (i * (max - min) / 10);
    const isMarked = i % 2 === 0; // Major ticks every other mark
    
    tickMarks.push(
      <div
        key={i}
        className={`absolute ${isMarked ? 'w-1 h-8 bg-muted-foreground' : 'w-0.5 h-4 bg-muted-foreground/50'}`}
        style={{
          transform: `rotate(${tickAngle}deg) translateY(-130px)`,
          transformOrigin: 'bottom center',
        }}
      />
    );

    if (isMarked) {
      tickMarks.push(
        <div
          key={`label-${i}`}
          className="absolute text-xs font-medium text-muted-foreground"
          style={{
            transform: `rotate(${tickAngle}deg) translateY(-145px) rotate(-${tickAngle}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {Math.round(tickValue)}
        </div>
      );
    }
  }

  const adjustValue = (delta: number) => {
    setIsAnimating(true);
    setValue(prev => Math.min(Math.max(prev + delta, min), max));
    setTimeout(() => setIsAnimating(false), 800);
  };

  useEffect(() => {
    // Simulate real-time pressure fluctuations
    const interval = setInterval(() => {
      if (!isAnimating) {
        setValue(prev => {
          const fluctuation = (Math.random() - 0.5) * 2;
          return Math.min(Math.max(prev + fluctuation, min), max);
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAnimating, min, max]);

  return (
    <div className="flex flex-col items-center space-y-6 animate-fade-in-up">
      {/* Title and Status */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Gauge className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <Badge 
          variant={status === "SAFE" ? "default" : "destructive"}
          className="animate-pulse-glow"
        >
          {status}
        </Badge>
      </div>

      {/* Main Gauge */}
      <Card className="relative p-8 shadow-gauge">
        <CardContent className="p-0">
          <div className="relative w-80 h-80 mx-auto">
            {/* Gauge Background Circle */}
            <div className="absolute inset-0 rounded-full bg-gauge-bg shadow-inner border-4 border-muted-foreground/20">
              {/* Color zones background */}
              <div 
                className="absolute inset-4 rounded-full"
                style={{
                  background: `conic-gradient(
                    from -135deg,
                    hsl(var(--gauge-safe)) 0deg ${((warningThreshold - min) / (max - min)) * 270}deg,
                    hsl(var(--gauge-warning)) ${((warningThreshold - min) / (max - min)) * 270}deg ${((dangerThreshold - min) / (max - min)) * 270}deg,
                    hsl(var(--gauge-danger)) ${((dangerThreshold - min) / (max - min)) * 270}deg 270deg,
                    transparent 270deg
                  )`
                }}
              />
              
              {/* Inner circle to create ring effect */}
              <div className="absolute inset-12 rounded-full bg-gauge-bg shadow-inner" />
            </div>

            {/* Tick marks and labels */}
            <div className="absolute inset-0 flex items-center justify-center">
              {tickMarks}
            </div>

            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary shadow-gauge z-20" />

            {/* Needle */}
            <div 
              className="absolute top-1/2 left-1/2 origin-bottom z-10 transition-transform duration-700 ease-out"
              style={{
                transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                width: '4px',
                height: '120px',
                background: `linear-gradient(to top, hsl(var(--${color})), hsl(var(--primary)))`,
                borderRadius: '2px 2px 0 0',
                boxShadow: '0 0 10px hsl(var(--primary) / 0.5)'
              }}
            />
            
            {/* Needle tip glow effect */}
            <div 
              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full z-15 transition-all duration-700 ease-out"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-120px)`,
                background: `hsl(var(--${color}))`,
                boxShadow: `0 0 15px hsl(var(--${color}) / 0.8)`
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Digital Readout */}
      <Card className="w-80 bg-gradient-glow">
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-mono font-bold tracking-wider">
              <span className={`text-${color}`}>
                {value.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground ml-2">{unit}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Range: {min} - {max} {unit}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustValue(-5)}
          disabled={value <= min}
          className="h-12 w-12 rounded-full"
        >
          <Minus className="w-5 h-5" />
        </Button>
        
        <div className="text-center min-w-24">
          <div className="text-sm text-muted-foreground">Adjust</div>
          <div className="text-lg font-semibold">Pressure</div>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => adjustValue(5)}
          disabled={value >= max}
          className="h-12 w-12 rounded-full"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};