import { Conversation, DirectMessage, User } from '../models/index.js';

/**
 * Get all conversations for the logged-in user
 * GET /api/messages/conversations
 */
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all conversations where user is a participant
        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'name profilePicture')
            .populate('lastMessage.sender', 'name')
            .sort({ 'lastMessage.timestamp': -1 });

        // Format response with other user details and unread count
        // Filter out conversations where otherUser is null (deleted users, etc.)
        const formattedConversations = conversations
            .map(conv => {
                const otherUser = conv.participants.find(
                    p => p && p._id && p._id.toString() !== userId.toString()
                );

                // Handle deleted users
                if (!otherUser) {
                    return {
                        _id: conv._id,
                        otherUser: {
                            _id: 'deleted',
                            name: 'Deleted User',
                            profilePicture: '/assets/default-user.png'
                        },
                        lastMessage: conv.lastMessage ? {
                            text: conv.lastMessage.text || '',
                            timestamp: conv.lastMessage.timestamp,
                            isOwnMessage: conv.lastMessage.sender?.toString() === userId.toString()
                        } : null,
                        unreadCount: 0,
                        updatedAt: conv.updatedAt
                    };
                }

                return {
                    _id: conv._id,
                    otherUser: {
                        _id: otherUser._id,
                        name: otherUser.name || 'Unknown User',
                        profilePicture: otherUser.profilePicture || null
                    },
                    lastMessage: conv.lastMessage && conv.lastMessage.text ? {
                        text: conv.lastMessage.text,
                        timestamp: conv.lastMessage.timestamp,
                        isOwnMessage: conv.lastMessage.sender?.toString() === userId.toString()
                    } : null,
                    unreadCount: conv.unreadCount.get(userId.toString()) || 0,
                    updatedAt: conv.updatedAt
                };
            });

        res.status(200).json({
            success: true,
            conversations: formattedConversations
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations.',
            error: error.message
        });
    }
};

/**
 * Get or create conversation with a specific user
 * GET /api/messages/conversation/:userId
 */
export const getOrCreateConversation = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;

        // Validate the other user exists
        const otherUser = await User.findById(userId).select('name profilePicture');
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Can't message yourself
        if (currentUserId.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create conversation with yourself.'
            });
        }

        // Find or create conversation
        const conversation = await Conversation.findOrCreate(currentUserId, userId);

        // Get recent messages with sender populated
        let messages = await DirectMessage.find({
            conversationId: conversation._id
        })
            .sort({ timestamp: 1 })
            .limit(50)
            .populate('sender', 'name')
            .populate({
                path: 'replyTo',
                select: 'sender message type imageUrl',
                populate: { path: 'sender', select: 'name' }
            })
            .lean();

        // Transform messages to include senderName for both message and replyTo
        messages = messages.map(msg => {
            // Add senderName from populated sender
            if (msg.sender && typeof msg.sender === 'object') {
                msg.senderName = msg.sender.name || 'Unknown';
                msg.sender = msg.sender._id; // Flatten back to ID for consistency
            } else {
                msg.senderName = 'Unknown';
            }
            // Handle replyTo senderName
            if (msg.replyTo) {
                if (msg.replyTo.sender && typeof msg.replyTo.sender === 'object') {
                    msg.replyTo.senderName = msg.replyTo.sender.name || 'Unknown';
                } else {
                    msg.replyTo.senderName = 'Unknown';
                }
            }
            return msg;
        });

        res.status(200).json({
            success: true,
            conversation: {
                _id: conversation._id,
                participants: conversation.participants
            },
            messages,
            otherUser: {
                _id: otherUser._id,
                name: otherUser.name,
                profilePicture: otherUser.profilePicture
            }
        });
    } catch (error) {
        console.error('Get or create conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation.',
            error: error.message
        });
    }
};

/**
 * Get message history for a conversation
 * GET /api/messages/:conversationId/history
 */
export const getMessageHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Verify user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found.'
            });
        }

        if (!conversation.participants.some(p => p.toString() === userId.toString())) {
            console.log('⛔ Auth failed: User not in conversation participants', { userId, participants: conversation.participants });
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this conversation.'
            });
        }

        console.log(`📥 getMessages for conversation: ${conversationId}`);

        // Get total count
        const total = await DirectMessage.countDocuments({ conversationId });
        console.log(`📥 Found total: ${total} messages`);

        // Get paginated messages with sender populated
        let messages = await DirectMessage.find({ conversationId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'name profilePicture')
            .populate({
                path: 'replyTo',
                select: 'sender message type imageUrl',
                populate: { path: 'sender', select: 'name profilePicture' }
            })
            .lean();

        // Transform messages to include senderName and senderProfilePicture for both message and replyTo
        messages = messages.map(msg => {
            // Add senderName and senderProfilePicture from populated sender
            if (msg.sender && typeof msg.sender === 'object') {
                msg.senderName = msg.sender.name || 'Unknown';
                msg.senderProfilePicture = msg.sender.profilePicture || null;
                msg.senderId = msg.sender._id; // Keep sender ID for frontend
                msg.sender = msg.sender._id; // Flatten back to ID for consistency
            } else {
                msg.senderName = 'Unknown';
                msg.senderProfilePicture = null;
                msg.senderId = msg.sender;
            }
            // Handle replyTo senderName
            if (msg.replyTo) {
                if (msg.replyTo.sender && typeof msg.replyTo.sender === 'object') {
                    msg.replyTo.senderName = msg.replyTo.sender.name || 'Unknown';
                } else {
                    msg.replyTo.senderName = 'Unknown';
                }
            }
            return msg;
        });

        // Reverse to show oldest first
        messages.reverse();

        // Get conversation with participants populated to identify the other user
        const conversationWithParticipants = await Conversation.findById(conversationId).populate('participants', 'name profilePicture');

        let conversationData = null;
        if (conversationWithParticipants) {
            // Find the other participant
            const otherUser = conversationWithParticipants.participants.find(
                p => p._id.toString() !== userId.toString()
            );

            conversationData = {
                _id: conversationWithParticipants._id,
                participants: conversationWithParticipants.participants,
                otherUserId: otherUser?._id,
                name: otherUser?.name || 'Unknown User',
                avatar: otherUser?.profilePicture,
                type: 'dm'
            };
        }

        res.status(200).json({
            success: true,
            messages,
            conversation: conversationData,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalMessages: total,
                messagesPerPage: limit
            }
        });
    } catch (error) {
        console.error('Get message history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch message history.',
            error: error.message
        });
    }
};

/**
 * Mark conversation as read
 * POST /api/messages/mark-read
 */
export const markConversationAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.body;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found.'
            });
        }

        // Verify user is participant
        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized.'
            });
        }

        // Mark as read
        await conversation.markAsRead(userId);

        // Also mark all messages as read
        await DirectMessage.updateMany(
            {
                conversationId,
                receiver: userId,
                read: false
            },
            {
                read: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Conversation marked as read.'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark conversation as read.',
            error: error.message
        });
    }
};

/**
 * Get total unread message count for user
 * GET /api/messages/unread-count
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId
        });

        let totalUnread = 0;
        conversations.forEach(conv => {
            totalUnread += conv.unreadCount.get(userId.toString()) || 0;
        });

        res.status(200).json({
            success: true,
            unreadCount: totalUnread
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count.',
            error: error.message
        });
    }
};

/**
 * Block a user
 * POST /api/messages/block/:userId
 */
export const blockUser = async (req, res) => {
    try {
        const currentUser = req.user;
        const { userId } = req.params;

        if (currentUser._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot block yourself.'
            });
        }

        const userToBlock = await User.findById(userId);
        if (!userToBlock) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        await currentUser.blockUser(userId);

        res.status(200).json({
            success: true,
            message: `${userToBlock.name} has been blocked.`
        });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to block user.',
            error: error.message
        });
    }
};

/**
 * Unblock a user
 * POST /api/messages/unblock/:userId
 */
export const unblockUser = async (req, res) => {
    try {
        const currentUser = req.user;
        const { userId } = req.params;

        await currentUser.unblockUser(userId);

        res.status(200).json({
            success: true,
            message: 'User unblocked successfully.'
        });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unblock user.',
            error: error.message
        });
    }
};

/**
 * Check blocked status between two users
 * GET /api/messages/block-status/:userId
 */
export const getBlockStatus = async (req, res) => {
    try {
        const currentUser = req.user;
        const { userId } = req.params;

        const otherUser = await User.findById(userId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const iBlockedThem = currentUser.hasBlocked(userId);
        const theyBlockedMe = otherUser.blockedUsers?.some(
            id => id.toString() === currentUser._id.toString()
        ) || false;

        res.status(200).json({
            success: true,
            iBlockedThem,
            theyBlockedMe,
            canMessage: !iBlockedThem && !theyBlockedMe
        });
    } catch (error) {
        console.error('Get block status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get block status.',
            error: error.message
        });
    }
};

/**
 * Get list of blocked users
 * GET /api/messages/blocked-users
 */
export const getBlockedUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id)
            .populate('blockedUsers', 'name profilePicture');

        res.status(200).json({
            success: true,
            blockedUsers: currentUser.blockedUsers || []
        });
    } catch (error) {
        console.error('Get blocked users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get blocked users.',
            error: error.message
        });
    }
};
