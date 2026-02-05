// User-related types

export interface UserSubscription {
    planId?: string;
    subscriptionId?: string;
    status: 'inactive' | 'active' | 'cancelled' | 'expired';
    startDate?: string;
    endDate?: string;
    trialEndsAt?: string;
    isTrialUsed: boolean;
}

export interface UserSocialLink {
    platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'youtube' | 'other';
    url: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profilePicture?: string;
    coverPhoto?: string;
    bio?: string;
    location?: string;
    gender?: 'male' | 'female' | 'transgender' | 'prefer-not-to-say';
    dateOfBirth?: string;
    role: 'user' | 'admin' | 'guide';
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isIdVerified: boolean;
    idVerificationStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
    badges: string[];
    travelPreferences?: string[];
    languages?: string[];
    socialLinks?: UserSocialLink[];
    subscription: UserSubscription;
    stats?: {
        tripsCreated: number;
        tripsJoined: number;
        friends: number;
        reviews: number;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FriendRequest {
    _id: string;
    sender: User | string;
    receiver: User | string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export interface BlockedUser {
    userId: string;
    blockedAt: string;
}
