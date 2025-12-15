"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, Wifi, AlertTriangle } from "lucide-react";

export function RealTimeDebugPanel() {
  const { supabase } = useAuth();
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [stationIds, setStationIds] = useState<string[]>([]);
  const [recentData, setRecentData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const checkDatabase = async () => {
    if (!supabase) {
      setDbStatus('error');
      return;
    }

    try {
      setDbStatus('checking');

      // Check if table exists and get recent data
      const { data: allData, error: allError } = await supabase
        .from('sensor_readings')
        .select('station_id, timestamp, temperature, humidity, pressure, wind_speed, wind_direction')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (allError) {
        console.error('Database error:', allError);
        setDbStatus('error');
        return;
      }

      setDbStatus('connected');
      setRecentData(allData || []);
      
      // Get unique station IDs
      const uniqueStations = [...new Set((allData || []).map((d: any) => d.station_id))];
      setStationIds(uniqueStations);

      // Get total count
      const { count } = await supabase
        .from('sensor_readings')
        .select('id', { count: 'exact', head: true });

      setTotalRecords(count || 0);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Unexpected error:', error);
      setDbStatus('error');
    }
  };

  const sendTestData = async () => {
    try {
      const testData = {
        stationId: "VCBI-ESP32",
        temperature: 25 + Math.random() * 5,
        humidity: 70 + Math.random() * 20,
        pressure: 1010 + Math.random() * 10,
        dewPoint: 20 + Math.random() * 5,
        windSpeed: Math.random() * 15,
        windDirection: Math.floor(Math.random() * 360),
        lat: 9.8580,
        lng: 80.0340,
        utcTime: new Date().toISOString().substr(11, 8)
      };

      const response = await fetch('/api/esp32', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        console.log('✅ Test data sent successfully');
        // Refresh data after sending
        setTimeout(checkDatabase, 1000);
      } else {
        console.error('❌ Failed to send test data');
      }
    } catch (error) {
      console.error('❌ Error sending test data:', error);
    }
  };

  useEffect(() => {
    checkDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Real-Time Dashboard Debug Panel</span>
            <Badge variant={dbStatus === 'connected' ? 'default' : dbStatus === 'error' ? 'destructive' : 'secondary'}>
              {dbStatus === 'connected' ? 'Connected' : dbStatus === 'error' ? 'Error' : 'Checking'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={checkDatabase} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={sendTestData} size="sm" variant="outline">
              <Wifi className="h-4 w-4 mr-2" />
              Send Test Data
            </Button>
          </div>

          {dbStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">Database Connection Error</span>
              </div>
              <p className="text-red-700 mt-1 text-sm">
                Check if Supabase environment variables are configured correctly.
              </p>
            </div>
          )}

          {dbStatus === 'connected' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
                  <div className="text-sm text-blue-800">Total Records</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stationIds.length}</div>
                  <div className="text-sm text-green-800">Station IDs</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{recentData.length}</div>
                  <div className="text-sm text-purple-800">Recent Entries</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Available Station IDs:</h4>
                <div className="flex flex-wrap gap-2">
                  {stationIds.map(id => (
                    <Badge key={id} variant="outline">{id}</Badge>
                  ))}
                  {stationIds.length === 0 && <span className="text-gray-500">No station IDs found</span>}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recent Data ({recentData.length} entries):</h4>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {recentData.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left">Station ID</th>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-left">Temp</th>
                          <th className="p-2 text-left">Humidity</th>
                          <th className="p-2 text-left">Pressure</th>
                          <th className="p-2 text-left">Wind</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentData.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 font-medium">{row.station_id}</td>
                            <td className="p-2">{new Date(row.timestamp).toISOString().split('T')[1].substring(0, 8)} UTC</td>
                            <td className="p-2">{row.temperature}°C</td>
                            <td className="p-2">{row.humidity}%</td>
                            <td className="p-2">{row.pressure} hPa</td>
                            <td className="p-2">{row.wind_speed}m/s @{row.wind_direction}°</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No data found in database</div>
                  )}
                </div>
              </div>

              {lastRefresh && (
                <div className="text-xs text-gray-500">
                  Last refreshed: {lastRefresh.toISOString().split('T')[1].substring(0, 8)} UTC
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}