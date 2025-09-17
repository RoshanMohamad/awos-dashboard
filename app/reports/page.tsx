"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ExportUtils, type ExportData, type ReportMetadata } from "@/lib/exportUtils";

export default function ReportsPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [selectedRunway, setSelectedRunway] = useState<string>("02");
  const [reportType, setReportType] = useState<string>("daily");
  const [selectedFormat, setSelectedFormat] = useState<string>("csv");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (type: string) => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock data
      const mockData: ExportData[] = Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        temperature: 28 + Math.random() * 4,
        humidity: 70 + Math.random() * 20,
        pressure: 1010 + Math.random() * 10,
        windSpeed: 10 + Math.random() * 15,
        windDirection: Math.random() * 360,
      }));

      // Create metadata
      const metadata: ReportMetadata = {
        type,
        runway: selectedRunway,
        dateFrom: dateFrom?.toDateString(),
        dateTo: dateTo?.toDateString(),
        generated: new Date().toISOString(),
      };

      // Generate the export based on selected format
      const blob = ExportUtils.generateExport(mockData, metadata, selectedFormat);
      const fileExtension = ExportUtils.getFileExtension(selectedFormat);
      const filename = `AWOS_${type}_report_${selectedRunway}_${format(
        new Date(),
        "yyyy-MM-dd"
      )}${fileExtension}`;

      // Download the file
      ExportUtils.downloadFile(blob, filename);
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

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
                <FileText className="h-6 w-6 text-blue-600" />
                <span>Weather Reports</span>
              </h1>
              <p className="text-gray-600">
                Generate and export weather data reports
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Clock className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-purple-600" />
              <span>Report Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure your report parameters and date range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Runway</Label>
                <Select
                  value={selectedRunway}
                  onValueChange={setSelectedRunway}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select runway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="02">Runway 02 End</SelectItem>
                    <SelectItem value="04">Runway 04 End</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly Summary</SelectItem>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                    <SelectItem value="monthly">Monthly Summary</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? (
                        format(dateFrom, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? (
                        format(dateTo, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => generateReport("daily")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Daily Report</span>
              </CardTitle>
              <CardDescription>Last 24 hours summary</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                disabled={isGenerating}
                onClick={(e) => {
                  e.stopPropagation();
                  generateReport("daily");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => generateReport("weekly")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Weekly Report</span>
              </CardTitle>
              <CardDescription>Last 7 days analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                disabled={isGenerating}
                onClick={(e) => {
                  e.stopPropagation();
                  generateReport("weekly");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => generateReport("monthly")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
                <span>Monthly Report</span>
              </CardTitle>
              <CardDescription>Last 30 days overview</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                disabled={isGenerating}
                onClick={(e) => {
                  e.stopPropagation();
                  generateReport("monthly");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => generateReport("custom")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <span>Custom Report</span>
              </CardTitle>
              <CardDescription>Use configured parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                disabled={isGenerating || !dateFrom || !dateTo}
                onClick={(e) => {
                  e.stopPropagation();
                  generateReport("custom");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>
              Previously generated weather reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: "Daily Summary - Runway 02",
                  date: "2025-08-22",
                  size: "2.4 MB",
                  type: "CSV",
                },
                {
                  name: "Weekly Analysis - Runway 04",
                  date: "2025-08-21",
                  size: "15.8 MB",
                  type: "Excel",
                },
                {
                  name: "Monthly Overview - All Runways",
                  date: "2025-08-20",
                  size: "45.2 MB",
                  type: "PDF",
                },
                {
                  name: "Custom Range - Runway 02",
                  date: "2025-08-19",
                  size: "8.7 MB",
                  type: "JSON",
                },
              ].map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-gray-500">
                        Generated on {report.date} • {report.size}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{report.type}</Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Reports This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">47</div>
              <div className="text-sm text-gray-500">+12% from last month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Data Exported</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">1.2 GB</div>
              <div className="text-sm text-gray-500">Total this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">26.8 MB</div>
              <div className="text-sm text-gray-500">Per report</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
