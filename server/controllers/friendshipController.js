import { Friendship, User, Notification } from '../models/index.js';

/**
 * Send a friend request
 * POST /api/friends/request/:userId
 */
export const sendFriendRequest = async (req, res) => {
    try {
        const requesterId = req.user._id;
        const { userId: recipientId } = req.params;

        // Can't friend yourself
        if (requesterId.toString() === recipientId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot send a friend request to yourself.'
            });
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Check if friendship already exists
        const existingFriendship = await Friendship.findFriendship(requesterId, recipientId);

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'You are already friends with this user.'
                });
            }
            if (existingFriendship.status === 'pending') {
                // If I sent the request, it's already pending
                if (existingFriendship.requester.toString() === requesterId.toString()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Friend request already sent.'
                    });
                }
                // If they sent me a request, accept it instead
                existingFriendship.status = 'accepted';
                await existingFriendship.save();

                return res.status(200).json({
                    success: true,
                    message: `You are now friends with ${recipient.name}!`,
                    friendship: existingFriendship
                });
            }
            if (existingFriendship.status === 'declined') {
                // Allow resending request by updating existing record
                existingFriendship.requester = requesterId;
                existingFriendship.recipient = recipientId;
                existingFriendship.status = 'pending';
                await existingFriendship.save();

                // Create notification for recipient
                await Notification.create({
                    user: recipientId,
                    type: 'friend_request',
                    title: 'New Friend Request',
                    message: `${req.user.name} sent you a friend request.`,
                    data: { userId: requesterId }
                });

                return res.status(200).json({
                    success: true,
                    message: 'Friend request sent!',
                    friendship: existingFriendship
                });
            }
        }

        // Create new friendship request
        const friendship = await Friendship.create({
            requester: requesterId,
            recipient: recipientId,
            status: 'pending'
        });

        // Create notification for recipient
        await Notification.create({
            user: recipientId,
            type: 'friend_request',
            title: 'New Friend Request',
            message: `${req.user.name} sent you a friend request.`,
            data: { userId: requesterId }
        });

        res.status(201).json({
            success: true,
            message: 'Friend request sent!',
            friendship
        });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send friend request.',
            error: error.message
        });
    }
};

/**
 * Accept a friend request
 * POST /api/friends/accept/:userId
 */
export const acceptFriendRequest = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId: requesterId } = req.params;

        const friendship = await Friendship.findOne({
            requester: requesterId,
            recipient: currentUserId,
            status: 'pending'
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found.'
            });
        }

        friendship.status = 'accepted';
        await friendship.save();

        // Get requester details for response
        const requester = await User.findById(requesterId).select('name');

        // Notify the requester
        await Notification.create({
            user: requesterId,
            type: 'friend_accepted',
            title: 'Friend Request Accepted',
            message: `${req.user.name} accepted your friend request.`,
            data: { userId: currentUserId }
        });

        res.status(200).json({
            success: true,
            message: `You are now friends with ${requester.name}!`,
            friendship
        });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept friend request.',
            error: error.message
        });
    }
};

/**
 * Decline a friend request
 * POST /api/friends/decline/:userId
 */
export const declineFriendRequest = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId: requesterId } = req.params;

        const friendship = await Friendship.findOne({
            requester: requesterId,
            recipient: currentUserId,
            status: 'pending'
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found.'
            });
        }

        friendship.status = 'declined';
        await friendship.save();

        res.status(200).json({
            success: true,
            message: 'Friend request declined.'
        });
    } catch (error) {
        console.error('Decline friend request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to decline friend request.',
            error: error.message
        });
    }
};

/**
 * Cancel a sent friend request
 * DELETE /api/friends/cancel/:userId
 */
export const cancelFriendRequest = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId: recipientId } = req.params;

        const friendship = await Friendship.findOneAndDelete({
            requester: currentUserId,
            recipient: recipientId,
            status: 'pending'
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Friend request cancelled.'
        });
    } catch (error) {
        console.error('Cancel friend request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel friend request.',
            error: error.message
        });
    }
};

/**
 * Unfriend a user
 * DELETE /api/friends/:userId
 */
export const unfriend = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId: friendId } = req.params;

        const friendship = await Friendship.findOneAndDelete({
            $or: [
                { requester: currentUserId, recipient: friendId, status: 'accepted' },
                { requester: friendId, recipient: currentUserId, status: 'accepted' }
            ]
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: 'Friendship not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Friend removed.'
        });
    } catch (error) {
        console.error('Unfriend error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove friend.',
            error: error.message
        });
    }
};

/**
 * Get friends list
 * GET /api/friends
 */
export const getFriends = async (req, res) => {
    try {
        const userId = req.user._id;
        const friends = await Friendship.getFriends(userId);

        res.status(200).json({
            success: true,
            friends,
            count: friends.length
        });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get friends.',
            error: error.message
        });
    }
};

/**
 * Get pending friend requests (received)
 * GET /api/friends/requests/pending
 */
export const getPendingRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const requests = await Friendship.getPendingRequests(userId);

        const formatted = requests.map(r => ({
            _id: r._id,
            user: {
                _id: r.requester._id,
                name: r.requester.name,
                profilePicture: r.requester.profilePicture,
                badges: r.requester.badges
            },
            createdAt: r.createdAt
        }));

        res.status(200).json({
            success: true,
            requests: formatted,
            count: formatted.length
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending requests.',
            error: error.message
        });
    }
};

/**
 * Get sent friend requests
 * GET /api/friends/requests/sent
 */
export const getSentRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const requests = await Friendship.getSentRequests(userId);

        const formatted = requests.map(r => ({
            _id: r._id,
            user: {
                _id: r.recipient._id,
                name: r.recipient.name,
                profilePicture: r.recipient.profilePicture,
                badges: r.recipient.badges
            },
            createdAt: r.createdAt
        }));

        res.status(200).json({
            success: true,
            requests: formatted,
            count: formatted.length
        });
    } catch (error) {
        console.error('Get sent requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sent requests.',
            error: error.message
        });
    }
};

/**
 * Get friendship status with a specific user
 * GET /api/friends/status/:userId
 */
export const getFriendshipStatus = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;

        if (currentUserId.toString() === userId) {
            return res.status(200).json({
                success: true,
                status: 'self'
            });
        }

        const friendship = await Friendship.findFriendship(currentUserId, userId);

        if (!friendship) {
            return res.status(200).json({
                success: true,
                status: 'none'
            });
        }

        let status;
        if (friendship.status === 'accepted') {
            status = 'friends';
        } else if (friendship.status === 'pending') {
            if (friendship.requester.toString() === currentUserId.toString()) {
                status = 'pending_sent'; // I sent the request
            } else {
                status = 'pending_received'; // They sent me a request
            }
        } else if (friendship.status === 'declined') {
            status = 'none'; // Treat declined as no relationship
        }

        res.status(200).json({
            success: true,
            status,
            friendshipId: friendship._id
        });
    } catch (error) {
        console.error('Get friendship status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get friendship status.',
            error: error.message
        });
    }
};

/**
 * Get friends count for a user
 * GET /api/friends/count/:userId
 */
export const getFriendsCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const count = await Friendship.getFriendsCount(userId);

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Get friends count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get friends count.',
            error: error.message
        });
    }
};

/**
 * Get pending requests count
 * GET /api/friends/requests/count
 */
export const getPendingRequestsCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Friendship.countDocuments({
            recipient: userId,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Get pending requests count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending requests count.',
            error: error.message
        });
    }
};
