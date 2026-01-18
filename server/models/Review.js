import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: [true, 'Trip reference is required'],
        index: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reviewer is required'],
        index: true
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reviewee is required'],
        index: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    comment: {
        type: String,
        maxlength: [500, 'Comment cannot exceed 500 characters'],
        trim: true
    },
    categories: {
        punctuality: {
            type: Number,
            min: 1,
            max: 5
        },
        friendliness: {
            type: Number,
            min: 1,
            max: 5
        },
        reliability: {
            type: Number,
            min: 1,
            max: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5
        }
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate reviews
reviewSchema.index({ trip: 1, reviewer: 1, reviewee: 1 }, { unique: true });

// Index for finding user's reviews
reviewSchema.index({ reviewee: 1, createdAt: -1 });

// Method to calculate average rating for a user
reviewSchema.statics.getAverageRating = async function (userId) {
    const result = await this.aggregate([
        { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                averagePunctuality: { $avg: '$categories.punctuality' },
                averageFriendliness: { $avg: '$categories.friendliness' },
                averageReliability: { $avg: '$categories.reliability' },
                averageCommunication: { $avg: '$categories.communication' }
            }
        }
    ]);

    return result.length > 0 ? result[0] : {
        averageRating: 0,
        totalReviews: 0,
        averagePunctuality: 0,
        averageFriendliness: 0,
        averageReliability: 0,
        averageCommunication: 0
    };
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
