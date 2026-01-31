import { Memory, Trip } from '../models/index.js';

/**
 * Get all memories for a trip
 * GET /api/trips/:tripId/memories
 */
export const getTripMemories = async (req, res) => {
    try {
        const { tripId } = req.params;

        const memories = await Memory.find({ trip: tripId })
            .populate('author', 'name profilePicture')
            .populate('comments.user', 'name profilePicture')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            memories
        });
    } catch (error) {
        console.error('Get trip memories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch memories'
        });
    }
};

/**
 * Create a new memory (squad members only)
 * POST /api/trips/:tripId/memories
 */
export const createMemory = async (req, res) => {
    try {
        const { tripId } = req.params; // Might be undefined/null if hitting a general route, but currently route is /trips/:tripId/memories.
        // We need a new route for general posting OR handle "general" as a tripId param? 
        // Better: create a new route POST /api/memories/create

        // However, I can't easily change routes without updating api.ts references.
        // Let's modify the route to accept "general" or handle logic here if tripId is provided.
        // But wait, user said "remove completed trips logic". 

        const userId = req.user._id;
        const { content, photos, locationName, tripId: bodyTripId } = req.body;

        // Determine Trip ID (param > body)
        const targetTripId = tripId || bodyTripId;

        let memoryData = {
            author: userId,
            content,
            photos: photos || []
        };

        if (targetTripId && targetTripId !== 'general') {
            // Validate ObjectId format to prevent CastError
            if (targetTripId.match(/^[0-9a-fA-F]{24}$/)) {
                // Verify trip exists
                const trip = await Trip.findById(targetTripId);
                if (trip) {
                    memoryData.trip = targetTripId;
                }
            } else {
                console.warn(`Invalid Trip ID format: ${targetTripId}`);
            }
        }

        if (locationName) {
            memoryData.locationName = locationName;
        }

        // Validate content
        if (!content && (!photos || photos.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Memory must have content or photos'
            });
        }

        // Create memory
        const memory = await Memory.create(memoryData);

        await memory.populate('author', 'name profilePicture');
        if (memory.trip) await memory.populate('trip', 'title');

        res.status(201).json({
            success: true,
            message: 'Memory created successfully',
            memory
        });
    } catch (error) {
        console.error('Create memory error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create memory'
        });
    }
};

/**
 * Like/unlike a memory
 * POST /api/memories/:memoryId/like
 */
export const toggleMemoryLike = async (req, res) => {
    try {
        const { memoryId } = req.params;
        const userId = req.user._id;

        const memory = await Memory.findById(memoryId);
        if (!memory) {
            return res.status(404).json({
                success: false,
                message: 'Memory not found'
            });
        }

        const likeIndex = memory.likes.findIndex(
            id => id.toString() === userId.toString()
        );

        if (likeIndex > -1) {
            // Unlike
            memory.likes.splice(likeIndex, 1);
        } else {
            // Like
            memory.likes.push(userId);
        }

        await memory.save();

        res.json({
            success: true,
            liked: likeIndex === -1,
            likeCount: memory.likes.length
        });
    } catch (error) {
        console.error('Toggle memory like error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle like'
        });
    }
};

/**
 * Add a comment to a memory
 * POST /api/memories/:memoryId/comments
 */
export const addComment = async (req, res) => {
    try {
        const { memoryId } = req.params;
        const userId = req.user._id;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        const memory = await Memory.findById(memoryId);
        if (!memory) {
            return res.status(404).json({
                success: false,
                message: 'Memory not found'
            });
        }

        memory.comments.push({
            user: userId,
            text: text.trim()
        });

        await memory.save();
        await memory.populate('comments.user', 'name profilePicture');

        const newComment = memory.comments[memory.comments.length - 1];

        res.status(201).json({
            success: true,
            message: 'Comment added',
            comment: newComment
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add comment'
        });
    }
};

/**
 * Delete a memory (author only)
 * DELETE /api/memories/:memoryId
 */
export const deleteMemory = async (req, res) => {
    try {
        const { memoryId } = req.params;
        const userId = req.user._id;

        const memory = await Memory.findById(memoryId);
        if (!memory) {
            return res.status(404).json({
                success: false,
                message: 'Memory not found'
            });
        }

        // Check if user is the author
        if (memory.author.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the author can delete this memory'
            });
        }

        await Memory.findByIdAndDelete(memoryId);

        res.json({
            success: true,
            message: 'Memory deleted successfully'
        });
    } catch (error) {
        console.error('Delete memory error:', error);
        res.status(500).json({
        });
    }
};

/**
 * Get all community memories (Gallery)
 * GET /api/memories/feed
 */
export const getAllMemories = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const memories = await Memory.find()
            .populate('author', 'name profilePicture')
            .populate('trip', 'title startPoint endPoint')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Memory.countDocuments();

        res.json({
            success: true,
            memories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total
            }
        });
    } catch (error) {
        console.error('Get gallery error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gallery'
        });
    }
};
