// API response types

import { Trip, TrendingDestination } from './trip';
import { User } from './user';

// Base response type
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    error?: string;
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Auth responses
export interface LoginResponse extends ApiResponse {
    token: string;
    user: User;
}

export interface RegisterResponse extends ApiResponse {
    token: string;
    user: User;
}

export interface CurrentUserResponse extends ApiResponse {
    user: User;
}

// Trip responses
export interface TripResponse extends ApiResponse {
    trip: Trip;
}

export interface TripsResponse extends ApiResponse {
    trips: Trip[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TrendingDestinationsResponse extends ApiResponse {
    destinations: TrendingDestination[];
}

// Message responses
export interface UnreadCountResponse extends ApiResponse {
    unreadCount: number;
}

export interface NotificationCountResponse extends ApiResponse {
    count: number;
}

export interface FriendCountResponse extends ApiResponse {
    count: number;
}

// Notification types
export interface Notification {
    _id: string;
    type: 'trip' | 'friend' | 'message' | 'system' | 'payment';
    title?: string;
    message: string;
    link?: string;
    sender?: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    isRead: boolean;
    createdAt: string;
}

export interface NotificationsResponse extends ApiResponse {
    notifications: Notification[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
    };
}

// Payment types
export interface PaymentOrder {
    id: string;
    amount: number;
    currency: string;
    status: string;
}

export interface CreateOrderResponse extends ApiResponse {
    order: PaymentOrder;
}

export interface VerifyPaymentResponse extends ApiResponse {
    payment: {
        id: string;
        status: string;
        amount: number;
    };
}
