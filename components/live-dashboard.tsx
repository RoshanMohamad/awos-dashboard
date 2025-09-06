"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useRealtimeSensorData } from "@/hooks/use-realtime-sensor-data";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
      {/* Connection Status Alert */}
      {connectionError && (
        <div className="sticky top-0 z-40 backdrop-blur-md bg-amber-50/90 border-b border-amber-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">{connectionError}</span>
              </div>
              <div className="flex items-center space-x-3">
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className="text-xs font-medium"
                >
                  {isConnected ? "CONNECTED" : "DISCONNECTED"}
                </Badge>
                {connectionSource && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {connectionSource.toUpperCase()}
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={refreshData} className="ml-2">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6 pb-8">
        {/* Status Header */}
        <div className="text-center py-2 lg:py-4">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 mb-1 lg:mb-2">Live Weather Dashboard</h1>
          <p className="text-sm lg:text-base text-slate-600">Real-time monitoring • Runway {runway}</p>
        </div>

        {/* Primary Gauges Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Wind Direction & Speed */}
            <div className="xl:col-span-1">
            <Card className="min-h-[420px] lg:h-[560px] shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3 lg:pb-4 border-b border-slate-100">
                <CardTitle className="text-lg lg:text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Wind Direction & Speed
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center flex-1 p-4 lg:p-6">
                <div className="relative mb-4 lg:mb-6">
                  <svg
                    width="200"
                    height="200"
                    className="lg:w-[240px] lg:h-[240px] transform -rotate-90 drop-shadow-sm"
                    viewBox="0 0 240 240"
                  >
                      {/* Outer ring with degree markings */}
                      <circle
                        cx="120"
                        cy="120"
                        r="110"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="3"
                      />
                      <circle
                        cx="120"
                        cy="120"
                        r="95"
                        fill="none"
                        stroke="#334155"
                        strokeWidth="2"
                      />
                      <circle
                        cx="120"
                        cy="120"
                        r="80"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1"
                      />

                      {/* Degree markings - Major (every 30°) */}
                      {Array.from({ length: 12 }, (_, i) => {
                        const angle = i * 30;
                        const radian = (angle * Math.PI) / 180;
                        const x1 = 120 + 105 * Math.cos(radian);
                        const y1 = 120 + 105 * Math.sin(radian);
                        const x2 = 120 + 95 * Math.cos(radian);
                        const y2 = 120 + 95 * Math.sin(radian);
                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#1e293b"
                            strokeWidth="3"
                          />
                        );
                      })}

                      {/* Degree markings - Minor (every 10°) */}
                      {Array.from({ length: 36 }, (_, i) => {
                        if (i % 3 !== 0) {
                          const angle = i * 10;
                          const radian = (angle * Math.PI) / 180;
                          const x1 = 120 + 105 * Math.cos(radian);
                          const y1 = 120 + 105 * Math.sin(radian);
                          const x2 = 120 + 100 * Math.cos(radian);
                          const y2 = 120 + 100 * Math.sin(radian);
                          return (
                            <line
                              key={i}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#64748b"
                              strokeWidth="1.5"
                            />
                          );
                        }
                        return null;
                      })}

                      {/* Cardinal direction labels */}
                      <text
                        x="120"
                        y="25"
                        textAnchor="middle"
                        className="text-lg font-bold fill-slate-800 transform rotate-90"
                        style={{ transformOrigin: "120px 25px" }}
                      >
                        N
                      </text>
                      <text
                        x="120"
                        y="40"
                        textAnchor="middle"
                        className="text-sm fill-slate-600 transform rotate-90"
                        style={{ transformOrigin: "120px 40px" }}
                      >
                        000
                      </text>

                      <text
                        x="215"
                        y="125"
                        textAnchor="middle"
                        className="text-lg font-bold fill-slate-800 transform rotate-90"
                        style={{ transformOrigin: "215px 125px" }}
                      >
                        E
                      </text>
                      <text
                        x="200"
                        y="125"
                        textAnchor="middle"
                        className="text-sm fill-slate-600 transform rotate-90"
                        style={{ transformOrigin: "200px 125px" }}
                      >
                        090
                      </text>

                      <text
                        x="120"
                        y="225"
                        textAnchor="middle"
                        className="text-lg font-bold fill-slate-800 transform rotate-90"
                        style={{ transformOrigin: "120px 225px" }}
                      >
                        S
                      </text>
                      <text
                        x="120"
                        y="210"
                        textAnchor="middle"
                        className="text-sm fill-slate-600 transform rotate-90"
                        style={{ transformOrigin: "120px 210px" }}
                      >
                        180
                      </text>

                      <text
                        x="25"
                        y="125"
                        textAnchor="middle"
                        className="text-lg font-bold fill-slate-800 transform rotate-90"
                        style={{ transformOrigin: "25px 125px" }}
                      >
                        W
                      </text>
                      <text
                        x="40"
                        y="125"
                        textAnchor="middle"
                        className="text-sm fill-slate-600 transform rotate-90"
                        style={{ transformOrigin: "40px 125px" }}
                      >
                        270
                      </text>

                      {/* Wind direction arrow - Aviation style */}
                      <g
                        transform={`rotate(${weatherData.windDirection} 120 120)`}
                      >
                        {/* Arrow shaft */}
                        <line
                          x1="120"
                          y1="120"
                          x2="120"
                          y2="35"
                          stroke="#dc2626"
                          strokeWidth="5"
                        />
                        {/* Arrow head */}
                        <polygon points="120,30 113,42 127,42" fill="#dc2626" />
                        {/* Arrow tail (feathers) */}
                        <line
                          x1="120"
                          y1="120"
                          x2="113"
                          y2="113"
                          stroke="#dc2626"
                          strokeWidth="3"
                        />
                        <line
                          x1="120"
                          y1="120"
                          x2="127"
                          y2="113"
                          stroke="#dc2626"
                          strokeWidth="3"
                        />
                        {/* Center dot */}
                        <circle
                          cx="120"
                          cy="120"
                          r="6"
                          fill="#dc2626"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                      </g>

                      {/* Wind speed indicator ring */}
                      <circle
                        cx="120"
                        cy="120"
                        r="65"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeDasharray={`${
                          (weatherData.windSpeed / 30) * 408
                        } 408`}
                        strokeLinecap="round"
                        transform="rotate(-90 120 120)"
                      />
                    </svg>
                  </div>
                  <div className="w-full p-3 lg:p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-4 lg:gap-6 text-center">
                      <div>
                        <div className="text-xs lg:text-sm text-slate-600 mb-1 lg:mb-2 font-medium">
                          Wind Speed
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-1">
                          {weatherData.windSpeed}
                        </div>
                        <div className="text-xs lg:text-sm text-slate-500 mb-1">m/s</div>
                        <div className="text-xs text-slate-400">
                          {(weatherData.windSpeed * 1.944).toFixed(1)} kts
                        </div>
                      </div>
                      <div>
                        <div className="text-xs lg:text-sm text-slate-600 mb-1 lg:mb-2 font-medium">
                          Direction
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-slate-800 mb-1">
                          {weatherData.windDirection
                            .toString()
                            .padStart(3, "0")}°
                        </div>
                        <div className="text-xs text-slate-400">Magnetic</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Barometric Pressure */}
            <div className="xl:col-span-1">
              <Card className="min-h-[420px] lg:h-[560px] shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 lg:pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg lg:text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Barometric Pressure
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center flex-1 p-4 lg:p-6">
                  <div className="relative mb-4 lg:mb-6">
                    <svg width="190" height="190" className="lg:w-[220px] lg:h-[220px] drop-shadow-sm" viewBox="0 0 220 220">
                      {/* Outer bezel */}
                      <circle
                        cx="110"
                        cy="110"
                        r="105"
                        fill="#f8fafc"
                        stroke="#1e293b"
                        strokeWidth="4"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="95"
                        fill="#ffffff"
                        stroke="#334155"
                        strokeWidth="2"
                      />

                      {/* Pressure scale markings */}
                      {Array.from({ length: 61 }, (_, i) => {
                        const pressure = 980 + i;
                        const angle = ((pressure - 980) / 60) * 270 - 135;
                        const radian = (angle * Math.PI) / 180;
                        const isMajor = i % 10 === 0;
                        const isMinor = i % 5 === 0;

                        if (isMajor || isMinor) {
                          const x1 = 110 + (isMajor ? 80 : 85) * Math.cos(radian);
                          const y1 = 110 + (isMajor ? 80 : 85) * Math.sin(radian);
                          const x2 = 110 + 90 * Math.cos(radian);
                          const y2 = 110 + 90 * Math.sin(radian);

                          return (
                            <g key={i}>
                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#1e293b"
                                strokeWidth={isMajor ? "3" : "2"}
                              />
                              {isMajor && (
                                <text
                                  x={110 + 70 * Math.cos(radian)}
                                  y={110 + 70 * Math.sin(radian) + 4}
                                  textAnchor="middle"
                                  className="text-xs font-semibold fill-slate-800"
                                >
                                  {pressure}
                                </text>
                              )}
                            </g>
                          );
                        }
                        return null;
                      })}

                      {/* Pressure zones - color coded */}
                      <path
                        d="M 110 110 L 110 30 A 80 80 0 0 1 163 51 Z"
                        fill="#fef3c7"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M 110 110 L 163 51 A 80 80 0 0 1 163 169 Z"
                        fill="#d1fae5"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M 110 110 L 163 169 A 80 80 0 0 1 57 169 Z"
                        fill="#dbeafe"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M 110 110 L 57 169 A 80 80 0 0 1 57 51 Z"
                        fill="#fef3c7"
                        fillOpacity="0.3"
                      />

                      {/* Main pressure needle */}
                      <g
                        transform={`rotate(${
                          ((weatherData.pressure - 980) / 60) * 270 - 135
                        } 110 110)`}
                      >
                        <line
                          x1="110"
                          y1="110"
                          x2="110"
                          y2="35"
                          stroke="#dc2626"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <polygon points="110,30 105,40 115,40" fill="#dc2626" />
                        <circle
                          cx="110"
                          cy="110"
                          r="6"
                          fill="#dc2626"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                      </g>

                      {/* QNH/QFE indicators */}
                      <text
                        x="110"
                        y="150"
                        textAnchor="middle"
                        className="text-xs font-semibold fill-slate-700"
                      >
                        QNH
                      </text>
                      <text
                        x="110"
                        y="165"
                        textAnchor="middle"
                        className="text-xs fill-slate-600"
                      >
                        {weatherData.pressure} hPa
                      </text>
                      <text
                        x="110"
                        y="180"
                        textAnchor="middle"
                        className="text-xs fill-slate-600"
                      >
                        {(weatherData.pressure * 0.02953).toFixed(2)} inHg
                      </text>
                    </svg>
                  </div>

                  <div className="w-full p-3 lg:p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-2 gap-4 lg:gap-6 text-center">
                      <div>
                        <div className="text-xs lg:text-sm text-slate-600 mb-1 lg:mb-2 font-medium">
                          Pressure
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-1">
                          {weatherData.pressure}
                        </div>
                        <div className="text-xs lg:text-sm text-slate-500">hPa</div>
                      </div>
                      <div>
                        <div className="text-xs lg:text-sm text-slate-600 mb-1 lg:mb-2 font-medium">
                          Altimeter
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-1">
                          {(weatherData.pressure * 0.02953).toFixed(2)}
                        </div>
                        <div className="text-xs lg:text-sm text-slate-500">inHg</div>
                      </div>
                    </div>

                    {/* Pressure trend */}
                    <div className="mt-3 lg:mt-4 flex items-center justify-center space-x-2 lg:space-x-3">
                      <span className="text-xs text-slate-500 font-medium">Trend:</span>
                      <svg width="60" height="16" className="lg:w-[80px] lg:h-[20px] opacity-80">
                        <polyline
                          points="5,12 12,9 20,8 28,6 36,8 44,9 52,7 58,5"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="58" cy="5" r="1.5" fill="#3b82f6" />
                      </svg>
                      <span className="text-xs font-medium text-green-600">
                        +0.2 hPa/hr
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Power System Status */}
            <div className="xl:col-span-1">
              <Card className="min-h-[420px] lg:h-[560px] shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 lg:pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg lg:text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Power System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 lg:space-y-6 flex-1 p-4 lg:p-6">
                  {/* Power Switches */}
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-sm lg:text-base font-semibold text-slate-700">Battery Power</span>
                      <div
                        className={`w-14 h-7 lg:w-16 lg:h-8 rounded-full transition-all duration-300 ${
                          weatherData.batteryPower ? "bg-blue-500 shadow-lg shadow-blue-500/30" : "bg-slate-300"
                        } relative`}
                      >
                        <div
                          className={`w-6 h-6 lg:w-7 lg:h-7 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-md ${
                            weatherData.batteryPower
                              ? "translate-x-7 lg:translate-x-8"
                              : "translate-x-0.5"
                          }`}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-sm lg:text-base font-semibold text-slate-700">CEB Power</span>
                      <div
                        className={`w-14 h-7 lg:w-16 lg:h-8 rounded-full transition-all duration-300 ${
                          weatherData.cebPower ? "bg-green-500 shadow-lg shadow-green-500/30" : "bg-slate-300"
                        } relative`}
                      >
                        <div
                          className={`w-6 h-6 lg:w-7 lg:h-7 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-md ${
                            weatherData.cebPower
                              ? "translate-x-7 lg:translate-x-8"
                              : "translate-x-0.5"
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Battery Level Display */}
                  <div className="space-y-3 lg:space-y-4 p-3 lg:p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm lg:text-base font-semibold text-slate-700">Battery Level</span>
                      <span className="text-xl lg:text-2xl font-bold text-blue-600">
                        {weatherData.batteryLevel}%
                      </span>
                    </div>
                    <div className="relative w-full bg-slate-200 rounded-full h-3 lg:h-4 overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out shadow-inner"
                        style={{ width: `${weatherData.batteryLevel}%` }}
                      ></div>
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-white/20 to-transparent rounded-full"
                        style={{ width: `${weatherData.batteryLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="grid grid-cols-2 gap-2 lg:gap-3">
                    <div className="flex flex-col items-center p-2 lg:p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className={`w-3 h-3 rounded-full mb-1 lg:mb-2 ${weatherData.batteryPower ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      <span className="text-xs font-medium text-slate-600">Battery</span>
                    </div>
                    <div className="flex flex-col items-center p-2 lg:p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className={`w-3 h-3 rounded-full mb-1 lg:mb-2 ${weatherData.cebPower ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      <span className="text-xs font-medium text-slate-600">Grid</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-medium"
                  >
                    View Failover Logs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Temperature */}
          <Card className="min-h-[220px] lg:min-h-[240px] shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2 lg:pb-3 border-b border-slate-100">
              <CardTitle className="text-base lg:text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Temperature
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1 p-4 lg:p-6">
              <div className="text-center mb-3 lg:mb-4">
                <div className="text-3xl lg:text-5xl font-bold text-orange-600 mb-1 lg:mb-2">
                  {weatherData.temperature}
                </div>
                <div className="text-lg lg:text-xl text-slate-600 font-medium">°C</div>
              </div>
              <div className="flex items-center space-x-2 px-2 lg:px-3 py-1 bg-orange-50 rounded-full">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-xs font-medium text-orange-700">Normal Range</span>
              </div>
            </CardContent>
          </Card>

          {/* Humidity */}
          <Card className="min-h-[220px] lg:min-h-[240px] shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2 lg:pb-3 border-b border-slate-100">
              <CardTitle className="text-base lg:text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Humidity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1 p-4 lg:p-6">
              <div className="text-center mb-3 lg:mb-4">
                <div className="text-3xl lg:text-5xl font-bold text-blue-600 mb-1 lg:mb-2">
                  {weatherData.humidity}
                </div>
                <div className="text-lg lg:text-xl text-slate-600 font-medium">%</div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 lg:h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 lg:h-3 rounded-full transition-all duration-500"
                  style={{ width: `${weatherData.humidity}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Dew Point */}
          <Card className="min-h-[220px] lg:min-h-[240px] shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2 lg:pb-3 border-b border-slate-100">
              <CardTitle className="text-base lg:text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                Dew Point
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1 p-4 lg:p-6">
              <div className="text-center mb-3 lg:mb-4">
                <div className="text-3xl lg:text-5xl font-bold text-teal-600 mb-1 lg:mb-2">
                  {weatherData.dewPoint}
                </div>
                <div className="text-lg lg:text-xl text-slate-600 font-medium">°C</div>
              </div>
              <div className="flex items-center space-x-2 px-2 lg:px-3 py-1 bg-teal-50 rounded-full">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span className="text-xs font-medium text-teal-700">Optimal</span>
              </div>
            </CardContent>
          </Card>

          {/* Live Alerts */}
          <Card className="min-h-[220px] lg:min-h-[240px] shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2 lg:pb-3 border-b border-slate-100">
              <CardTitle className="text-base lg:text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Live Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 lg:space-y-3 flex-1 overflow-y-auto p-3 lg:p-4">
              <div className="p-2 lg:p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2 lg:space-x-3">
                <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-amber-800">Sensor faults</span>
              </div>
              <div className="p-2 lg:p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 lg:space-x-3">
                <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-red-600 flex-shrink-0" />
                <span className="text-xs lg:text-sm font-medium text-red-800">Low battery</span>
              </div>
              {alerts.slice(0, 2).map((alert, index) => (
                <div
                  key={index}
                  className="p-2 lg:p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center space-x-1 lg:space-x-2 mb-1 lg:mb-2">
                    <AlertTriangle className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs lg:text-sm font-semibold text-blue-800">
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-1">
                    {alert.message}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-3 lg:py-4 text-slate-500 text-xs lg:text-sm">
          Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Never'}
        </div>
      </div>
    </div>
  );
}
