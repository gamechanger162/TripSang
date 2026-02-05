// Trip-related types

export interface TripCreator {
    _id: string;
    name: string;
    profilePicture?: string;
    badges?: string[];
    gender?: 'male' | 'female' | 'transgender' | 'prefer-not-to-say';
    isIdVerified?: boolean;
    subscription?: {
        status: 'active' | 'inactive' | 'cancelled';
    };
}

export interface TripLocation {
    name: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface TripBudget {
    min: number;
    max: number;
    currency: string;
}

export interface TripStats {
    likes: number;
    views: number;
    shares?: number;
}

export interface TripWaypoint {
    lat: number;
    lng: number;
    name?: string;
    timestamp?: Date;
}

export interface SquadMember {
    user: string | TripCreator;
    status: 'pending' | 'approved' | 'rejected';
    role: 'member' | 'co-leader';
    joinedAt: Date;
}

export interface Trip {
    _id: string;
    tripCode: string;
    title: string;
    description?: string;
    startPoint: TripLocation;
    endPoint: TripLocation;
    startDate: string;
    endDate: string;
    tags: string[];
    coverPhoto?: string;
    creator: TripCreator;
    currentSquadSize: number;
    maxSquadSize: number;
    stats: TripStats;
    difficulty?: 'easy' | 'moderate' | 'difficult' | 'extreme';
    budget?: TripBudget;
    status: 'draft' | 'open' | 'full' | 'completed' | 'cancelled';
    isPublic: boolean;
    waypoints?: TripWaypoint[];
    squad?: SquadMember[];
    createdAt: string;
    updatedAt: string;
}

export interface TripSearchParams {
    startPoint?: string;
    endPoint?: string;
    startDate?: string;
    endDate?: string;
    minBudget?: number;
    maxBudget?: number;
    difficulty?: string;
    tags?: string[];
    page?: number;
    limit?: number;
}

export interface TrendingDestination {
    name: string;
    image?: string;
    img?: string;
    category?: string;
    description?: string;
    tripCount?: number;
}
