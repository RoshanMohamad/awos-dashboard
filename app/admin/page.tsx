"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Shield,
  Layout,
  FileText,
  Monitor,
  Settings,
  Info,
  Activity,
  BarChart3,
  Database,
  ExternalLink,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  const pages = [
    {
      title: "Main Dashboard",
      description: "Primary weather monitoring interface with live data",
      path: "/",
      icon: Layout,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      features: [
        "Real-time weather data",
        "Wind compass",
        "Pressure gauges",
        "System status",
      ],
    },
    {
      title: "Reports",
      description: "Generate and export weather data reports",
      path: "/reports",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      features: [
        "CSV/Excel export",
        "Historical analysis",
        "Custom date ranges",
        "Automated reports",
      ],
    },
    {
      title: "System Monitor",
      description: "Real-time system health and performance monitoring",
      path: "/system",
      icon: Monitor,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      features: [
        "Sensor status",
        "Connection monitoring",
        "Performance metrics",
        "Health checks",
      ],
    },
    {
      title: "Settings",
      description: "Configure system preferences and user settings",
      path: "/settings",
      icon: Settings,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      features: [
        "User preferences",
        "Notification settings",
        "System configuration",
        "Security options",
      ],
    },
    {
      title: "About",
      description: "System information and organization details",
      path: "/about",
      icon: Info,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      features: [
        "System overview",
        "Technical specs",
        "Organization info",
        "Contact details",
      ],
    },
  ];

  const components = [
    {
      name: "LiveDashboard",
      description:
        "Main weather monitoring interface with real-time data visualization",
      features: [
        "Wind compass",
        "Pressure gauge",
        "Temperature displays",
        "Alert system",
      ],
    },
    {
      name: "ForecastHistory",
      description: "Historical data analysis and forecasting tools",
      features: [
        "Trend charts",
        "Historical graphs",
        "Data export",
        "Forecast alerts",
      ],
    },
    {
      name: "SystemStatus",
      description: "Real-time system health monitoring component",
      features: [
        "Sensor status",
        "Connection health",
        "System metrics",
        "Time synchronization",
      ],
    },
    {
      name: "Dashboard Sidebar",
      description:
        "Navigation component with runway selection and page navigation",
      features: [
        "Runway switching",
        "Page navigation",
        "Collapsible sections",
        "User-friendly icons",
      ],
    },
    {
      name: "LoginPage",
      description: "Secure Google OAuth authentication interface",
      features: [
        "Google sign-in",
        "Session management",
        "Error handling",
        "Professional design",
      ],
    },
  ];

  // Admin page is public now; no auth checks

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
                <Shield className="h-6 w-6 text-red-600" />
                <span>System Administration</span>
              </h1>
              <p className="text-gray-600">
                Complete overview of all AWOS Dashboard components and pages
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <Shield className="h-3 w-3 mr-1" />
            Admin Access
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Available Pages */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Layout className="h-5 w-5 text-blue-600" />
            <span>Available Pages</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-full ${page.bgColor} flex items-center justify-center`}
                    >
                      <page.icon className={`h-5 w-5 ${page.color}`} />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(page.path)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {page.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Key Features:
                    </h4>
                    <ul className="space-y-1">
                      {page.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-600 flex items-center space-x-2"
                        >
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => router.push(page.path)}
                  >
                    Visit Page
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Available Components */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-600" />
            <span>Core Components</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {components.map((component, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span>{component.name}</span>
                  </CardTitle>
                  <CardDescription>{component.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Component Features:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {component.features.map((feature, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* System Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span>System Statistics</span>
            </CardTitle>
            <CardDescription>
              Overview of system components and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5</div>
                <div className="text-sm text-gray-600">Total Pages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">15+</div>
                <div className="text-sm text-gray-600">UI Components</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">2</div>
                <div className="text-sm text-gray-600">Runway Endpoints</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">100%</div>
                <div className="text-sm text-gray-600">Authentication</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generate Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Monitor className="h-6 w-6" />
                <span className="text-sm">System Check</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm">Configure System</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Database className="h-6 w-6" />
                <span className="text-sm">View Logs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
