import { Trip, User, GlobalConfig } from '../models/index.js';

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

        // Check Subscription Status
        // Allow if:
        // 1. Subscription is active OR
        // 2. Subscription is in trial period (and trial not expired) OR
        // 3. User is Admin
        // 4. Config allows free signup (but user asked for strict locking, so we check User status mainly)

        const user = await User.findById(userId);
        const config = await GlobalConfig.getInstance();

        if (config.enablePaidSignup && req.user.role !== 'admin') {
            const sub = user.subscription;
            const isTrialActive = sub.status === 'trial' && new Date(sub.trialEnds) > new Date();
            const isActive = sub.status === 'active';

            if (!isActive && !isTrialActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Active subscription or free trial required to create trips.'
                });
            }
        }

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

        // Send trip created email (async, don't wait)
        import('../utils/email.js').then(({ sendTripCreatedEmail }) => {
            sendTripCreatedEmail(user.email, user.name, title, trip.tripCode);
        }).catch(err => console.error('Failed to send trip created email:', err));
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
        // Default: Only show future/ongoing trips (endDate >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filter.endDate = { $gte: today };

        if (startDate || endDate) {
            // If user supplied specific dates, apply them within the future constraint
            // OR if specific logic requires overriding, we can adjust here.
            // For now, let's respect user filters BUT ensure we don't show old trips unless they ask (which isn't implemented in UI yet)

            filter.startDate = {}; // Reset/Init
            if (startDate) {
                filter.startDate.$gte = new Date(startDate);
            }
            if (endDate) {
                // If user wants trips ending by X date
                filter.endDate = {
                    $gte: today,
                    $lte: new Date(endDate)
                };
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
            .populate('creator', 'name email profilePicture badges bio location gender isMobileVerified verificationStatus')
            .populate('squadMembers', 'name profilePicture badges isMobileVerified verificationStatus');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found.'
            });
        }

        // Access Control
        // If system is paid-only, restrict access to non-subscribers
        // UNLESS it is their own trip (creator) ?? User said "can not open the created trips". 
        // If they created it during trial and trial expired, maybe they lose access? 
        // "Cannot open the created trips" suggests strict lockout.

        const config = await GlobalConfig.getInstance();
        if (config.enablePaidSignup) {
            // Check authentication
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Login required to view trips.',
                    requiresSubscription: true
                });
            }

            // Check subscription
            // We need to re-fetch user to be sure of latest sub status if req.user is stale (though usually fresh from middleware)
            // req.user has the basics. Middleware usually populates it.
            // Let's rely on req.user attributes if available, or fetch.
            // But standard auth middleware populates full user usually? 
            // In typical express setup it does.

            const user = req.user;
            const sub = user.subscription;

            const isTrialActive = sub && sub.status === 'trial' && sub.trialEnds && new Date(sub.trialEnds) > new Date();
            const isActive = sub && sub.status === 'active';
            const isAdmin = user.role === 'admin';

            if (!isActive && !isTrialActive && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Subscription required to view trip details.',
                    requiresSubscription: true
                });
            }
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

        // Check if user has premium/active subscription
        const user = req.user; // Already populated by auth middleware
        const isPremium = user.subscription?.status === 'active' || user.subscription?.status === 'trial';

        if (!isPremium) {
            return res.status(403).json({
                success: false,
                message: 'Premium membership required to join trips. Upgrade now to join squads!',
                requiresPremium: true,
                redirectUrl: '/payment/signup'
            });
        }

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

        await trip.populate('creator', 'name email profilePicture');
        await trip.populate('squadMembers', 'name profilePicture');

        res.status(200).json({
            success: true,
            message: 'Successfully joined the trip.',
            trip
        });

        // Notify trip creator by email (async, don't wait)
        import('../utils/email.js').then(({ sendTripJoinedEmail }) => {
            const joinerName = req.user.name || 'A traveler';
            sendTripJoinedEmail(trip.creator.email, trip.creator.name, trip.title, joinerName);
        }).catch(err => console.error('Failed to send trip joined email:', err));
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

/**
 * Get trending destinations
 * GET /api/trips/trending
 */
// Import at the top of file would be ideal, but doing dynamic import or require here to avoid top-level issues if package missing
// import Parser from 'rss-parser';

export const getTrendingDestinations = async (req, res) => {
    try {
        // --- Using Local Images for Reliability ---
        // All images are stored locally in /images/trending/ 
        // This ensures fast, reliable loading on all devices including mobile

        const month = new Date().getMonth(); // 0-11

        // Seasonal destinations with LOCAL images only
        const ALL_DESTINATIONS = {
            // Winter/Early Spring (Feb - March): Carnival, Snow, & Sun
            winter: [
                { name: "Rio de Janeiro", image: "/images/trending/rio_carnival.png" },
                { name: "Venice", image: "/images/trending/venice_canals.png" },
                { name: "Thailand", image: "/images/trending/thailand_beach.png" },
                { name: "Gulmarg", image: "/images/trending/snowy_mountains.png" },
                { name: "Goa", image: "/images/trending/goa_party.png" },
                { name: "Kerala", image: "/images/trending/kerala_backwaters.png" },
                { name: "Dubai", image: "/images/trending/dubai.png" },
                { name: "Jaisalmer", image: "/images/trending/jaisalmer_fort_desert.png" }
            ],
            summer: [ // April - June
                { name: "Ladakh", image: "/images/trending/ladakh_lake.png" },
                { name: "Manali", image: "/images/trending/manali_trek.png" },
                { name: "Spiti Valley", image: "/images/trending/spiti_valley.png" },
                { name: "Rishikesh", image: "/images/trending/rishikesh_rafting.png" },
                { name: "Bali", image: "/images/trending/bali_landscape.png" },
                { name: "Meghalaya", image: "/images/trending/meghalaya_rootbridge.png" }
            ],
            monsoon: [ // July - September
                { name: "Coorg", image: "/images/trending/coorg_hills.png" },
                { name: "Shillong", image: "/images/trending/shillong_hills.png" },
                { name: "Munnar", image: "/images/trending/munnar_tea.png" },
                { name: "Kaziranga", image: "/images/trending/kaziranga_rhino.png" },
                { name: "Andaman", image: "/images/trending/andaman_beach.png" },
                { name: "Gokarna", image: "/images/trending/gokarna_beach.png" }
            ],
            autumn: [ // October - January
                { name: "Goa", image: "/images/trending/goa_party.png" },
                { name: "Jaisalmer", image: "/images/trending/jaisalmer_fort_desert.png" },
                { name: "Andaman", image: "/images/trending/andaman_beach.png" },
                { name: "Pondicherry", image: "/images/trending/pondicherry_street.png" },
                { name: "Varkala", image: "/images/trending/varkala_cliff.png" },
                { name: "Kasol", image: "/images/trending/kasol_parvati.png" },
                { name: "Vietnam", image: "/images/trending/vietnam_street.png" },
                { name: "Iceland", image: "/images/trending/iceland.png" }
            ]
        };

        // Determine season
        let currentSeason = 'winter';
        if (month >= 3 && month <= 5) currentSeason = 'summer';
        else if (month >= 6 && month <= 8) currentSeason = 'monsoon';
        else if (month >= 9 && month <= 11) currentSeason = 'autumn';

        const seasonalData = ALL_DESTINATIONS[currentSeason] || ALL_DESTINATIONS['winter'];

        // Build final trending list from seasonal data + global mix
        let finalTrending = [];

        // Add Global Mix first (always popular destinations)
        const globalMix = [
            { name: "Bali", image: "/images/trending/bali_landscape.png", type: 'global' },
            { name: "Dubai", image: "/images/trending/dubai.png", type: 'global' },
        ];

        finalTrending = [...globalMix];

        // Add Seasonal Data (avoid duplicates)
        seasonalData.forEach(item => {
            if (!finalTrending.find(t => t.name === item.name)) {
                finalTrending.push({ ...item, type: 'seasonal' });
            }
        });

        res.status(200).json({
            success: true,
            destinations: finalTrending.slice(0, 10), // Limit to top 10
            source: "local_curated"
        });

    } catch (error) {
        console.error('Get trending destinations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trending destinations.',
            error: error.message
        });
    }
};

/**
 * Get current user's trips (created and joined)
 * GET /api/trips/my-trips
 */
export const getMyTrips = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find trips where user is creator OR squad member
        const trips = await Trip.find({
            $or: [
                { creator: userId },
                { squadMembers: userId }
            ]
        })
            .populate('creator', 'name profilePicture')
            .populate('squadMembers', 'name profilePicture')
            .sort('-updatedAt');

        console.log('DEBUG: getMyTrips RAW sort result:', trips.map(t => `${t.title} | ${t.updatedAt}`));


        res.status(200).json({
            success: true,
            trips,
            count: trips.length
        });
    } catch (error) {
        console.error('Get my trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your trips.',
            error: error.message
        });
    }
};
