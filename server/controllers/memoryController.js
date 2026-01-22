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
        const { tripId } = req.params;
        const userId = req.user._id;
        const { content, photos } = req.body;

        // Verify trip exists and is completed
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check if user is a squad member
        const isSquadMember = trip.squadMembers.some(
            member => member.toString() === userId.toString()
        );

        if (!isSquadMember) {
            return res.status(403).json({
                success: false,
                message: 'Only squad members can post memories'
            });
        }

        // Check if trip is completed (optional - you can enforce this)
        const now = new Date();
        if (new Date(trip.endDate) > now) {
            return res.status(400).json({
                success: false,
                message: 'Cannot post memories for ongoing trips'
            });
        }

        // Validate content
        if (!content && (!photos || photos.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'Memory must have content or photos'
            });
        }

        // Create memory
        const memory = await Memory.create({
            trip: tripId,
            author: userId,
            content,
            photos: photos || []
        });

        await memory.populate('author', 'name profilePicture');

        res.status(201).json({
            success: true,
            message: 'Memory created successfully',
            memory
        });
    } catch (error) {
        console.error('Create memory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create memory'
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
            success: false,
            message: 'Failed to delete memory'
        });
    }
};
