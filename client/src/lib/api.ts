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
        gender?: string;
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

    /**
     * Remove a member from the squad
     * POST /api/trips/:id/remove-member
     */
    removeMember: async (id: string, userId: string) => {
        return fetchWithAuth(`/api/trips/${id}/remove-member`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    },

    /**
     * Get trip by unique code
     * GET /api/trips/code/:code
     */
    getByCode: async (code: string) => {
        return fetchWithAuth(`/api/trips/code/${code.toUpperCase()}`);
    },

    /**
     * Get trending destinations
     * GET /api/trips/trending
     */
    getTrendingDestinations: async () => {
        // No auth needed for this one, but fetchWithAuth handles it fine (and public endpoints ignore token if not needed)
        // Actually, let's use simple fetch if we want to avoid overhead/weirdness, BUT fetchWithAuth is standard wrapper here.
        // Given it's public, it should be fine.
        return fetchWithAuth('/api/trips/trending');
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

    /**
     * Get all trips (Admin)
     * GET /api/admin/trips
     */
    getTrips: async (page = 1, limit = 20, status?: string) => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));
        if (status) params.append('status', status);

        return fetchWithAuth(`/api/admin/trips?${params.toString()}`);
    },

    /**
     * Delete trip (Admin)
     * DELETE /api/admin/trips/:id
     */
    deleteTrip: async (tripId: string, reason?: string) => {
        return fetchWithAuth(`/api/admin/trips/${tripId}`, {
            method: 'DELETE',
            body: JSON.stringify({ reason })
        });
    },
};

// ========================================
// PAYMENT APIs
// ========================================

export const paymentAPI = {
    /**
     * Create Razorpay Subscription
     * POST /api/payments/create-subscription
     */
    createSubscription: async () => {
        return fetchWithAuth('/api/payments/create-subscription', {
            method: 'POST',
        });
    },

    /**
     * Verify Razorpay Subscription
     * POST /api/payments/verify-subscription
     */
    verifySubscription: async (data: {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
    }) => {
        return fetchWithAuth('/api/payments/verify-subscription', {
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

// ========================================
// REVIEW APIs
// ========================================

export const reviewAPI = {
    /**
     * Create a review
     * POST /api/reviews/create
     */
    create: async (data: {
        tripId: string;
        revieweeId: string;
        rating: number;
        comment?: string;
        categories?: {
            punctuality?: number;
            friendliness?: number;
            reliability?: number;
            communication?: number;
        };
    }) => {
        return fetchWithAuth('/api/reviews/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get reviews for a user
     * GET /api/reviews/user/:userId
     */
    getUserReviews: async (userId: string, page = 1, limit = 10) => {
        return fetch(`${API_URL}/api/reviews/user/${userId}?page=${page}&limit=${limit}`)
            .then(res => res.json());
    },

    /**
     * Get pending reviews (travelers to review)
     * GET /api/reviews/pending
     */
    getPending: async () => {
        return fetchWithAuth('/api/reviews/pending');
    },

    /**
     * Delete a review
     * DELETE /api/reviews/:id
     */
    delete: async (reviewId: string) => {
        return fetchWithAuth(`/api/reviews/${reviewId}`, {
            method: 'DELETE',
        });
    },
};

// =========================
// MEMORY API
// =========================
export const memoryAPI = {
    // Get all memories (Gallery Feed)
    getFeed: async (page = 1, limit = 20) => {
        return fetch(`${API_URL}/api/memories/feed?page=${page}&limit=${limit}`).then(res => res.json());
    },

    // Get trip memories
    getTripMemories: async (tripId: string) => {
        return fetch(`${API_URL}/api/trips/${tripId}/memories`).then(res => res.json());
    },

    // Create memory
    create: async (tripId: string, data: any) => {
        return fetchWithAuth(`/api/trips/${tripId}/memories`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Like memory
    toggleLike: async (memoryId: string) => {
        return fetchWithAuth(`/api/memories/${memoryId}/like`, { method: 'POST' });
    },

    // Add comment
    addComment: async (memoryId: string, text: string) => {
        return fetchWithAuth(`/api/memories/${memoryId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    },

    // Delete a memory
    deleteMemory: async (memoryId: string) => {
        return fetchWithAuth(`/api/memories/${memoryId}`, {
            method: 'DELETE'
        });
    }
};

// =========================
// MESSAGE API
// =========================
export const messageAPI = {
    // Get all conversations
    getConversations: async () => {
        return fetchWithAuth('/api/messages/conversations');
    },

    // Get or create conversation with a user
    getOrCreateConversation: async (userId: string) => {
        return fetchWithAuth(`/api/messages/conversation/${userId}`);
    },

    // Get message history for a conversation
    getMessageHistory: async (conversationId: string, page = 1, limit = 50) => {
        return fetchWithAuth(`/api/messages/${conversationId}/history?page=${page}&limit=${limit}`);
    },

    // Mark conversation as read
    markAsRead: async (conversationId: string) => {
        return fetchWithAuth('/api/messages/mark-read', {
            method: 'POST',
            body: JSON.stringify({ conversationId })
        });
    },

    // Get total unread count
    getUnreadCount: async () => {
        return fetchWithAuth('/api/messages/unread-count');
    },

    // Block a user
    blockUser: async (userId: string) => {
        return fetchWithAuth(`/api/messages/block/${userId}`, {
            method: 'POST'
        });
    },

    // Unblock a user
    unblockUser: async (userId: string) => {
        return fetchWithAuth(`/api/messages/unblock/${userId}`, {
            method: 'POST'
        });
    },

    // Get block status with a user
    getBlockStatus: async (userId: string) => {
        return fetchWithAuth(`/api/messages/block-status/${userId}`);
    },

    // Get list of blocked users
    getBlockedUsers: async () => {
        return fetchWithAuth('/api/messages/blocked-users');
    }
};

// ========================================
// USER APIs
// ========================================

export const userAPI = {
    /**
     * Get current user profile
     * GET /api/users/me
     */
    getProfile: async () => {
        return fetchWithAuth('/api/users/me');
    },

    /**
     * Get user profile by ID
     * GET /api/users/:id
     */
    getUserById: async (id: string) => {
        return fetch(`${API_URL}/api/users/${id}`)
            .then(res => res.json());
    },

    /**
     * Update user profile
     * PUT /api/users/profile
     */
    updateProfile: async (data: any) => {
        return fetchWithAuth('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get user's trips
     * GET /api/users/trips
     */
    getTrips: async () => {
        return fetchWithAuth('/api/users/trips');
    }
};

// Upload API
export const uploadAPI = {
    // Old base64 upload (deprecated/compat)
    uploadImage: (base64Image: string, folder?: string) =>
        fetchWithAuth('/api/upload/image', {
            method: 'POST',
            body: JSON.stringify({ image: base64Image, folder }),
        }),

    // New File upload handling
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        // We use fetch directly here because fetchWithAuth sets Content-Type to application/json
        // which breaks FormData (browser needs to set boundary)
        const token = getToken();
        // Or get from session if needed, but getToken covers basic auth
        let headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            // Try to get from session if client-side
            if (typeof window !== 'undefined') {
                const session = await getSession();
                if (session?.user?.accessToken) {
                    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
                }
            }
        }

        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }

        return data;
    }
};

// Notification API
export const notificationAPI = {
    // Get all notifications
    getAll: async (page = 1, limit = 20) => {
        return fetchWithAuth(`/api/notifications?page=${page}&limit=${limit}`);
    },

    // Get unread count
    getUnreadCount: async () => {
        return fetchWithAuth('/api/notifications/unread-count');
    },

    // Mark as read
    markRead: async (id: string) => {
        return fetchWithAuth(`/api/notifications/${id}/read`, {
            method: 'PUT'
        });
    },

    // Mark all as read
    markAllRead: async () => {
        return fetchWithAuth('/api/notifications/read-all', {
            method: 'PUT'
        });
    },

    // Delete notification
    delete: async (id: string) => {
        return fetchWithAuth(`/api/notifications/${id}`, {
            method: 'DELETE'
        });
    }
};

// ========================================
// FRIEND APIs
// ========================================

export const friendAPI = {
    /**
     * Get all friends
     * GET /api/friends
     */
    getFriends: async () => {
        return fetchWithAuth('/api/friends');
    },

    /**
     * Get pending friend requests (received)
     * GET /api/friends/requests/pending
     */
    getPendingRequests: async () => {
        return fetchWithAuth('/api/friends/requests/pending');
    },

    /**
     * Get sent friend requests
     * GET /api/friends/requests/sent
     */
    getSentRequests: async () => {
        return fetchWithAuth('/api/friends/requests/sent');
    },

    /**
     * Get pending requests count
     * GET /api/friends/requests/count
     */
    getPendingRequestsCount: async () => {
        return fetchWithAuth('/api/friends/requests/count');
    },

    /**
     * Get friendship status with a user
     * GET /api/friends/status/:userId
     */
    getStatus: async (userId: string) => {
        return fetchWithAuth(`/api/friends/status/${userId}`);
    },

    /**
     * Get friends count for a user
     * GET /api/friends/count/:userId
     */
    getFriendsCount: async (userId: string) => {
        return fetch(`${API_URL}/api/friends/count/${userId}`)
            .then(res => res.json());
    },

    /**
     * Send a friend request
     * POST /api/friends/request/:userId
     */
    sendRequest: async (userId: string) => {
        return fetchWithAuth(`/api/friends/request/${userId}`, {
            method: 'POST'
        });
    },

    /**
     * Accept a friend request
     * POST /api/friends/accept/:userId
     */
    acceptRequest: async (userId: string) => {
        return fetchWithAuth(`/api/friends/accept/${userId}`, {
            method: 'POST'
        });
    },

    /**
     * Decline a friend request
     * POST /api/friends/decline/:userId
     */
    declineRequest: async (userId: string) => {
        return fetchWithAuth(`/api/friends/decline/${userId}`, {
            method: 'POST'
        });
    },

    /**
     * Cancel a sent friend request
     * DELETE /api/friends/cancel/:userId
     */
    cancelRequest: async (userId: string) => {
        return fetchWithAuth(`/api/friends/cancel/${userId}`, {
            method: 'DELETE'
        });
    },

    /**
     * Unfriend a user
     * DELETE /api/friends/:userId
     */
    unfriend: async (userId: string) => {
        return fetchWithAuth(`/api/friends/${userId}`, {
            method: 'DELETE'
        });
    }
};

// Export all APIs
export default {
    authAPI,
    tripAPI,
    adminAPI,
    paymentAPI,
    reviewAPI,
    messageAPI,
    uploadAPI,
    userAPI,
    notificationAPI,
    friendAPI,
    memoryAPI
};
