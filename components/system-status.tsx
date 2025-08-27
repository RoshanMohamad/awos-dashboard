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
} from "lucide-react";

interface SystemStatusProps {
  className?: string;
}

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
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-600">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="text-xs text-gray-500">
              Local Time (UTC+5:30) • Synchronized with NTP
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
