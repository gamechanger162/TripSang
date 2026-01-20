export interface Review {
    _id: string;
    trip: {
        _id: string;
        title: string;
        startDate: string;
        endDate: string;
    };
    reviewer: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    reviewee: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    rating: number;
    comment?: string;
    categories?: {
        punctuality?: number;
        friendliness?: number;
        reliability?: number;
        communication?: number;
    };
    createdAt: string;
}

export interface PendingReview {
    trip: {
        _id: string;
        title: string;
        startDate: string;
        endDate: string;
    };
    traveler: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    averagePunctuality: number;
    averageFriendliness: number;
    averageReliability: number;
    averageCommunication: number;
}
