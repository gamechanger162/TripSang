/**
 * TripSang API Client
 * Ready-to-use functions for calling backend APIs from Next.js frontend
 */

import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper to get token from localStorage (fallback for direct API usage)
const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// Save token to localStorage
const saveToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
    }
};

// Remove token from localStorage
const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
    }
};

// Helper to make authenticated requests
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    // Try to get token from NextAuth session first
    let token = null;

    if (typeof window !== 'undefined') {
        const session = await getSession();
        if (session?.user?.accessToken) {
            token = session.user.accessToken;
        } else {
            // Fallback to localStorage (for backward compatibility)
            token = getToken();
        }
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
};

// ========================================
// AUTHENTICATION APIs
// ========================================

export const authAPI = {
    /**
     * Register a new user
     * POST /api/auth/register
     */
    register: async (data: {
        name: string;
        email: string;
        password: string;
        mobileNumber?: string;
    }) => {
        const response = await fetchWithAuth('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Auto-save token
        if (response.token) {
            saveToken(response.token);
        }

        return response;
    },

    /**
     * Login user
     * POST /api/auth/login
     * Returns: { success, token, user: { role, ... } }
     */
    login: async (data: { email: string; password: string }) => {
        const response = await fetchWithAuth('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Save token to localStorage
        if (response.token) {
            saveToken(response.token);
        }

        return response;
    },

    /**
     * Verify mobile number
     * POST /api/auth/verify-mobile
     */
    verifyMobile: async (data: {
        mobileNumber: string;
        verificationCode: string
    }) => {
        return fetchWithAuth('/api/auth/verify-mobile', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get current logged-in user
     * GET /api/auth/me
     */
    getCurrentUser: async () => {
        return fetchWithAuth('/api/auth/me');
    },

    /**
     * Logout (remove token)
     */
    logout: () => {
        removeToken();
    },
};

// ========================================
// TRIP APIs
// ========================================

export const tripAPI = {
    /**
     * Create a new trip
     * POST /api/trips/create
     * Requires: Mobile verification
     */
    create: async (tripData: {
        title: string;
        description?: string;
        startPoint: { name: string; coordinates?: { latitude: number; longitude: number } };
        endPoint: { name: string; coordinates?: { latitude: number; longitude: number } };
        startDate: string;
        endDate: string;
        tags?: string[];
        coverPhoto?: string;
        maxSquadSize?: number;
        budget?: { min: number; max: number; currency?: string };
        difficulty?: 'easy' | 'moderate' | 'difficult' | 'extreme';
        isPublic?: boolean;
    }) => {
        return fetchWithAuth('/api/trips/create', {
            method: 'POST',
            body: JSON.stringify(tripData),
        });
    },

    /**
     * Search trips with filters
     * GET /api/trips/search
     */
    search: async (filters?: {
        startPoint?: string;
        endPoint?: string;
        tags?: string | string[];
        startDate?: string;
        endDate?: string;
        difficulty?: string;
        minBudget?: number;
        maxBudget?: number;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: 'startDate' | 'recent' | 'popular';
    }) => {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, v));
                    } else {
                        params.append(key, String(value));
                    }
                }
            });
        }

        return fetchWithAuth(`/api/trips/search?${params.toString()}`);
    },

    /**
     * Get trip by ID
     * GET /api/trips/:id
     */
    getById: async (id: string) => {
        return fetchWithAuth(`/api/trips/${id}`);
    },

    /**
     * Update trip
     * PUT /api/trips/:id
     */
    update: async (id: string, updates: any) => {
        return fetchWithAuth(`/api/trips/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Delete trip
     * DELETE /api/trips/:id
     */
    delete: async (id: string) => {
        return fetchWithAuth(`/api/trips/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Join a trip squad
     * POST /api/trips/:id/join
     */
    join: async (id: string) => {
        return fetchWithAuth(`/api/trips/${id}/join`, {
            method: 'POST',
        });
    },

    /**
     * Leave a trip squad
     * POST /api/trips/:id/leave
     */
    leave: async (id: string) => {
        return fetchWithAuth(`/api/trips/${id}/leave`, {
            method: 'POST',
        });
    },

    /**
     * Like/Unlike a trip
     * POST /api/trips/:id/like
     */
    like: async (id: string) => {
        return fetchWithAuth(`/api/trips/${id}/like`, {
            method: 'POST',
        });
    },
};

// ========================================
// ADMIN APIs (Admin Only)
// ========================================

export const adminAPI = {
    /**
     * Get global configuration
     * GET /api/admin/config
     */
    getConfig: async () => {
        return fetchWithAuth('/api/admin/config');
    },

    /**
     * Update global configuration
     * PUT /api/admin/config
     * Example: Turn Google Ads ON/OFF, change signup fee
     */
    updateConfig: async (updates: {
        enableGoogleAds?: boolean;
        googleAdSenseClient?: string;
        enablePaidSignup?: boolean;
        signupFee?: number;
        [key: string]: any;
    }) => {
        return fetchWithAuth('/api/admin/config', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Toggle a specific feature
     * PATCH /api/admin/config/toggle/:feature
     */
    toggleFeature: async (feature: string, value: boolean) => {
        return fetchWithAuth(`/api/admin/config/toggle/${feature}`, {
            method: 'PATCH',
            body: JSON.stringify({ value }),
        });
    },

    /**
     * Get all users with pagination
     * GET /api/admin/users
     */
    getUsers: async (filters?: {
        page?: number;
        limit?: number;
        role?: 'user' | 'admin' | 'guide';
        isActive?: boolean;
        isMobileVerified?: boolean;
        search?: string;
    }) => {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
        }

        return fetchWithAuth(`/api/admin/users?${params.toString()}`);
    },

    /**
     * Get user by ID
     * GET /api/admin/users/:id
     */
    getUserById: async (userId: string) => {
        return fetchWithAuth(`/api/admin/users/${userId}`);
    },

    /**
     * Block or unblock a user
     * PUT /api/admin/users/:id/block
     */
    blockUser: async (userId: string, block: boolean, reason?: string) => {
        return fetchWithAuth(`/api/admin/users/${userId}/block`, {
            method: 'PUT',
            body: JSON.stringify({ block, reason }),
        });
    },

    /**
     * Update user role
     * PUT /api/admin/users/:id/role
     */
    updateUserRole: async (userId: string, role: 'user' | 'admin' | 'guide') => {
        return fetchWithAuth(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        });
    },

    /**
     * Get platform statistics
     * GET /api/admin/stats
     */
    getStats: async () => {
        return fetchWithAuth('/api/admin/stats');
    },
};

// ========================================
// PAYMENT APIs
// ========================================

export const paymentAPI = {
    /**
     * Create Razorpay Order for Signup Fee
     * POST /api/payments/create-order
     */
    createSignupOrder: async () => {
        return fetchWithAuth('/api/payments/create-order', {
            method: 'POST',
        });
    },

    /**
     * Verify Razorpay Payment
     * POST /api/payments/verify-payment
     */
    verifyPayment: async (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) => {
        return fetchWithAuth('/api/payments/verify-payment', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get My Payments
     * GET /api/payments/my-payments
     */
    getMyPayments: async () => {
        return fetchWithAuth('/api/payments/my-payments');
    }
};

// Export all APIs
export default {
    authAPI,
    tripAPI,
    adminAPI,
    paymentAPI,
};
