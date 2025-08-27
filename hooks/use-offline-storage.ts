'use client';

import { useState, useEffect } from 'react';

interface OfflineStorageOptions {
    key: string;
    defaultValue?: any;
    syncOnOnline?: boolean;
}

export function useOfflineStorage({ key, defaultValue, syncOnOnline = false }: OfflineStorageOptions) {
    const [data, setData] = useState(defaultValue);
    const [isOnline, setIsOnline] = useState(true);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // Initialize data from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                setData(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error reading from localStorage:', error);
        }
    }, [key]);

    // Monitor online status
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        setIsOnline(navigator.onLine);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Store data and optionally sync when online
    const store = (newData: any) => {
        try {
            setData(newData);
            localStorage.setItem(key, JSON.stringify(newData));

            if (isOnline && syncOnOnline) {
                // Trigger sync when online (you can customize this)
                setLastSynced(new Date());
            }
        } catch (error) {
            console.error('Error storing data:', error);
        }
    };

    // Clear stored data
    const clear = () => {
        try {
            setData(defaultValue);
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    };

    // Get storage usage info
    const getStorageInfo = () => {
        if (typeof window === 'undefined') return null;

        try {
            const used = new Blob(Object.values(localStorage)).size;
            const available = 5 * 1024 * 1024; // Approximate 5MB limit

            return {
                used,
                available,
                percentage: (used / available) * 100
            };
        } catch (error) {
            return null;
        }
    };

    return {
        data,
        store,
        clear,
        isOnline,
        lastSynced,
        getStorageInfo
    };
}

// Hook for caching API responses
export function useApiCache(endpoint: string) {
    const cacheKey = `api_cache_${endpoint}`;
    const { data, store, isOnline } = useOfflineStorage({
        key: cacheKey,
        defaultValue: null
    });

    const cacheResponse = (response: any) => {
        const cachedData = {
            data: response,
            timestamp: new Date().toISOString(),
            endpoint
        };
        store(cachedData);
    };

    const getCachedData = () => {
        if (!data) return null;

        // Check if cache is still valid (e.g., less than 1 hour old)
        const cacheAge = new Date().getTime() - new Date(data.timestamp).getTime();
        const maxAge = 60 * 60 * 1000; // 1 hour

        if (cacheAge > maxAge && isOnline) {
            return null; // Cache expired and we're online
        }

        return data.data;
    };

    const isCacheValid = () => {
        if (!data) return false;

        const cacheAge = new Date().getTime() - new Date(data.timestamp).getTime();
        const maxAge = 60 * 60 * 1000; // 1 hour

        return cacheAge <= maxAge;
    };

    return {
        cacheResponse,
        getCachedData,
        isCacheValid,
        isOnline,
        cachedAt: data?.timestamp
    };
}
