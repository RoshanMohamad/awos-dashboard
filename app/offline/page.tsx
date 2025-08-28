"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();

  const handleRefresh = () => {
    if ("serviceWorker" in navigator) {
      // Force refresh
      window.location.reload();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">You are Offline</CardTitle>
          <CardDescription>
            It looks like you have lost your internet connection. Some features
            may not be available right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Available offline:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Recently viewed weather data</li>
              <li>• Cached dashboard pages</li>
              <li>• System status information</li>
              <li>• User profile settings</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleRefresh}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Link href="/" className="block w-full">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            Your data will sync automatically when connection is restored.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
