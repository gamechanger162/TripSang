import { Trip, User } from '../models/index.js';

/**
 * Create a new trip
 * POST /api/trips/create
 */
export const createTrip = async (req, res) => {
    try {
        const userId = req.user._id;

        const {
            title,
            description,
            startPoint,
            endPoint,
            startDate,
            endDate,
            tags,
            coverPhoto,
            maxSquadSize,
            budget,
            difficulty,
            isPublic,
            inviteFriends // Array of friend user IDs to add to squad
        } = req.body;

        // Validation
        if (!title || !startPoint || !endPoint || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Title, start point, end point, start date, and end date are required.'
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after or equal to start date.'
            });
        }

        // Validate tags format (must start with #)
        if (tags && tags.length > 0) {
            const invalidTags = tags.filter(tag => !tag.startsWith('#'));
            if (invalidTags.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid tags: ${invalidTags.join(', ')}. All tags must start with #`
                });
            }
        }

        // Build squad members list: creator + invited friends
        const squadMembers = [userId];

        if (inviteFriends && Array.isArray(inviteFriends) && inviteFriends.length > 0) {
            // Verify all invited users exist and are friends
            const user = await User.findById(userId);
            const validFriendIds = inviteFriends.filter(friendId => {
                // Check if friendId is in user's friends list
                return user.friends && user.friends.some(f => f.toString() === friendId.toString());
            });

            // Add valid friends to squad (avoid duplicates)
            validFriendIds.forEach(friendId => {
                if (!squadMembers.some(id => id.toString() === friendId.toString())) {
                    squadMembers.push(friendId);
                }
            });
        }

        // Check if squad size exceeds max
        const effectiveMaxSize = maxSquadSize || 10;
        if (squadMembers.length > effectiveMaxSize) {
            return res.status(400).json({
                success: false,
                message: `Cannot add ${squadMembers.length - 1} friends. Max squad size is ${effectiveMaxSize}.`
            });
        }

        // Create trip
        const trip = await Trip.create({
            creator: userId,
            title,
            description,
            startPoint,
            endPoint,
            startDate: start,
            endDate: end,
            tags: tags || [],
            coverPhoto,
            maxSquadSize: effectiveMaxSize,
            budget,
            difficulty,
            isPublic: isPublic !== undefined ? isPublic : true,
            squadMembers // Creator + invited friends
        });

        // Populate creator and squad member details
        await trip.populate('creator', 'name email profilePicture');
        await trip.populate('squadMembers', 'name profilePicture');

        // Award badge for first trip
        const userTripCount = await Trip.countDocuments({ creator: userId });
        if (userTripCount === 1) {
            await req.user.addBadge('Explorer');
        }

        // Return how many friends were added
        const friendsAdded = squadMembers.length - 1;

        res.status(201).json({
            success: true,
            message: friendsAdded > 0
                ? `Trip created successfully! ${friendsAdded} friend${friendsAdded > 1 ? 's' : ''} added to squad.`
                : 'Trip created successfully.',
            trip,
            friendsAdded
        });
    } catch (error) {
        console.error('Create trip error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create trip.',
            error: error.message
        });
    }
};

/**
 * Search trips with filters
 * GET /api/trips/search
 */
export const searchTrips = async (req, res) => {
    try {
        const {
            startPoint,
            endPoint,
            startDate,
            endDate,
            tags,
            difficulty,
            minBudget,
            maxBudget,
            search,
            page = 1,
            limit = 20,
            sortBy = 'startDate'
        } = req.query;

        // Build filter query
        const filter = {
            status: 'active',
            isPublic: true
        };

        // Filter by start point
        if (startPoint) {
            filter['startPoint.name'] = new RegExp(startPoint, 'i');
        }

        // Filter by end point
        if (endPoint) {
            filter['endPoint.name'] = new RegExp(endPoint, 'i');
        }

        // Filter by date range
        if (startDate || endDate) {
            filter.startDate = {};
            if (startDate) {
                filter.startDate.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.startDate.$lte = new Date(endDate);
            }
        }

        // Filter by tags (array can contain multiple tags)
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            filter.tags = { $in: tagArray };
        }

        // Filter by difficulty
        if (difficulty) {
            filter.difficulty = difficulty;
        }

        // Filter by budget
        if (minBudget || maxBudget) {
            filter.$or = [];

            if (minBudget) {
                filter.$or.push({ 'budget.min': { $gte: parseFloat(minBudget) } });
            }

            if (maxBudget) {
                filter.$or.push({ 'budget.max': { $lte: parseFloat(maxBudget) } });
            }
        }

        // Full-text search on title and locations
        if (search) {
            filter.$text = { $search: search };
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sorting
        let sortOptions = {};
        switch (sortBy) {
            case 'startDate':
                sortOptions = { startDate: 1 };
                break;
            case 'recent':
                sortOptions = { createdAt: -1 };
                break;
            case 'popular':
                sortOptions = { 'stats.likes': -1 };
                break;
            default:
                sortOptions = { startDate: 1 };
        }

        // Execute query
        const trips = await Trip.find(filter)
            .populate('creator', 'name profilePicture badges gender')
            .populate('squadMembers', 'name profilePicture')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await Trip.countDocuments(filter);

        res.status(200).json({
            success: true,
            trips,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalTrips: total,
                tripsPerPage: parseInt(limit)
            },
            filters: {
                startPoint,
                endPoint,
                startDate,
                endDate,
                tags,
                difficulty,
                search
            }
        });
    } catch (error) {
        console.error('Search trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search trips.',
            error: error.message
        });
    }
};

/**
 * Get trip by ID
 * GET /api/trips/:id
 */
export const getTripById = async (req, res) => {
    try {
        const { id } = req.params;

        const trip = await Trip.findById(id)
            .populate('creator', 'name email profilePicture badges bio location gender')
            .populate('squadMembers', 'name profilePicture badges');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        // Increment view count (only if user is authenticated and not the creator)
        if (req.user && req.user._id.toString() !== trip.creator._id.toString()) {
            await trip.incrementViews();
        }

        res.status(200).json({
            success: true,
            trip
        });
    } catch (error) {
        console.error('Get trip by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trip.',
            error: error.message
        });
    }
};

/**
 * Update trip
 * PUT /api/trips/:id
 */
export const updateTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const trip = await Trip.findById(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        // Check if user is the creator
        if (trip.creator.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own trips.'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'title',
            'description',
            'startPoint',
            'endPoint',
            'startDate',
            'endDate',
            'tags',
            'coverPhoto',
            'maxSquadSize',
            'budget',
            'difficulty',
            'isPublic',
            'status'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                trip[field] = req.body[field];
            }
        });

        await trip.save();

        await trip.populate('creator', 'name profilePicture');
        await trip.populate('squadMembers', 'name profilePicture');

        res.status(200).json({
            success: true,
            message: 'Trip updated successfully.',
            trip
        });
    } catch (error) {
        console.error('Update trip error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update trip.',
            error: error.message
        });
    }
};

/**
 * Delete trip
 * DELETE /api/trips/:id
 */
export const deleteTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const trip = await Trip.findById(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        // Check if user is the creator or admin
        if (trip.creator.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own trips.'
            });
        }

        await Trip.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Trip deleted successfully.'
        });
    } catch (error) {
        console.error('Delete trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete trip.',
            error: error.message
        });
    }
};

/**
 * Join a trip
 * POST /api/trips/:id/join
 */
export const joinTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const trip = await Trip.findById(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        if (trip.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot join a trip that is not active.'
            });
        }

        await trip.addSquadMember(userId);

        await trip.populate('creator', 'name profilePicture');
        await trip.populate('squadMembers', 'name profilePicture');

        res.status(200).json({
            success: true,
            message: 'Successfully joined the trip.',
            trip
        });
    } catch (error) {
        console.error('Join trip error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Leave a trip
 * POST /api/trips/:id/leave
 */
export const leaveTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const trip = await Trip.findById(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        // Creator cannot leave their own trip
        if (trip.creator.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Trip creator cannot leave the trip. Delete it instead.'
            });
        }

        await trip.removeSquadMember(userId);

        res.status(200).json({
            success: true,
            message: 'Successfully left the trip.'
        });
    } catch (error) {
        console.error('Leave trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave trip.',
            error: error.message
        });
    }
};

/**
 * Remove a member from the squad (Creator only)
 * POST /api/trips/:id/remove-member
 */
export const removeMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: memberIdToRemove } = req.body;
        const requesterId = req.user._id;

        if (!memberIdToRemove) {
            return res.status(400).json({
                success: false,
                message: 'User ID to remove is required.'
            });
        }

        const trip = await Trip.findById(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        // Check if requester is the creator
        if (trip.creator.toString() !== requesterId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the trip creator can remove members.'
            });
        }

        // Cannot remove self (creator)
        if (memberIdToRemove === trip.creator.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Creator cannot be removed from the trip.'
            });
        }

        await trip.removeSquadMember(memberIdToRemove);

        // Populate to return updated list
        await trip.populate('squadMembers', 'name profilePicture');

        res.status(200).json({
            success: true,
            message: 'Member removed successfully.',
            trip
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove member.',
            error: error.message
        });
    }
};

/**
 * Like/Unlike a trip
 * POST /api/trips/:id/like
 */
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const trip = await Trip.findById(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        await trip.toggleLike(userId);

        const isLiked = trip.likedBy.includes(userId);

        res.status(200).json({
            success: true,
            message: isLiked ? 'Trip liked.' : 'Trip unliked.',
            isLiked,
            likesCount: trip.stats.likes
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update like status.',
            error: error.message
        });
    }
};

// Get trip by code
// GET /api/trips/code/:code
export const getTripByCode = async (req, res) => {
    try {
        const { code } = req.params;

        if (!code || code.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Invalid trip code. Code must be 6 characters.'
            });
        }

        const trip = await Trip.findByCode(code);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'No trip found with this code.'
            });
        }

        // Increment view count
        trip.stats.views += 1;
        await trip.save();

        res.json({
            success: true,
            trip
        });
    } catch (error) {
        console.error('Get trip by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find trip.',
            error: error.message
        });
    }
};
