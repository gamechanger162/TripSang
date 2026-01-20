import Review from '../models/Review.js';
import { Trip } from '../models/index.js';

/**
 * Create a review for a fellow traveler
 * POST /api/reviews/create
 */
export const createReview = async (req, res) => {
    try {
        const { tripId, revieweeId, rating, comment, categories } = req.body;
        const reviewerId = req.user._id;

        // Validation
        if (!tripId || !revieweeId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Trip ID, reviewee ID, and rating are required'
            });
        }

        // Check if reviewer is trying to review themselves
        if (reviewerId.toString() === revieweeId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot review yourself'
            });
        }

        // Check if trip exists and is completed
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        const isTripCompleted = trip.status === 'completed' || new Date(trip.endDate) < new Date();

        if (!isTripCompleted) {
            return res.status(400).json({
                success: false,
                message: 'You can only review travelers after the trip is completed'
            });
        }

        // Auto-update status if needed
        if (trip.status !== 'completed' && new Date(trip.endDate) < new Date()) {
            trip.status = 'completed';
            await trip.save();
        }

        // Check if both users were part of the trip
        const reviewerInTrip = trip.squadMembers.includes(reviewerId);
        const revieweeInTrip = trip.squadMembers.includes(revieweeId);

        if (!reviewerInTrip || !revieweeInTrip) {
            return res.status(403).json({
                success: false,
                message: 'Both users must have been part of the trip'
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            trip: tripId,
            reviewer: reviewerId,
            reviewee: revieweeId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this traveler for this trip'
            });
        }

        // Create review
        const review = await Review.create({
            trip: tripId,
            reviewer: reviewerId,
            reviewee: revieweeId,
            rating,
            comment,
            categories
        });

        await review.populate('reviewer', 'name profilePicture');
        await review.populate('reviewee', 'name profilePicture');
        await review.populate('trip', 'title startDate endDate');

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
        });
    } catch (error) {
        console.error('Create review error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this traveler for this trip'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create review',
            error: error.message
        });
    }
};

/**
 * Get reviews for a specific user
 * GET /api/reviews/user/:userId
 */
export const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find({ reviewee: userId })
            .populate('reviewer', 'name profilePicture badges')
            .populate('trip', 'title startDate endDate')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ reviewee: userId });

        // Get average ratings
        const stats = await Review.getAverageRating(userId);

        res.status(200).json({
            success: true,
            reviews,
            stats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalReviews: total,
                reviewsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
};

/**
 * Get pending reviews for current user (travelers they haven't reviewed yet)
 * GET /api/reviews/pending
 */
export const getPendingReviews = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find completed trips user was part of (either status='completed' or endDate passed)
        const completedTrips = await Trip.find({
            squadMembers: userId,
            $or: [
                { status: 'completed' },
                { status: 'active', endDate: { $lt: new Date() } }
            ]
        }).populate('squadMembers', 'name profilePicture');

        // For each trip, find squad members not yet reviewed
        const pendingReviews = [];

        for (const trip of completedTrips) {
            const squadMembers = trip.squadMembers.filter(
                member => member._id.toString() !== userId.toString()
            );

            for (const member of squadMembers) {
                const existingReview = await Review.findOne({
                    trip: trip._id,
                    reviewer: userId,
                    reviewee: member._id
                });

                if (!existingReview) {
                    pendingReviews.push({
                        trip: {
                            _id: trip._id,
                            title: trip.title,
                            startDate: trip.startDate,
                            endDate: trip.endDate
                        },
                        traveler: {
                            _id: member._id,
                            name: member.name,
                            profilePicture: member.profilePicture
                        }
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            pendingReviews,
            count: pendingReviews.length
        });
    } catch (error) {
        console.error('Get pending reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending reviews',
            error: error.message
        });
    }
};

/**
 * Delete a review (only by reviewer or admin)
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user is the reviewer or admin
        if (review.reviewer.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews'
            });
        }

        await Review.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
};
