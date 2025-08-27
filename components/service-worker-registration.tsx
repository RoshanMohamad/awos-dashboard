"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/sw.js",
            {
              scope: "/",
            }
          );

          console.log("ServiceWorker registered successfully:", registration);

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available
                  if (
                    confirm(
                      "A new version is available. Would you like to update?"
                    )
                  ) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.log("ServiceWorker registration failed:", error);
        }
      };

      registerSW();
    }
  }, []);

  return null;
}
