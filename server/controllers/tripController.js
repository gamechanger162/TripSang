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
            .populate('creator', 'name email profilePicture badges bio location gender')
            .populate('squadMembers', 'name profilePicture badges');

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

/**
 * Get trending destinations
 * GET /api/trips/trending
 */
// Import at the top of file would be ideal, but doing dynamic import or require here to avoid top-level issues if package missing
// import Parser from 'rss-parser';

export const getTrendingDestinations = async (req, res) => {
    try {
        // Real-Time Logic: Fetch from Travel News RSS Feeds
        // Using native 'https' module to ensure compatibility with all Node.js versions and avoid 500 errors
        let rssData = [];

        try {
            await new Promise((resolve, reject) => {
                const https = require('https');
                const FEED_URL = 'https://feeds.feedburner.com/BreakingTravelNews';

                const request = https.get(FEED_URL, (response) => {
                    if (response.statusCode < 200 || response.statusCode > 299) {
                        response.resume(); // consume response data to free up memory
                        reject(new Error(`Failed to load page, status code: ${response.statusCode}`));
                        return;
                    }

                    const data = [];
                    response.on('data', (chunk) => data.push(chunk));
                    response.on('end', () => {
                        try {
                            const xmlText = Buffer.concat(data).toString();

                            // Extract location names
                            const KNOWN_CITIES = [
                                // International
                                'Paris', 'London', 'Dubai', 'Bali', 'Thailand', 'Vietnam', 'Singapore', 'Japan', 'Tokyo', 'Maldives', 'New York', 'Switzerland',
                                // India
                                'Goa', 'Ladakh', 'Manali', 'Kerala', 'Jaipur', 'Udaipur', 'Varanasi', 'Rishikesh', 'Mumbai', 'Bangalore', 'Kashmir', 'Ayodhya'
                            ];

                            const foundDestinations = new Set();
                            const titleRegex = /<title>(.*?)<\/title>/g;
                            let match;

                            while ((match = titleRegex.exec(xmlText)) !== null) {
                                const title = match[1];
                                KNOWN_CITIES.forEach(city => {
                                    if (title && title.includes(city)) {
                                        foundDestinations.add(city);
                                    }
                                });
                            }

                            rssData = Array.from(foundDestinations).map(name => ({ name }));
                            resolve();
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                request.on('error', (err) => reject(err));

                // Set timeout
                request.setTimeout(3000, () => {
                    request.destroy();
                    reject(new Error('Request timed out'));
                });
            });

        } catch (rssError) {
            console.warn('RSS Fetch failed (using seasonal fallback):', rssError.message);
        }

        // --- Seasonal Fallback Data (Reliable & Beautiful) ---
        // Updated for FEBRUARY 2026 Trends (Rio Carnival, Venice, Warm Thailand)
        const month = new Date().getMonth(); // 0-11

        // Dynamic "Live" list based on current global trends
        const ALL_DESTINATIONS = {
            // Winter/Early Spring (Feb - March): Carnival, Snow, & Sun
            winter: [
                { name: "Rio de Janeiro", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&q=80" }, // Carnival
                { name: "Venice", image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&q=80" }, // Carnival
                { name: "Thailand", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80" }, // Warm
                { name: "Gulmarg", image: "https://images.unsplash.com/photo-1548263594-a71ea196f979?w=600&q=80" }, // Snow
                { name: "Goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80" }, // Party
                { name: "Kerala", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80" }, // Backwaters
                { name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea90b792d50?w=600&q=80" }, // Shopping/Sun
                { name: "Varanasi", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&q=80" } // Spiritual
            ],
            summer: [ // April - June
                { name: "Ladakh", image: "https://images.unsplash.com/photo-1581793434113-1463ee08709a?w=600&q=80" },
                { name: "Manali", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80" },
                { name: "Spiti Valley", image: "https://images.unsplash.com/photo-1599824425744-8c886b45391d?w=600&q=80" },
                { name: "Rishikesh", image: "https://images.unsplash.com/photo-1506665531195-35661e984842?w=600&q=80" },
                { name: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
                { name: "Ooty", image: "https://images.unsplash.com/photo-1548685913-fe65775c742c?w=600&q=80" }
            ],
            monsoon: [ // July - September
                { name: "Valley of Flowers", image: "https://images.unsplash.com/photo-1605373307525-2e65d8365851?w=600&q=80" },
                { name: "Lonavala", image: "https://images.unsplash.com/photo-1563290740-410e78263305?w=600&q=80" },
                { name: "Coorg", image: "https://images.unsplash.com/photo-1536431311719-398b670a9481?w=600&q=80" },
                { name: "Shillong", image: "https://images.unsplash.com/photo-1589136777351-94328825c14d?w=600&q=80" },
                { name: "Udaipur", image: "https://images.unsplash.com/photo-1594494193025-p1934988f5c3?w=600&q=80" },
                { name: "Wayanad", image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&q=80" },
                { name: "Alleppey", image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600&q=80" },
                { name: "Kodaikanal", image: "https://images.unsplash.com/photo-1571474004502-c184717b9383?w=600&q=80" }
            ],
            winter: [ // October - March
                { name: "Goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80" },
                { name: "Jaisalmer", image: "https://images.unsplash.com/photo-1577085773196-1c88d89cb218?w=600&q=80" },
                { name: "Auli", image: "https://images.unsplash.com/photo-1536431311719-398b670a9481?w=600&q=80" }, // Reusing generic mountain if specific missing
                { name: "Rann of Kutch", image: "https://images.unsplash.com/photo-1504705759706-c5ee7158f8bb?w=600&q=80" },
                { name: "Andaman", image: "https://images.unsplash.com/photo-1594968817658-29219e27c191?w=600&q=80" },
                { name: "Varanasi", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&q=80" },
                { name: "Hampi", image: "https://images.unsplash.com/photo-1620766165457-a8085a948178?w=600&q=80" },
                { name: "Pondicherry", image: "https://images.unsplash.com/photo-1622301075908-040776b7bd2f?w=600&q=80" }
            ]
        };

        // Determine season
        let currentSeason = 'winter';
        if (month >= 3 && month <= 5) currentSeason = 'summer';
        else if (month >= 6 && month <= 8) currentSeason = 'monsoon';

        const seasonalData = ALL_DESTINATIONS[currentSeason] || ALL_DESTINATIONS['winter'];

        // Enriched Mapping Helper
        const getImageForCity = (cityName) => {
            // Check in our database first
            for (const season in ALL_DESTINATIONS) {
                const found = ALL_DESTINATIONS[season].find(d => d.name === cityName);
                if (found) return found.image;
            }
            // Generic fallbacks
            if (['Bali', 'Thailand', 'Vietnam', 'Maldives'].includes(cityName)) return "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80";
            if (['Dubai', 'Abu Dhabi'].includes(cityName)) return "https://images.unsplash.com/photo-1512453979798-5ea904ac6605?w=600&q=80";
            if (['London', 'Paris', 'Europe'].includes(cityName)) return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80";
            return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80"; // Default travel image
        };

        // Merge RSS + Seasonal
        let finalTrending = [];

        // 1. Add RSS found items (Real world news)
        rssData.forEach(item => {
            finalTrending.push({
                name: item.name,
                image: getImageForCity(item.name),
                type: 'trending_news'
            });
        });

        // 2. Fill the rest with Seasonal Data
        seasonalData.forEach(item => {
            // Avoid duplicates
            if (!finalTrending.find(t => t.name === item.name)) {
                finalTrending.push({ ...item, type: 'seasonal' });
            }
        });

        // 3. Add Global Mix if needed
        const globalMix = [
            { name: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80", type: 'global' },
            { name: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea904ac6605?w=600&q=80", type: 'global' },
        ];

        // Shuffle/Rotate based on date
        const dayOfMonth = new Date().getDate();

        // If we found NO rss items, fallback to pure seasonal + global
        if (rssData.length === 0) {
            finalTrending = [...globalMix, ...seasonalData];
        }

        res.status(200).json({
            success: true,
            destinations: finalTrending.slice(0, 10), // Limit to top 10
            source: rssData.length > 0 ? "live_news_feed" : "seasonal_curated"
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
