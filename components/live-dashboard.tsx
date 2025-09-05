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
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* Connection Status Alert */}
      {connectionError && (
        <div className="p-2 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">{connectionError}</span>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className="text-xs"
              >
                {isConnected ? "CONNECTED" : "DISCONNECTED"}
              </Badge>
              {connectionSource && (
                <Badge className="text-xs ml-2">
                  {connectionSource.toUpperCase()}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Fixed Height Layout with Proper Bottom Row Display */}
      <div
        className={`${
          connectionError ? "h-[calc(100vh-60px)]" : "h-screen"
        } p-4 bg-gray-50 flex flex-col`}
      >
        <div className="h-full flex-grow flex-col space-y-4">
          {/* Top Row - Fixed height for gauges */}
          <div className="h-[400px] grid grid-cols-12 gap-4">
            {/* Wind Direction & Speed */}
            <div className="col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Wind Direction & Speed
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[calc(100%-50px)]">
                  <div className="relative mb-3">
                    <svg
                      width="220"
                      height="220"
                      className="transform -rotate-90"
                    >
                      {/* Outer ring with degree markings */}
                      <circle
                        cx="110"
                        cy="110"
                        r="100"
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="3"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="85"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="2"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="70"
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="1"
                      />

                      {/* Degree markings - Major (every 30°) */}
                      {Array.from({ length: 12 }, (_, i) => {
                        const angle = i * 30;
                        const radian = (angle * Math.PI) / 180;
                        const x1 = 110 + 95 * Math.cos(radian);
                        const y1 = 110 + 95 * Math.sin(radian);
                        const x2 = 110 + 85 * Math.cos(radian);
                        const y2 = 110 + 85 * Math.sin(radian);
                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#1f2937"
                            strokeWidth="3"
                          />
                        );
                      })}

                      {/* Degree markings - Minor (every 10°) */}
                      {Array.from({ length: 36 }, (_, i) => {
                        if (i % 3 !== 0) {
                          // Skip major markings
                          const angle = i * 10;
                          const radian = (angle * Math.PI) / 180;
                          const x1 = 110 + 95 * Math.cos(radian);
                          const y1 = 110 + 95 * Math.sin(radian);
                          const x2 = 110 + 90 * Math.cos(radian);
                          const y2 = 110 + 90 * Math.sin(radian);
                          return (
                            <line
                              key={i}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="#6b7280"
                              strokeWidth="1"
                            />
                          );
                        }
                        return null;
                      })}

                      {/* Cardinal direction labels */}
                      <text
                        x="110"
                        y="25"
                        textAnchor="middle"
                        className="text-lg font-bold fill-gray-800 transform rotate-90"
                        style={{ transformOrigin: "110px 25px" }}
                      >
                        N
                      </text>
                      <text
                        x="110"
                        y="35"
                        textAnchor="middle"
                        className="text-sm fill-gray-600 transform rotate-90"
                        style={{ transformOrigin: "110px 35px" }}
                      >
                        000
                      </text>

                      <text
                        x="195"
                        y="115"
                        textAnchor="middle"
                        className="text-lg font-bold fill-gray-800 transform rotate-90"
                        style={{ transformOrigin: "195px 115px" }}
                      >
                        E
                      </text>
                      <text
                        x="185"
                        y="115"
                        textAnchor="middle"
                        className="text-sm fill-gray-600 transform rotate-90"
                        style={{ transformOrigin: "185px 115px" }}
                      >
                        090
                      </text>

                      <text
                        x="110"
                        y="205"
                        textAnchor="middle"
                        className="text-lg font-bold fill-gray-800 transform rotate-90"
                        style={{ transformOrigin: "110px 205px" }}
                      >
                        S
                      </text>
                      <text
                        x="110"
                        y="195"
                        textAnchor="middle"
                        className="text-sm fill-gray-600 transform rotate-90"
                        style={{ transformOrigin: "110px 195px" }}
                      >
                        180
                      </text>

                      <text
                        x="25"
                        y="115"
                        textAnchor="middle"
                        className="text-lg font-bold fill-gray-800 transform rotate-90"
                        style={{ transformOrigin: "25px 115px" }}
                      >
                        W
                      </text>
                      <text
                        x="35"
                        y="115"
                        textAnchor="middle"
                        className="text-sm fill-gray-600 transform rotate-90"
                        style={{ transformOrigin: "35px 115px" }}
                      >
                        270
                      </text>

                      {/* Wind direction arrow - Aviation style */}
                      <g
                        transform={`rotate(${weatherData.windDirection} 110 110)`}
                      >
                        {/* Arrow shaft */}
                        <line
                          x1="110"
                          y1="110"
                          x2="110"
                          y2="30"
                          stroke="#dc2626"
                          strokeWidth="4"
                        />
                        {/* Arrow head */}
                        <polygon points="110,25 105,35 115,35" fill="#dc2626" />
                        {/* Arrow tail (feathers) */}
                        <line
                          x1="110"
                          y1="110"
                          x2="105"
                          y2="105"
                          stroke="#dc2626"
                          strokeWidth="2"
                        />
                        <line
                          x1="110"
                          y1="110"
                          x2="115"
                          y2="105"
                          stroke="#dc2626"
                          strokeWidth="2"
                        />
                        {/* Center dot */}
                        <circle
                          cx="110"
                          cy="110"
                          r="5"
                          fill="#dc2626"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                      </g>

                      {/* Wind speed indicator ring */}
                      <circle
                        cx="110"
                        cy="110"
                        r="55"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="6"
                        strokeDasharray={`${
                          (weatherData.windSpeed / 30) * 345
                        } 345`}
                        strokeLinecap="round"
                        transform="rotate(-90 110 110)"
                      />
                    </svg>
                  </div>
                  <div className="w-full p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Wind Speed
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {weatherData.windSpeed} m/s
                        </div>
                        <div className="text-xs text-gray-500">
                          {(weatherData.windSpeed * 1.944).toFixed(1)} kts
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Direction
                        </div>
                        <div className="text-2xl font-bold text-gray-800">
                          {weatherData.windDirection
                            .toString()
                            .padStart(3, "0")}
                          °
                        </div>
                        <div className="text-xs text-gray-500">Magnetic</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Barometric Pressure */}
            <div className="col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Barometric Pressure</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[calc(100%-50px)]">
                  <div className="relative mb-4">
                    <svg width="200" height="200">
                      {/* Outer bezel */}
                      <circle
                        cx="100"
                        cy="100"
                        r="95"
                        fill="#f8f9fa"
                        stroke="#1f2937"
                        strokeWidth="4"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="#ffffff"
                        stroke="#374151"
                        strokeWidth="2"
                      />

                      {/* Pressure scale markings */}
                      {Array.from({ length: 61 }, (_, i) => {
                        const pressure = 980 + i; // 980 to 1040 hPa
                        const angle = ((pressure - 980) / 60) * 270 - 135; // -135° to +135°
                        const radian = (angle * Math.PI) / 180;
                        const isMajor = i % 10 === 0;
                        const isMinor = i % 5 === 0;

                        if (isMajor || isMinor) {
                          const x1 =
                            100 + (isMajor ? 75 : 78) * Math.cos(radian);
                          const y1 =
                            100 + (isMajor ? 75 : 78) * Math.sin(radian);
                          const x2 = 100 + 82 * Math.cos(radian);
                          const y2 = 100 + 82 * Math.sin(radian);

                          return (
                            <g key={i}>
                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#1f2937"
                                strokeWidth={isMajor ? "3" : "2"}
                              />
                              {isMajor && (
                                <text
                                  x={100 + 65 * Math.cos(radian)}
                                  y={100 + 65 * Math.sin(radian) + 4}
                                  textAnchor="middle"
                                  className="text-xs font-semibold fill-gray-800"
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
                        d="M 100 100 L 100 25 A 75 75 0 0 1 153 46 Z"
                        fill="#fef3c7"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M 100 100 L 153 46 A 75 75 0 0 1 153 154 Z"
                        fill="#d1fae5"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M 100 100 L 153 154 A 75 75 0 0 1 47 154 Z"
                        fill="#dbeafe"
                        fillOpacity="0.3"
                      />
                      <path
                        d="M 100 100 L 47 154 A 75 75 0 0 1 47 46 Z"
                        fill="#fef3c7"
                        fillOpacity="0.3"
                      />

                      {/* Main pressure needle */}
                      <g
                        transform={`rotate(${
                          ((weatherData.pressure - 980) / 60) * 270 - 135
                        } 100 100)`}
                      >
                        <line
                          x1="100"
                          y1="100"
                          x2="100"
                          y2="30"
                          stroke="#dc2626"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        <polygon points="100,25 95,35 105,35" fill="#dc2626" />
                        <circle
                          cx="100"
                          cy="100"
                          r="6"
                          fill="#dc2626"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                      </g>

                      {/* QNH/QFE indicators */}
                      <text
                        x="100"
                        y="140"
                        textAnchor="middle"
                        className="text-xs font-semibold fill-gray-700"
                      >
                        QNH
                      </text>
                      <text
                        x="100"
                        y="155"
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                      >
                        {weatherData.pressure} hPa
                      </text>
                      <text
                        x="100"
                        y="170"
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                      >
                        {(weatherData.pressure * 0.02953).toFixed(2)} inHg
                      </text>
                    </svg>
                  </div>

                  <div className="w-full p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Pressure
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {weatherData.pressure}
                        </div>
                        <div className="text-xs text-gray-500">hPa</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Altimeter
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {(weatherData.pressure * 0.02953).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">inHg</div>
                      </div>
                    </div>

                    {/* Pressure trend */}
                    <div className="mt-3 flex items-center justify-center space-x-2">
                      <span className="text-xs text-gray-500">Trend:</span>
                      <svg width="80" height="20">
                        <polyline
                          points="5,15 15,12 25,10 35,8 45,10 55,12 65,9 75,7"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="75" cy="7" r="2" fill="#3b82f6" />
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
            <div className="col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Power System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 h-[calc(100%-50px)]">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium">Battery Power</span>
                    <div
                      className={`w-14 h-7 rounded-full ${
                        weatherData.batteryPower ? "bg-blue-500" : "bg-gray-300"
                      } relative`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform shadow-md ${
                          weatherData.batteryPower
                            ? "translate-x-7"
                            : "translate-x-0.5"
                        }`}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium">CEB Power</span>
                    <div
                      className={`w-14 h-7 rounded-full ${
                        weatherData.cebPower ? "bg-blue-500" : "bg-gray-300"
                      } relative`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform shadow-md ${
                          weatherData.cebPower
                            ? "translate-x-7"
                            : "translate-x-0.5"
                        }`}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="font-medium">Battery Level:</span>
                      <span className="font-bold text-blue-600">
                        {weatherData.batteryLevel}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${weatherData.batteryLevel}%` }}
                      ></div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent text-sm py-2"
                  >
                    Failover logs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Row - Fixed height to ensure visibility */}
          <div className="h-[200px] grid grid-cols-12 gap-4">
            {/* Temperature, Humidity, Dew Point */}
            <div className="col-span-9 grid grid-cols-3 gap-4">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Temperature</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[calc(100%-50px)]">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {weatherData.temperature}
                    </div>
                    <div className="text-xl text-gray-600">°C</div>
                  </div>
                  {/* Temperature trend indicator */}
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Normal Range</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Humidity</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[calc(100%-50px)]">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {weatherData.humidity}
                    </div>
                    <div className="text-xl text-gray-600">%</div>
                  </div>
                  {/* Humidity level indicator */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${weatherData.humidity}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Dew Point</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-[calc(100%-50px)]">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-teal-600 mb-2">
                      {weatherData.dewPoint}
                    </div>
                    <div className="text-xl text-gray-600">°C</div>
                  </div>
                  {/* Dew point status */}
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Optimal</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Alerts */}
            <div className="col-span-3">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Live Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 h-[calc(100%-50px)] overflow-y-auto">
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm">Sensor faults</span>
                  </div>
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm">Low battery</span>
                  </div>
                  {alerts.slice(0, 4).map((alert, index) => (
                    <div
                      key={index}
                      className="p-2 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
