"use client";

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
  Plane,
  Cloud,
  Wifi,
  Database,
  Shield,
  Users,
  MapPin,
  Clock,
  Thermometer,
  Wind,
  Gauge,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Plane className="h-6 w-6 text-blue-600" />
                <span>About AWOS Dashboard</span>
              </h1>
              <p className="text-gray-600">
                Automatic Weather Observation System Information
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Clock className="h-3 w-3 mr-1" />
            Version 1.0.0
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-blue-600" />
              <span>System Overview</span>
            </CardTitle>
            <CardDescription>
              Comprehensive weather monitoring for aviation safety
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">What is AWOS?</h3>
                <p className="text-gray-600 mb-4">
                  The Automatic Weather Observation System (AWOS) is a fully
                  automated system that provides continuous, real-time weather
                  observations essential for aviation operations at Colombo
                  International Airport.
                </p>
                <p className="text-gray-600">
                  This dashboard provides authorized personnel with instant
                  access to critical weather data, historical trends, and
                  forecasting information to ensure safe flight operations.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Key Features
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Real-time weather monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Multi-runway observation points</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Historical data analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Advanced forecasting</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>Automated reporting</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Location & Coverage</span>
            </CardTitle>
            <CardDescription>
              Monitoring points and geographical coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plane className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold">Colombo International Airport</h4>
                <p className="text-sm text-gray-600 mt-1">
                  ICAO: VCBI | IATA: CMB
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Primary observation station serving all international and
                  domestic flights
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wind className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold">Runway 02 End</h4>
                <p className="text-sm text-gray-600 mt-1">Primary Monitor</p>
                <p className="text-xs text-gray-500 mt-2">
                  Main weather observation point for approach and departure
                  operations
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gauge className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold">Runway 04 End</h4>
                <p className="text-sm text-gray-600 mt-1">Secondary Monitor</p>
                <p className="text-xs text-gray-500 mt-2">
                  Additional observation point for crosswind and backup
                  monitoring
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Thermometer className="h-5 w-5 text-orange-600" />
                <span>Monitored Parameters</span>
              </CardTitle>
              <CardDescription>
                Weather elements tracked by the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Wind className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Wind Speed & Direction</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Temperature</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Barometric Pressure</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Cloud className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Humidity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Cloud className="h-4 w-4 text-teal-600" />
                    <span className="text-sm">Dew Point</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span className="text-sm">System Health</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="h-5 w-5 text-green-600" />
                <span>System Architecture</span>
              </CardTitle>
              <CardDescription>Technology stack and components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hardware Platform</span>
                  <Badge variant="outline">ESP32</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Frontend Framework
                  </span>
                  <Badge variant="outline">Next.js 15</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Authentication</span>
                  <Badge variant="outline">NextAuth.js</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">UI Components</span>
                  <Badge variant="outline">shadcn/ui</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Styling</span>
                  <Badge variant="outline">Tailwind CSS</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Data Visualization
                  </span>
                  <Badge variant="outline">Recharts</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Organization</span>
            </CardTitle>
            <CardDescription>
              About Airport & Aviation Services (Sri Lanka) Private Limited
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">
                  AASL - Leading Aviation Services
                </h4>
                <p className="text-gray-600 mb-4">
                  Airport & Aviation Services (Sri Lanka) Private Limited (AASL)
                  is the premier provider of aviation services in Sri Lanka,
                  responsible for managing and operating the country main
                  international gateway.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Mission</div>
                      <div className="text-sm text-gray-600">
                        Provide world-class aviation services ensuring safety,
                        efficiency, and passenger satisfaction
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Vision</div>
                      <div className="text-sm text-gray-600">
                        To be the leading airport operator in South Asia
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Address:</span>
                    <br />
                    <span className="text-gray-600">
                      Bandaranaike International Airport
                      <br />
                      Katunayake 11410, Sri Lanka
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Airport Code:</span>
                    <span className="text-gray-600 ml-2">
                      VCBI (ICAO) | CMB (IATA)
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Time Zone:</span>
                    <span className="text-gray-600 ml-2">UTC +5:30 (IST)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Security & Privacy</span>
            </CardTitle>
            <CardDescription>
              Data protection and system security measures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-sm">Secure Authentication</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Google OAuth 2.0 with encrypted sessions and secure token
                  management
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-sm">Data Protection</h4>
                <p className="text-xs text-gray-600 mt-1">
                  All data transmissions encrypted and stored securely with
                  regular backups
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-sm">Access Control</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Role-based access control ensuring only authorized personnel
                  can access data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
