import User from '../models/User.js';
import Trip from '../models/Trip.js';

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
            .sort({ startDate: 1 }); // Sort by upcoming

        // Categorize
        const createdTrips = trips.filter(trip => trip.creator._id.toString() === userId.toString());
        const joinedTrips = trips.filter(trip => trip.creator._id.toString() !== userId.toString());

        res.status(200).json({
            success: true,
            trips,
            createdTrips,
            joinedTrips,
            count: trips.length
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
