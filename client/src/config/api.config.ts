// src/config/api.config.ts

// Function to determine which API URL to use
const getApiUrl = () => {
    const { hostname } = window.location;

    // If accessing via localhost, use local API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:3000/api';
    }

    // If accessing via network IP, use network API
    return import.meta.env.VITE_API_URL_NETWORK || 'http://192.168.254.20:3000/api';
};

export const API_CONFIG = {
    BASE_URL: getApiUrl(),
};

// Log for debugging
console.log('Current hostname:', window.location.hostname);
console.log('Using API URL:', API_CONFIG.BASE_URL);