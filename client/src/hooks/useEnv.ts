/**
 * Environment Variables Hook
 * Safely access Next.js environment variables with TypeScript support
 */

interface EnvVariables {
    apiUrl: string;
    socketUrl: string;
    isProduction: boolean;
    isDevelopment: boolean;
}

export const useEnv = (): EnvVariables => {
    // API Base URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Socket URL (defaults to API URL if not set)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || apiUrl;

    // Environment flags
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
        apiUrl,
        socketUrl,
        isProduction,
        isDevelopment,
    };
};

/**
 * Get API URL (can be used outside React components)
 */
export const getApiUrl = (): string => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

/**
 * Get Socket URL (can be used outside React components)
 */
export const getSocketUrl = (): string => {
    return process.env.NEXT_PUBLIC_SOCKET_URL || getApiUrl();
};

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
    return process.env.NODE_ENV === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
    return process.env.NODE_ENV === 'development';
};
