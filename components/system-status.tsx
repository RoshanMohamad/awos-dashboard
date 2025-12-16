"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Wifi,
  WifiOff,
  Database,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  CircleDot,
} from "lucide-react";

interface SystemStatusProps {
  className?: string;
}

const sensorThresholds = [
  {
    sensor: "Temperature",
    unit: "°C",
    normal: { min: "26.0", max: "31.5" },
    warning: { min: "24.5", max: "32.5" },
    critical: { min: "23.0", max: "34.0" },
  },
  {
    sensor: "Humidity",
    unit: "%",
    normal: { min: "65", max: "85" },
    warning: { min: "58", max: "92" },
    critical: { min: "50", max: "96" },
  },
  {
    sensor: "Pressure",
    unit: "hPa",
    normal: { min: "1008.0", max: "1011.5" },
    warning: { min: "1006.0", max: "1013.0" },
    critical: { min: "1004.0", max: "1015.0" },
  },
  {
    sensor: "Wind Speed",
    unit: "m/s",
    normal: { min: "4.0", max: "14.0" },
    warning: { min: "2.0", max: "16.0" },
    critical: { min: "0.5", max: "20.0" },
  },
  {
    sensor: "Wind Direction",
    unit: "°",
    normal: { min: "0", max: "360" },
    warning: { min: "0", max: "360" },
    critical: { min: "Invalid", max: "Invalid" },
  },
  {
    sensor: "Dew Point",
    unit: "°C",
    normal: { min: "23.5", max: "25.5" },
    warning: { min: "22.0", max: "26.5" },
    critical: { min: "20.0", max: "28.0" },
  },
];

export function SystemStatus({ className = "" }: SystemStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemHealth, setSystemHealth] = useState({
    esp32Connection: true,
    databaseStatus: true,
    apiStatus: true,
    lastDataUpdate: new Date(),
    dataPointsToday: 2847,
    systemUptime: "24d 7h 32m",
    sensors: {
      temperature: true,
      humidity: true,
      pressure: true,
      windSpeed: true,
      windDirection: true,
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate system health checks
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      setSystemHealth((prev) => ({
        ...prev,
        lastDataUpdate: new Date(),
        dataPointsToday: prev.dataPointsToday + Math.floor(Math.random() * 3),
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-600">
        Online
      </Badge>
    ) : (
      <Badge variant="destructive">Offline</Badge>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* System Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>
            Real-time system health and connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {systemHealth.esp32Connection ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <div className="text-sm font-medium">ESP32</div>
                  <div className="text-xs text-gray-500">Weather Station</div>
                </div>
              </div>
              {getStatusBadge(systemHealth.esp32Connection)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium">Database</div>
                  <div className="text-xs text-gray-500">Data Storage</div>
                </div>
              </div>
              {getStatusBadge(systemHealth.databaseStatus)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Server className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm font-medium">API Server</div>
                  <div className="text-xs text-gray-500">Backend Service</div>
                </div>
              </div>
              {getStatusBadge(systemHealth.apiStatus)}
            </div>
          </div>

          {/* System Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {systemHealth.dataPointsToday.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Data Points Today</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {systemHealth.systemUptime}
              </div>
              <div className="text-xs text-gray-600">System Uptime</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(
                  (new Date().getTime() -
                    systemHealth.lastDataUpdate.getTime()) /
                    60000
                )}
                m
              </div>
              <div className="text-xs text-gray-600">Last Update</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">5</div>
              <div className="text-xs text-gray-600">Active Sensors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensor Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <span>Sensor Health</span>
          </CardTitle>
          <CardDescription>
            Individual sensor status and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemHealth.sensors.temperature)}
                  <span className="text-sm font-medium">
                    Temperature Sensor
                  </span>
                </div>
                <Badge
                  variant={
                    systemHealth.sensors.temperature ? "default" : "destructive"
                  }
                  className="text-xs"
                >
                  {systemHealth.sensors.temperature ? "Normal" : "Error"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemHealth.sensors.humidity)}
                  <span className="text-sm font-medium">Humidity Sensor</span>
                </div>
                <Badge
                  variant={
                    systemHealth.sensors.humidity ? "default" : "destructive"
                  }
                  className="text-xs"
                >
                  {systemHealth.sensors.humidity ? "Normal" : "Error"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemHealth.sensors.pressure)}
                  <span className="text-sm font-medium">Pressure Sensor</span>
                </div>
                <Badge
                  variant={
                    systemHealth.sensors.pressure ? "default" : "destructive"
                  }
                  className="text-xs"
                >
                  {systemHealth.sensors.pressure ? "Normal" : "Error"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemHealth.sensors.windSpeed)}
                  <span className="text-sm font-medium">Wind Speed Sensor</span>
                </div>
                <Badge
                  variant={
                    systemHealth.sensors.windSpeed ? "default" : "destructive"
                  }
                  className="text-xs"
                >
                  {systemHealth.sensors.windSpeed ? "Normal" : "Error"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemHealth.sensors.windDirection)}
                  <span className="text-sm font-medium">
                    Wind Direction Sensor
                  </span>
                </div>
                <Badge
                  variant={
                    systemHealth.sensors.windDirection
                      ? "default"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {systemHealth.sensors.windDirection ? "Normal" : "Error"}
                </Badge>
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Threshold Reference</span>
          </CardTitle>
          <CardDescription>
            Normalized ranges that drive the health option alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-600">
                  <th className="px-3 py-2 text-left uppercase tracking-wide">Sensor</th>
                  <th className="px-3 py-2 text-left uppercase tracking-wide">Unit</th>
                  <th className="px-3 py-2 text-center uppercase tracking-wide">Normal Min</th>
                  <th className="px-3 py-2 text-center uppercase tracking-wide">Normal Max</th>
                  <th className="px-3 py-2 text-center uppercase tracking-wide">
                    <span className="flex items-center justify-center gap-1 text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Warning Low
                    </span>
                  </th>
                  <th className="px-3 py-2 text-center uppercase tracking-wide">
                    <span className="flex items-center justify-center gap-1 text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Warning High
                    </span>
                  </th>
                  <th className="px-3 py-2 text-center uppercase tracking-wide">
                    <span className="flex items-center justify-center gap-1 text-red-700">
                      <CircleDot className="h-3.5 w-3.5" />
                      Critical Low
                    </span>
                  </th>
                  <th className="px-3 py-2 text-center uppercase tracking-wide">
                    <span className="flex items-center justify-center gap-1 text-red-700">
                      <CircleDot className="h-3.5 w-3.5" />
                      Critical High
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sensorThresholds.map((entry) => (
                  <tr key={entry.sensor} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {entry.sensor}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{entry.unit}</td>
                    <td className="px-3 py-2 text-center text-gray-800">
                      {entry.normal.min}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-800">
                      {entry.normal.max}
                    </td>
                    <td className="px-3 py-2 text-center text-amber-700">
                      {entry.warning.min}
                    </td>
                    <td className="px-3 py-2 text-center text-amber-700">
                      {entry.warning.max}
                    </td>
                    <td className="px-3 py-2 text-center text-red-700">
                      {entry.critical.min}
                    </td>
                    <td className="px-3 py-2 text-center text-red-700">
                      {entry.critical.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Clock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span>System Time</span>
          </CardTitle>
          <CardDescription>
            Current system time and synchronization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <div className="text-3xl font-mono font-bold text-gray-800">
              {currentTime.toISOString().split('T')[1].split('.')[0]} UTC
            </div>
            <div className="text-sm text-gray-600">
              {currentTime.toUTCString().split(' ').slice(0, 4).join(' ')}
            </div>
            <div className="text-xs text-gray-500">
              UTC Time • Synchronized with NTP
            </div>
            <div className="pt-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Time Synchronized
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
