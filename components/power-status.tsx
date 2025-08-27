"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Battery, Zap, FileText } from "lucide-react"

interface PowerStatusProps {
  batteryLevel: number
  cebPower: boolean
  batteryPower: boolean
}

export function PowerStatus({ batteryLevel, cebPower, batteryPower }: PowerStatusProps) {
  return (
    <div className="space-y-6">
      {/* Power Sources */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg border">
          <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="font-semibold text-gray-800">CEB Power</div>
          <Badge variant={cebPower ? "default" : "destructive"} className="mt-2">
            {cebPower ? "ONLINE" : "OFFLINE"}
          </Badge>
        </div>

        <div className="text-center p-4 bg-blue-50 rounded-lg border">
          <Battery className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="font-semibold text-gray-800">Battery Power</div>
          <Badge variant={batteryPower ? "default" : "destructive"} className="mt-2">
            {batteryPower ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>
      </div>

      {/* Battery Level */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Battery Level</span>
          <span className="text-sm font-bold text-gray-800">{batteryLevel}%</span>
        </div>
        <Progress value={batteryLevel} className="h-3" />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Failover Status */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-800">System Status</div>
            <div className="text-sm text-gray-600">
              {cebPower ? "Primary power active" : "Running on battery backup"}
            </div>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </Button>
        </div>
      </div>
    </div>
  )
}
