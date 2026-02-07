import Community from '../models/Community.js';
import CommunityMessage from '../models/CommunityMessage.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

/**
 * Check if user has premium/active subscription
 */
const checkPremiumStatus = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.subscription) return false;

        const now = new Date();

        // Check active trial
        if (user.subscription.status === 'trial' &&
            user.subscription.trialEnds &&
            new Date(user.subscription.trialEnds) > now) {
            return true;
        }

        // Check active subscription
        if (user.subscription.status === 'active' &&
            user.subscription.currentEnd &&
            new Date(user.subscription.currentEnd) > now) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking premium status:', error);
        return false;
    }
};

/**
 * Premium middleware - check if user has active subscription
 */
export const requirePremium = async (req, res, next) => {
    try {
        const isPremium = await checkPremiumStatus(req.user._id);
        if (!isPremium) {
            return res.status(403).json({
                success: false,
                message: 'Premium membership required to access Communities.',
                requiresPremium: true
            });
        }
        next();
    } catch (error) {
        console.error('Premium check error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get user's communities (as member)
 * GET /api/communities
 */
export const getMyCommunities = async (req, res) => {
    try {
        const communities = await Community.find({
            members: req.user._id
        })
            .populate('creator', 'name profilePicture')
            .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            communities
        });
    } catch (error) {
        console.error('Get communities error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch communities' });
    }
};

/**
 * Discover public communities + user's pending requests
 * GET /api/communities/discover
 */
export const discoverCommunities = async (req, res) => {
    try {
        const { category, search } = req.query;

        // Build query for public communities user is NOT a member of
        const query = {
            isPrivate: false,
            members: { $ne: req.user._id }
        };

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const publicCommunities = await Community.find(query)
            .populate('creator', 'name profilePicture')
            .sort({ memberCount: -1 })
            .limit(50)
            .lean();

        // Get communities where user has pending request
        const pendingCommunities = await Community.find({
            'pendingRequests.user': req.user._id
        })
            .populate('creator', 'name profilePicture')
            .lean();

        res.status(200).json({
            success: true,
            publicCommunities,
            pendingCommunities: pendingCommunities.map(c => ({
                ...c,
                hasPendingRequest: true
            }))
        });
    } catch (error) {
        console.error('Discover communities error:', error);
        res.status(500).json({ success: false, message: 'Failed to discover communities' });
    }
};

/**
 * Create a new community
 * POST /api/communities/create
 */
export const createCommunity = async (req, res) => {
    try {
        const { name, description, category, isPrivate, coverImage, logo } = req.body;

        // Check if name is unique
        const existing = await Community.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A community with this name already exists'
            });
        }

        const community = new Community({
            name,
            description,
            category: category || 'Other',
            isPrivate: isPrivate !== false,
            coverImage,
            logo,
            creator: req.user._id
        });

        await community.save();

        const populated = await Community.findById(community._id)
            .populate('creator', 'name profilePicture')
            .lean();

        res.status(201).json({
            success: true,
            message: 'Community created successfully',
            community: populated
        });
    } catch (error) {
        console.error('Create community error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A community with this name already exists'
            });
        }
        res.status(500).json({ success: false, message: 'Failed to create community' });
    }
};

/**
 * Get community details with messages
 * GET /api/communities/:id
 */
export const getCommunityDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const community = await Community.findById(id)
            .populate('creator', 'name profilePicture')
            .populate('members', 'name profilePicture')
            .populate('pendingRequests.user', 'name profilePicture')
            .lean();

        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        // Check if user is a member
        const isMember = community.members.some(m => m._id.toString() === req.user._id.toString());
        const isCreator = community.creator._id.toString() === req.user._id.toString();

        if (!isMember && community.isPrivate) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this private community'
            });
        }

        res.status(200).json({
            success: true,
            community,
            isMember,
            isCreator
        });
    } catch (error) {
        console.error('Get community details error:', error);
        res.status(500).json({ success: false, message: 'Failed to get community details' });
    }
};

/**
 * Get community messages
 * GET /api/communities/:id/messages
 */
export const getCommunityMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { before, limit = 50 } = req.query;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        // Check membership
        if (!community.members.includes(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Not a member' });
        }

        const query = { communityId: id };
        if (before) {
            query.timestamp = { $lt: new Date(before) };
        }

        const messages = await CommunityMessage.find(query)
            .populate('sender', 'name profilePicture')
            .populate({
                path: 'replyTo',
                select: 'sender message type imageUrl',
                populate: { path: 'sender', select: 'name' }
            })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        // Transform messages
        const transformedMessages = messages.reverse().map(msg => ({
            _id: msg._id,
            sender: msg.sender?._id || null, // Handle deleted users
            senderName: msg.sender?.name || 'Unknown User',
            senderProfilePicture: msg.sender?.profilePicture || null,
            message: msg.message,
            type: msg.type,
            imageUrl: msg.imageUrl,
            timestamp: msg.timestamp,
            replyTo: msg.replyTo ? {
                _id: msg.replyTo._id,
                senderName: msg.replyTo.sender?.name || 'Unknown',
                message: msg.replyTo.message,
                type: msg.replyTo.type,
                imageUrl: msg.replyTo.imageUrl
            } : null
        }));

        res.status(200).json({
            success: true,
            messages: transformedMessages
        });
    } catch (error) {
        console.error('Get community messages error:', error);
        res.status(500).json({ success: false, message: 'Failed to get messages' });
    }
};

/**
 * Join a public community
 * POST /api/communities/:id/join
 */
export const joinCommunity = async (req, res) => {
    try {
        const { id } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        if (community.isPrivate) {
            return res.status(400).json({
                success: false,
                message: 'This is a private community. Please request to join.'
            });
        }

        if (community.members.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: 'Already a member' });
        }

        community.members.push(req.user._id);
        community.memberCount = community.members.length;
        await community.save();

        res.status(200).json({
            success: true,
            message: 'Successfully joined the community'
        });
    } catch (error) {
        console.error('Join community error:', error);
        res.status(500).json({ success: false, message: 'Failed to join community' });
    }
};

/**
 * Request to join a private community
 * POST /api/communities/:id/request
 */
export const requestToJoin = async (req, res) => {
    try {
        const { id } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        if (community.members.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: 'Already a member' });
        }

        // Check if already requested
        const alreadyRequested = community.pendingRequests.some(
            r => r.user.toString() === req.user._id.toString()
        );
        if (alreadyRequested) {
            return res.status(400).json({ success: false, message: 'Request already pending' });
        }

        community.pendingRequests.push({ user: req.user._id });
        await community.save();

        res.status(200).json({
            success: true,
            message: 'Join request sent successfully'
        });
    } catch (error) {
        console.error('Request to join error:', error);
        res.status(500).json({ success: false, message: 'Failed to send request' });
    }
};

/**
 * Leave a community
 * POST /api/communities/:id/leave
 */
export const leaveCommunity = async (req, res) => {
    try {
        const { id } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        if (community.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Creator cannot leave. Transfer ownership or delete the community.'
            });
        }

        community.members = community.members.filter(
            m => m.toString() !== req.user._id.toString()
        );
        community.memberCount = community.members.length;
        await community.save();

        res.status(200).json({
            success: true,
            message: 'Successfully left the community'
        });
    } catch (error) {
        console.error('Leave community error:', error);
        res.status(500).json({ success: false, message: 'Failed to leave community' });
    }
};

/**
 * Update community settings (admin only)
 * PUT /api/communities/:id/settings
 */
export const updateCommunitySettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, isPrivate, coverImage, logo } = req.body;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        if (community.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only admin can update settings' });
        }

        // Check name uniqueness if changed
        if (name && name !== community.name) {
            const existing = await Community.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: id }
            });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Name already taken' });
            }
            community.name = name;
        }

        if (description !== undefined) community.description = description;
        if (category) community.category = category;
        if (isPrivate !== undefined) community.isPrivate = isPrivate;
        if (coverImage !== undefined) community.coverImage = coverImage;
        if (logo !== undefined) community.logo = logo;

        await community.save();

        res.status(200).json({
            success: true,
            message: 'Community updated successfully',
            community
        });
    } catch (error) {
        console.error('Update community error:', error);
        res.status(500).json({ success: false, message: 'Failed to update community' });
    }
};

/**
 * Remove a member (admin only)
 * DELETE /api/communities/:id/members/:userId
 */
export const removeMember = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        if (community.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only admin can remove members' });
        }

        if (userId === community.creator.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot remove the creator' });
        }

        community.members = community.members.filter(m => m.toString() !== userId);
        community.memberCount = community.members.length;
        await community.save();

        res.status(200).json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
};

/**
 * Approve join request (admin only)
 * PUT /api/communities/:id/requests/:userId/approve
 */
export const approveRequest = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        if (community.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only admin can approve requests' });
        }

        // Remove from pending and add to members
        const requestIndex = community.pendingRequests.findIndex(
            r => r.user.toString() === userId
        );
        if (requestIndex === -1) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        community.pendingRequests.splice(requestIndex, 1);
        if (!community.members.includes(userId)) {
            community.members.push(userId);
            community.memberCount = community.members.length;
        }
        await community.save();

        res.status(200).json({
            success: true,
            message: 'Request approved successfully'
        });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve request' });
    }
};

/**
 * Reject join request (admin only)
 * PUT /api/communities/:id/requests/:userId/reject
 */
export const rejectRequest = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        if (community.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only admin can reject requests' });
        }

        community.pendingRequests = community.pendingRequests.filter(
            r => r.user.toString() !== userId
        );
        await community.save();

        res.status(200).json({
            success: true,
            message: 'Request rejected'
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject request' });
    }
};

/**
 * Delete community (admin only)
 * DELETE /api/communities/:id
 */
export const deleteCommunity = async (req, res) => {
    try {
        const { id } = req.params;

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ success: false, message: 'Community not found' });
        }

        if (community.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only creator can delete community' });
        }

        // Delete all messages
        await CommunityMessage.deleteMany({ communityId: id });

        // Delete community
        await Community.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Community deleted successfully'
        });
    } catch (error) {
        console.error('Delete community error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete community' });
    }
};
