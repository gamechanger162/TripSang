import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import Review from '../models/Review.js';

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get stats
        const tripsCreated = await Trip.countDocuments({ creator: user._id });
        const tripsJoined = await Trip.countDocuments({ squadMembers: user._id });

        res.status(200).json({
            success: true,
            user: {
                ...user.toObject(),
                stats: {
                    tripsCreated,
                    tripsJoined
                }
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Get current user profile (with full details)
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get my profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.name = req.body.name || user.name;
        user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
        user.gender = req.body.gender || user.gender;
        user.mobileNumber = req.body.mobileNumber || user.mobileNumber;

        if (req.body.profilePicture) {
            user.profilePicture = req.body.profilePicture;
        }

        // Location
        if (req.body.location) {
            user.location = {
                ...user.location,
                ...req.body.location
            };
        }

        // Check if updating social links
        if (req.body.socialLinks) {
            user.socialLinks = {
                ...user.socialLinks,
                ...req.body.socialLinks
            };
        }

        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                profilePicture: updatedUser.profilePicture,
                isMobileVerified: updatedUser.isMobileVerified,
                bio: updatedUser.bio,
                gender: updatedUser.gender,
                socialLinks: updatedUser.socialLinks
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Get user's trips (created and joined)
 * @route   GET /api/users/trips
 * @access  Private
 */
export const getUserTrips = async (req, res) => {
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
            .lean();

        // Get last message for each trip
        const tripIds = trips.map(t => t._id);
        const lastMessages = await Message.aggregate([
            { $match: { tripId: { $in: tripIds } } },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$tripId',
                    senderName: { $first: '$senderName' },
                    message: { $first: '$message' },
                    timestamp: { $first: '$timestamp' },
                    type: { $first: '$type' }
                }
            }
        ]);

        // Create a map for quick lookup
        const lastMessageMap = {};
        lastMessages.forEach(lm => {
            lastMessageMap[lm._id.toString()] = {
                senderName: lm.senderName,
                message: lm.type === 'image' ? '📷 Sent an image' : lm.message,
                timestamp: lm.timestamp
            };
        });

        // Attach lastMessage to trips and sort
        const tripsWithMessages = trips.map(trip => ({
            ...trip,
            lastMessage: lastMessageMap[trip._id.toString()] || null
        })).sort((a, b) => {
            const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return bTime - aTime;
        });

        // Categorize
        const createdTrips = tripsWithMessages.filter(trip => trip.creator._id.toString() === userId.toString());
        const joinedTrips = tripsWithMessages.filter(trip => trip.creator._id.toString() !== userId.toString());

        res.status(200).json({
            success: true,
            trips: tripsWithMessages,
            createdTrips,
            joinedTrips,
            count: tripsWithMessages.length
        });
    } catch (error) {
        console.error('Get user trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Submit ID verification request
 * @route   POST /api/users/verify-request
 * @access  Private
 */
export const submitVerificationRequest = async (req, res) => {
    try {
        const { idType, frontUrl, backUrl } = req.body;

        if (!idType || !frontUrl) {
            return res.status(400).json({
                success: false,
                message: 'ID Type and Front Document are required'
            });
        }



        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.verificationStatus === 'verified') {
            return res.status(400).json({
                success: false,
                message: 'User is already verified'
            });
        }

        // Update user status
        user.verificationStatus = 'pending';
        user.idType = idType;
        user.idDocumentFront = frontUrl;
        if (backUrl) user.idDocumentBack = backUrl;

        user.rejectionReason = ''; // Clear previous rejection reason if any

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Verification request submitted successfully',
            user: {
                _id: user._id,
                verificationStatus: user.verificationStatus
            }
        });
    } catch (error) {
        console.error('Submit verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

/**
 * @desc    Delete own account permanently
 * @route   DELETE /api/users/me
 * @access  Private
 */
export const deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Delete user's created trips
        await Trip.deleteMany({ creator: userId });

        // 2. Remove user from trips they joined
        await Trip.updateMany(
            { squadMembers: userId },
            { $pull: { squadMembers: userId } }
        );

        // 3. Delete user's messages
        await Message.deleteMany({ sender: userId });

        // 4. Delete user's conversations
        await Conversation.deleteMany({
            participants: userId
        });

        // 5. Delete user's notifications
        await Notification.deleteMany({
            $or: [{ recipient: userId }, { sender: userId }]
        });

        // 6. Delete user's reviews (given and received)
        await Review.deleteMany({
            $or: [{ reviewer: userId }, { reviewee: userId }]
        });

        // 7. Finally, delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};
