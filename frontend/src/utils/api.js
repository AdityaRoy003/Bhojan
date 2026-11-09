import axios from 'axios';

// Fast In-Memory Cache for Client-Side Zero-Latency SWR Experience
const clientCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds fresh window

// Base URL: uses relative '/api' so Vite proxy handles it locally without CORS preflight delay
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Helper to construct cache key from config
const getCacheKey = (config) => {
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    return `${config.method || 'get'}:${url}:${params}`;
};

// Direct synchronous cache accessor for instant initial useState values
export const getCachedData = (url, params = null) => {
    const paramsStr = params ? JSON.stringify(params) : '';
    const key = `get:${url}:${paramsStr}`;
    const cached = clientCache.get(key);
    if (cached) {
        // Return cached data if within 5 minutes grace period
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
            return cached.data;
        }
    }
    return null;
};

export const setCachedData = (url, data, params = null) => {
    const paramsStr = params ? JSON.stringify(params) : '';
    const key = `get:${url}:${paramsStr}`;
    clientCache.set(key, {
        data,
        headers: {},
        timestamp: Date.now()
    });
};

// Request Interceptor: return cached response immediately for GET requests if fresh
api.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();

    // Cache invalidation on mutations (POST, PUT, DELETE, PATCH)
    if (method !== 'get') {
        clientCache.clear();
        return config;
    }

    if (config.skipCache) {
        return config;
    }

    const key = getCacheKey(config);
    const cached = clientCache.get(key);

    if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_TTL_MS) {
            // Serve immediately from memory with adapter resolution (0ms latency!)
            config.adapter = () => {
                return Promise.resolve({
                    data: cached.data,
                    status: 200,
                    statusText: 'OK (Cache)',
                    headers: cached.headers || {},
                    config,
                    request: {}
                });
            };
        }
    }

    return config;
}, (error) => Promise.reject(error));

// Response Interceptor: store successful GET responses in cache & handle maintenance
api.interceptors.response.use(
    (response) => {
        const method = (response.config.method || 'get').toLowerCase();
        if (method === 'get' && !response.config.skipCache && response.status === 200) {
            const key = getCacheKey(response.config);
            clientCache.set(key, {
                data: response.data,
                headers: response.headers,
                timestamp: Date.now()
            });
        }
        return response;
    },
    (error) => {
        if (
            error.response?.status === 503 &&
            error.response?.data?.maintenance === true
        ) {
            // Dispatch lightweight event — App.jsx will re-check /api/status
            window.dispatchEvent(new CustomEvent('bhojan:maintenance-detected'));
        }
        return Promise.reject(error);
    }
);

// Method to manually clear or bust cache if needed
api.clearCache = () => clientCache.clear();
api.getCached = getCachedData;
api.setCached = setCachedData;

export default api;
