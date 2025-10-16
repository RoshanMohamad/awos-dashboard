"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useLocalRealtimeSensorData as useRealtimeSensorData } from "@/hooks/use-local-realtime-data";

interface LiveDashboardProps {
  runway: string;
}

// alerts use the Alert shape from `lib/websocket.ts` (has `timestamp`), not a local `time` field

export function LiveDashboard({ runway }: LiveDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const {
    sensorData,
    alerts,
    isConnected,
    connectionSource,
    connectionError,
    lastUpdate,
    refreshData,
    pollingActive,
  } = useRealtimeSensorData(runway);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Use real sensor data or fallback to default values
  const weatherData = sensorData || {
    windSpeed: 12.5,
    windDirection: 245,
    pressure: 1013.25,
    temperature: 28.5,
    humidity: 75,
    dewPoint: 23.8,
    batteryLevel: 85,
    cebPower: true,
    batteryPower: true,
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden flex flex-col">
     

      {/* Connection Status Alert */}
      {/* <div className="flex-shrink-0 z-40 backdrop-blur-md bg-slate-50/90 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {connectionError ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-800">{connectionError}</span>
                </>
              ) : (
                <>
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : pollingActive ? (
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-xs font-medium text-slate-700">
                    {isConnected ? 'Real-time connected' : pollingActive ? 'Polling for updates' : 'Disconnected'}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={isConnected ? "default" : pollingActive ? "secondary" : "destructive"}
                className="text-xs"
              >
                {isConnected ? "REALTIME" : pollingActive ? "POLLING" : "OFFLINE"}
              </Badge>
              {connectionSource && (
                <Badge variant="outline" className="text-xs">
                  {connectionSource.toUpperCase()}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={refreshData} className="ml-2">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Content Container */}
      <div className="flex-1 max-w-8xl mx-auto p-2 lg:p-4 space-y-2 lg:space-y-4 overflow-hidden flex flex-col">
        {/* Status Header */}
        {/* <div className="flex-shrink-0 text-center py-1 lg:py-2">
          <h1 className="text-lg lg:text-xl font-bold text-slate-800 mb-1">Live Weather Dashboard</h1>
          <p className="text-xs lg:text-sm text-slate-600">Real-time monitoring • Runway {runway}</p>
        </div> */}

        {/* Primary Gauges Row */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-6 gap-2 lg:gap-4 min-h-100px">
          {/* Wind Direction & Speed */}
            <div className="xl:col-span-3 flex">
            <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm flex flex-col">
              <CardHeader className="pb-2 border-b border-slate-100 flex-shrink-0">
                <CardTitle className="text-sm lg:text-base font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Wind Direction & Speed
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center flex-1 p-2 lg:p-3">
                <div className="relative mb-2 lg:mb-3 flex-1 flex items-center justify-center">
                  {/* Maritime Compass */}
                  <div className="relative">
                    {/* Outer brass frame */}
                    <div 
                      className="relative w-40 h-40 lg:w-96 lg:h-96 rounded-full shadow-2xl"
                      style={{
                        background: "var(--gradient-brass)",
                        boxShadow: "var(--shadow-compass)",
                      }}
                    >
                      {/* Inner bezel */}
                      <div 
                        className="absolute inset-1 rounded-full border-2 border-orange-800"
                        style={{
                          background: "var(--gradient-depth)",
                          boxShadow: "var(--shadow-inner)",
                        }}
                      >
                        {/* Compass face */}
                        <div 
                          className="absolute inset-1 rounded-full border border-orange-800/30"
                          style={{
                            background: "var(--gradient-compass-face)",
                          }}
                        >
                          {/* Degree markings */}
                          <div className="absolute inset-0">
                            {Array.from({ length: 36 }, (_, i) => {
                              const degree = i * 10;
                              return (
                                <div
                                  key={degree}
                                  className="absolute w-0.5 bg-orange-800 origin-bottom"
                                  style={{
                                    height: degree % 30 === 0 ? "12px" : degree % 10 === 0 ? "8px" : "6px",
                                    left: "50%",
                                    bottom: "50%",
                                    transform: `translateX(-50%) rotate(${degree}deg)`,
                                    transformOrigin: "50% 100%",
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Cardinal directions */}
                          <div className="absolute inset-0">
                            {[
                              { angle: 0, label: "N", isMain: true },
                              { angle: 45, label: "NE", isMain: false },
                              { angle: 90, label: "E", isMain: true },
                              { angle: 135, label: "SE", isMain: false },
                              { angle: 180, label: "S", isMain: true },
                              { angle: 225, label: "SW", isMain: false },
                              { angle: 270, label: "W", isMain: true },
                              { angle: 315, label: "NW", isMain: false },
                            ].map((direction) => (
                              <div
                                key={direction.label}
                                className="absolute font-bold transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                  left: `${50 + 35 * Math.sin((direction.angle * Math.PI) / 180)}%`,
                                  top: `${50 - 35 * Math.cos((direction.angle * Math.PI) / 180)}%`,
                                  color: direction.isMain ? "hsl(var(--compass-needle-north))" : "hsl(var(--compass-bronze))",
                                  fontSize: direction.isMain ? "0.875rem" : "0.75rem",
                                  textShadow: "0 1px 2px hsl(var(--compass-shadow) / 0.8)",
                                }}
                              >
                                {direction.label}
                              </div>
                            ))}
                          </div>

                          {/* Center pivot */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-orange-800 border-2 border-yellow-600 z-20" />

                          {/* Compass needle */}
                          <div
                            className="absolute top-1/2 left-1/2 origin-center transition-transform duration-1000 ease-out"
                            style={{
                              transform: `translate(-50%, -50%) rotate(${weatherData.windDirection}deg)`,
                              transition: "var(--transition-needle)",
                            }}
                          >
                            {/* North pointer (red) */}
                            <div 
                              className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-0 h-0 z-10"
                              style={{
                                borderLeft: "6px solid transparent",
                                borderRight: "6px solid transparent",
                                borderBottom: "64px solid hsl(var(--compass-needle-north))",
                                filter: "drop-shadow(var(--shadow-needle))",
                              }}
                            />
                            
                            {/* South pointer (white) */}
                            <div 
                              className="absolute top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 z-10"
                              style={{
                                borderLeft: "4px solid transparent",
                                borderRight: "4px solid transparent",
                                borderTop: "48px solid hsl(var(--compass-needle-south))",
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
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 lg:w-36 h-3 rounded-full opacity-60"
                      style={{
                        background: "var(--gradient-brass)",
                        boxShadow: "0 8px 20px hsl(var(--compass-shadow) / 0.6)",
                      }}
                    />
                  </div>
                </div>
                  <div className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 flex-shrink-0">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-xs text-slate-600 mb-1 font-medium">Speed</div>
                        <div className="text-lg font-bold text-blue-600">{weatherData.windSpeed}</div>
                        <div className="text-xs text-slate-500">m/s</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600 mb-1 font-medium">Knots</div>
                        <div className="text-lg font-bold text-blue-600">{(weatherData.windSpeed * 1.944).toFixed(1)}</div>
                        <div className="text-xs text-slate-500">kts</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600 mb-1 font-medium">Direction</div>
                        <div className="text-lg font-bold text-slate-800">{weatherData.windDirection.toString().padStart(3, "0")}°</div>
                        <div className="text-xs text-slate-400">Mag</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600 mb-1 font-medium">Temp</div>
                        <div className="text-lg font-bold text-orange-600">{weatherData.temperature}</div>
                        <div className="text-xs text-slate-500">°C</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Power System Status */}
            <div className="xl:col-span-2 flex">
              <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm flex flex-col">
                <CardHeader className="pb-2 border-b border-slate-100 flex-shrink-0">
                  <CardTitle className="text-sm lg:text-base font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Power System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 lg:space-y-3 flex-1 p-2 lg:p-3">
                  <div className="flex-1 flex flex-col justify-center space-y-3">
                    {/* Battery Level Display */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">Battery Level</span>
                        <span className="text-xl font-bold text-blue-600">{weatherData.batteryLevel}%</span>
                      </div>
                      <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${weatherData.batteryLevel}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Power Status Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${weatherData.batteryPower ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                        <span className="text-xs font-medium text-slate-600">Battery</span>
                        <div className="text-xs text-slate-500">{weatherData.batteryPower ? 'ON' : 'OFF'}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${weatherData.cebPower ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span className="text-xs font-medium text-slate-600">Grid</span>
                        <div className="text-xs text-slate-500">{weatherData.cebPower ? 'ON' : 'OFF'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardHeader className="pb-2 border-b border-slate-100 flex-shrink-0">
                  <CardTitle className="text-sm lg:text-base font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Barometric Pressure
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center flex-1 p-1 lg:p-2">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Professional Pressure Gauge */}
                    <div className="relative scale-75 lg:scale-90">
                      <div className="relative w-48 h-48 mx-auto">
                        {/* Gauge Background Circle */}
                        <div className="absolute inset-0 rounded-full shadow-inner border-4 border-muted-foreground/20"
                          style={{ background: "hsl(var(--gauge-bg))" }}>
                          
                          {/* Color zones background */}
                          <div 
                            className="absolute inset-2 rounded-full"
                            style={{
                              background: `conic-gradient(
                                from -135deg,
                                hsl(var(--gauge-safe)) 0deg ${((1020 - 980) / 60) * 270}deg,
                                hsl(var(--gauge-warning)) ${((1020 - 980) / 60) * 270}deg ${((1030 - 980) / 60) * 270}deg,
                                hsl(var(--gauge-danger)) ${((1030 - 980) / 60) * 270}deg 270deg,
                                transparent 270deg
                              )`
                            }}
                          />
                          
                          {/* Inner circle to create ring effect */}
                          <div className="absolute inset-8 rounded-full shadow-inner" 
                            style={{ background: "hsl(var(--gauge-bg))" }} />
                        </div>

                        {/* Tick marks and labels */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {Array.from({ length: 11 }, (_, i) => {
                            const tickAngle = -135 + (i * 27); // 270deg / 10 = 27deg per tick
                            const pressure = 980 + (i * 6); // 980-1040 range
                            const isMarked = i % 2 === 0; // Major ticks every other mark
                            
                            return (
                              <div key={i}>
                                <div
                                  className={`absolute ${isMarked ? 'w-1 h-6 bg-muted-foreground' : 'w-0.5 h-3 bg-muted-foreground/50'}`}
                                  style={{
                                    transform: `rotate(${tickAngle}deg) translateY(-80px)`,
                                    transformOrigin: 'bottom center',
                                  }}
                                />
                                {isMarked && (
                                  <div
                                    className="absolute text-xs font-medium text-muted-foreground"
                                    style={{
                                      transform: `rotate(${tickAngle}deg) translateY(-95px) rotate(-${tickAngle}deg)`,
                                      transformOrigin: 'bottom center',
                                    }}
                                  >
                                    {pressure}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Center Hub */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary z-20"
                          style={{ boxShadow: "var(--shadow-gauge)" }} />

                        {/* Needle */}
                        <div 
                          className="absolute top-1/2 left-1/2 origin-bottom z-10 transition-transform duration-700 ease-out"
                          style={{
                            transform: `translate(-50%, -100%) rotate(${((weatherData.pressure - 980) / 60) * 270 - 135}deg)`,
                            width: '3px',
                            height: '75px',
                            background: `linear-gradient(to top, hsl(var(--gauge-safe)), hsl(var(--primary)))`,
                            borderRadius: '1.5px 1.5px 0 0',
                            boxShadow: '0 0 8px hsl(var(--primary) / 0.5)'
                          }}
                        />
                        
                        {/* Needle tip glow effect */}
                        <div 
                          className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full z-15 transition-all duration-700 ease-out"
                          style={{
                            transform: `translate(-50%, -50%) rotate(${((weatherData.pressure - 980) / 60) * 270 - 135}deg) translateY(-75px)`,
                            background: `hsl(var(--gauge-safe))`,
                            boxShadow: `0 0 12px hsl(var(--gauge-safe) / 0.8)`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Digital Readout */}
                  <div className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 flex-shrink-0 mt-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-slate-600 mb-1 font-medium">Pressure</div>
                        <div className="text-lg font-bold text-green-600">{weatherData.pressure}</div>
                        <div className="text-xs text-slate-500">hPa</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600 mb-1 font-medium">Altimeter</div>
                        <div className="text-lg font-bold text-green-600">{(weatherData.pressure * 0.02953).toFixed(2)}</div>
                        <div className="text-xs text-slate-500">inHg</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-600 mb-1 font-medium">Trend</div>
                        <div className="text-lg font-bold text-green-600">+0.2</div>
                        <div className="text-xs text-slate-500">hPa/hr</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="xl:col-span-1 flex">
              <Card className="flex-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm flex flex-col">
                <CardHeader className="pb-2 border-b border-slate-100 flex-shrink-0">
                  <CardTitle className="text-sm lg:text-base font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Environmental Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-2 lg:p-3">
                  <div className="h-full grid grid-cols-1 gap-3">
                    {/* Humidity */}
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-blue-800">Humidity</span>
                        <span className="text-2xl font-bold text-blue-600">{weatherData.humidity}%</span>
                      </div>
                      <div className="relative w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${weatherData.humidity}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">Relative Humidity</div>
                    </div>

                    {/* Temperature */}
                    <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-red-800">Temperature</span>
                        <span className="text-2xl font-bold text-red-600">{weatherData.temperature}°C</span>
                      </div>
                      <div className="relative w-full bg-red-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${weatherData.temperature}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-red-600 mt-1">Current Temperature</div>
                    </div>

                    {/* Dew Point */}
                    <div className="p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-teal-800">Dew Point</span>
                        <span className="text-2xl font-bold text-teal-600">{weatherData.dewPoint}°C</span>
                      </div>
                      <div className="text-xs text-teal-600">
                        Spread: {(weatherData.temperature - weatherData.dewPoint).toFixed(1)}°C
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                      <div className="text-sm font-semibold text-slate-800 mb-2">System Status</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center">
                          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                            isConnected ? 'bg-green-500' : 
                            pollingActive ? 'bg-blue-500 animate-pulse' : 
                            'bg-red-500'
                          }`}></div>
                          <div className="text-xs text-slate-600">
                            {isConnected ? 'Real-time' : pollingActive ? 'Polling' : 'Offline'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                            sensorData ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <div className="text-xs text-slate-600">Sensors</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        {/* Compact Status Footer */}
        <div className="flex-shrink-0 text-center py-1 text-slate-500 text-xs">
          Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'} | Humidity: {weatherData.humidity}% | Dew Point: {weatherData.dewPoint}°C
        </div>
      </div>
    </div>
  );
}
