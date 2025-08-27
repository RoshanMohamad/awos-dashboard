"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Bell,
  Monitor,
  Wifi,
  Database,
  Shield,
  ArrowLeft,
  Save,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      soundAlerts: false,
      criticalOnly: true,
    },
    display: {
      autoRefresh: true,
      refreshInterval: 30,
      darkMode: false,
      compactView: false,
    },
    system: {
      esp32Endpoint: "http://192.168.1.100",
      apiTimeout: 5000,
      retryAttempts: 3,
      logLevel: "INFO",
    },
  });

  useEffect(() => {
    // public settings page
  }, [router]);

  const handleSaveSettings = () => {
    localStorage.setItem("awos_settings", JSON.stringify(settings));
    // Here you could also send to backend
    alert("Settings saved successfully!");
  };

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      localStorage.removeItem("awos_settings");
      window.location.reload();
    }
  };

  // settings page is public

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Settings className="h-6 w-6 text-blue-600" />
                <span>AWOS Settings</span>
              </h1>
              <p className="text-gray-600">
                Configure system preferences and monitoring options
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={handleResetSettings} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSaveSettings} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>User Information</span>
            </CardTitle>
            <CardDescription>
              Your current authentication and access details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {/* user info no longer requires session */}
                  {"Not provided"}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {"Not provided"}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Access Level</Label>
              <div className="mt-1">
                <Badge variant="default" className="bg-green-600">
                  Administrator
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-amber-600" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>
              Configure how you receive alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email Alerts</Label>
                <div className="text-sm text-gray-500">
                  Receive weather alerts via email
                </div>
              </div>
              <Switch
                checked={settings.notifications.emailAlerts}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      emailAlerts: checked,
                    },
                  }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Sound Alerts</Label>
                <div className="text-sm text-gray-500">
                  Play audio notifications for critical alerts
                </div>
              </div>
              <Switch
                checked={settings.notifications.soundAlerts}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      soundAlerts: checked,
                    },
                  }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Critical Alerts Only</Label>
                <div className="text-sm text-gray-500">
                  Only receive notifications for critical weather conditions
                </div>
              </div>
              <Switch
                checked={settings.notifications.criticalOnly}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      criticalOnly: checked,
                    },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <span>Display Settings</span>
            </CardTitle>
            <CardDescription>
              Customize the dashboard appearance and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto Refresh</Label>
                <div className="text-sm text-gray-500">
                  Automatically refresh data at regular intervals
                </div>
              </div>
              <Switch
                checked={settings.display.autoRefresh}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    display: { ...prev.display, autoRefresh: checked },
                  }))
                }
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-base">Refresh Interval (seconds)</Label>
              <Input
                type="number"
                min="10"
                max="300"
                value={settings.display.refreshInterval}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    display: {
                      ...prev.display,
                      refreshInterval: parseInt(e.target.value) || 30,
                    },
                  }))
                }
                className="max-w-xs"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <div className="text-sm text-gray-500">
                  Switch to dark theme for better visibility in low light
                </div>
              </div>
              <Switch
                checked={settings.display.darkMode}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    display: { ...prev.display, darkMode: checked },
                  }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Compact View</Label>
                <div className="text-sm text-gray-500">
                  Show more data in less space
                </div>
              </div>
              <Switch
                checked={settings.display.compactView}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    display: { ...prev.display, compactView: checked },
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span>System Configuration</span>
            </CardTitle>
            <CardDescription>
              ESP32 connection and system parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">ESP32 Endpoint URL</Label>
              <Input
                type="url"
                value={settings.system.esp32Endpoint}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    system: { ...prev.system, esp32Endpoint: e.target.value },
                  }))
                }
                placeholder="http://192.168.1.100"
              />
              <div className="text-sm text-gray-500">
                IP address or hostname of your ESP32 weather station
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base">API Timeout (ms)</Label>
                <Input
                  type="number"
                  min="1000"
                  max="30000"
                  value={settings.system.apiTimeout}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      system: {
                        ...prev.system,
                        apiTimeout: parseInt(e.target.value) || 5000,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Retry Attempts</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.system.retryAttempts}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      system: {
                        ...prev.system,
                        retryAttempts: parseInt(e.target.value) || 3,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-green-600" />
              <span>Connection Status</span>
            </CardTitle>
            <CardDescription>
              Current system connectivity and health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ESP32 Connection</span>
                  <Badge variant="default" className="bg-green-600">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant="default" className="bg-green-600">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authentication</span>
                  <Badge variant="default" className="bg-green-600">
                    Active
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Update</span>
                  <span className="text-sm text-gray-500">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Points Today</span>
                  <span className="text-sm text-gray-500">2,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Uptime</span>
                  <span className="text-sm text-gray-500">24d 7h 32m</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
