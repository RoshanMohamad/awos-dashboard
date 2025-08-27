import { useApiCache } from '@/hooks/use-offline-storage';

class PWAApiClient {
    private baseUrl: string;

    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }

    async request(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Weather readings with caching
    async getReadings() {
        return this.request('/readings');
    }

    async getRealtimeData() {
        return this.request('/realtime');
    }

    async getAggregates(timeRange = '24h') {
        return this.request(`/aggregates?range=${timeRange}`);
    }
}

// Hook that combines API client with offline caching
export function usePWAApi(endpoint: string) {
    const { cacheResponse, getCachedData, isCacheValid, isOnline } = useApiCache(endpoint);

    const apiCall = async (options: RequestInit = {}) => {
        const client = new PWAApiClient();

        try {
            // Try to fetch fresh data if online
            if (isOnline) {
                const data = await client.request(endpoint, options);
                cacheResponse(data);
                return data;
            } else {
                // Offline: return cached data
                const cachedData = getCachedData();
                if (cachedData) {
                    return cachedData;
                } else {
                    throw new Error('No cached data available and offline');
                }
            }
        } catch (error) {
            // Fallback to cache on network error
            const cachedData = getCachedData();
            if (cachedData) {
                console.warn('Using cached data due to network error:', error);
                return cachedData;
            } else {
                throw error;
            }
        }
    };

    return {
        apiCall,
        getCachedData,
        isCacheValid,
        isOnline
    };
}

export { PWAApiClient };
