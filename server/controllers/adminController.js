import { User, GlobalConfig, Trip, Payment, Notification } from '../models/index.js';
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from '../utils/email.js';

/**
 * Get Global Configuration
 * GET /api/admin/config
 */
export const getConfig = async (req, res) => {
    try {
        const config = await GlobalConfig.getInstance();

        res.status(200).json({
            success: true,
            config
        });
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch configuration.',
            error: error.message
        });
    }
};

/**
 * Update Global Configuration
 * PUT /api/admin/config
 */
export const updateConfig = async (req, res) => {
    try {
        const adminUserId = req.user._id;
        // Explicitly pick allowed fields
        const allowedFields = {
            enableGoogleAds: req.body.enableGoogleAds,
            googleAdSenseClient: req.body.googleAdSenseClient,
            enablePaidSignup: req.body.enablePaidSignup,
            signupFee: req.body.signupFee,
            signupFeeCurrency: req.body.signupFeeCurrency,
            razorpayPlanId: req.body.razorpayPlanId, // Added support for updating plan ID
            oneMonthPremiumPrice: req.body.oneMonthPremiumPrice, // Dynamic Pricing
            'features.enableChat': req.body['features.enableChat'], // Support nested toggles if needed
            // Add other feature toggles if they are sent in bulk, but dashboard sends specific structure
        };

        // Remove undefined keys
        Object.keys(allowedFields).forEach(key => allowedFields[key] === undefined && delete allowedFields[key]);

        const config = await GlobalConfig.updateConfig(allowedFields, adminUserId);

        res.status(200).json({
            success: true,
            message: 'Configuration updated successfully.',
            config
        });
    } catch (error) {
        console.error('Update config error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update configuration.',
            error: error.message
        });
    }
};

/**
 * Toggle specific feature
 * PATCH /api/admin/config/toggle/:feature
 */
export const toggleFeature = async (req, res) => {
    try {
        const { feature } = req.params;
        const { value } = req.body;

        const config = await GlobalConfig.getInstance();
        await config.toggleFeature(feature, value);

        res.status(200).json({
            success: true,
            message: `Feature '${feature}' toggled successfully.`,
            config
        });
    } catch (error) {
        console.error('Toggle feature error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle feature.',
            error: error.message
        });
    }
};

/**
 * Get all users with pagination
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filters
        const filters = {};
        if (req.query.role) filters.role = req.query.role;
        if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
        if (req.query.isMobileVerified !== undefined) {
            filters.isMobileVerified = req.query.isMobileVerified === 'true';
        }
        if (req.query.search) {
            filters.$or = [
                { name: new RegExp(req.query.search, 'i') },
                { email: new RegExp(req.query.search, 'i') }
            ];
        }

        // Get users
        const users = await User.find(filters)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count
        const total = await User.countDocuments(filters);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                usersPerPage: limit
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users.',
            error: error.message
        });
    }
};

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select('-password')
            .populate('tripsCreated');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Get user statistics
        const tripCount = await Trip.countDocuments({ creator: id });
        const paymentTotal = await Payment.aggregate([
            { $match: { userId: user._id, status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const stats = {
            totalTrips: tripCount,
            totalSpent: paymentTotal.length > 0 ? paymentTotal[0].total : 0
        };

        res.status(200).json({
            success: true,
            user,
            stats
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user.',
            error: error.message
        });
    }
};

/**
 * Block/Unblock user
 * PUT /api/admin/users/:id/block
 */
export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { block, reason } = req.body;

        // Prevent admin from blocking themselves
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot block yourself.'
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Prevent blocking other admins
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot block admin users.'
            });
        }

        user.isActive = !block;
        await user.save();

        // TODO: Log the action with reason
        console.log(`User ${user.email} ${block ? 'blocked' : 'unblocked'} by admin ${req.user.email}. Reason: ${reason || 'N/A'}`);

        res.status(200).json({
            success: true,
            message: `User ${block ? 'blocked' : 'unblocked'} successfully.`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status.',
            error: error.message
        });
    }
};

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'admin', 'guide'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be user, admin, or guide.'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        console.log(`User ${user.email} role updated to ${role} by admin ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'User role updated successfully.',
            user
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role.',
            error: error.message
        });
    }
};

/**
 * Get platform statistics
 * GET /api/admin/stats
 */
export const getPlatformStats = async (req, res) => {
    try {
        // Get counts
        const totalUsers = await User.countDocuments();
        const totalTrips = await Trip.countDocuments();
        const activeTrips = await Trip.countDocuments({ status: 'active' });
        const totalPayments = await Payment.countDocuments({ status: 'success' });

        // Get revenue
        const revenueData = await Payment.aggregate([
            { $match: { status: 'success' } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const revenue = revenueData.reduce((acc, item) => {
            acc[item._id] = {
                total: item.total,
                count: item.count
            };
            return acc;
        }, {});

        const totalRevenue = revenueData.reduce((sum, item) => sum + item.total, 0);

        // User statistics
        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent users
        const recentUsers = await User.find()
            .select('name email createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    byRole: usersByRole
                },
                trips: {
                    total: totalTrips,
                    active: activeTrips
                },
                payments: {
                    total: totalPayments,
                    revenue: totalRevenue,
                    byType: revenue
                },
                recentUsers
            }
        });
    } catch (error) {
        console.error('Get platform stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform statistics.',
            error: error.message
        });
    }
};

/**
 * Get all trips with pagination and filtering
 * GET /api/admin/trips
 */
export const getAllTrips = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filters = {};
        if (req.query.status) {
            filters.status = req.query.status;
        }

        const trips = await Trip.find(filters)
            .populate('creator', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Trip.countDocuments(filters);

        res.status(200).json({
            success: true,
            trips,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalTrips: total,
                limit
            }
        });
    } catch (error) {
        console.error('Get all trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trips',
            error: error.message
        });
    }
};

/**
 * Delete a trip (Admin override)
 * DELETE /api/admin/trips/:id
 */
export const deleteTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const trip = await Trip.findByIdAndDelete(id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Notify trip creator
        const io = req.app.get('io');
        if (io) {
            const { Notification } = await import('../models/index.js');

            await Notification.create({
                recipient: trip.creator,
                title: 'Trip Removed by Admin',
                message: `Your trip "${trip.title}" was removed by an administrator. Reason: ${reason || 'Violation of terms'}`,
                type: 'system',
                link: '/dashboard',
                sender: req.user._id // Admin ID
            });

            io.to(`user_${trip.creator}`).emit('new_notification', {
                title: 'Trip Removed',
                message: `Your trip "${trip.title}" was removed.`,
                type: 'system'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Trip deleted successfully'
        });
    } catch (error) {
        console.error('Delete trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete trip',
            error: error.message
        });
    }
};

/**
 * Grant Premium Membership manually
 * POST /api/admin/users/:id/grant-premium
 */
export const grantPremium = async (req, res) => {
    try {
        const { id } = req.params;
        const { durationDays = 30 } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + parseInt(durationDays));

        user.subscription = {
            status: 'active',
            currentStart: startDate,
            currentEnd: endDate,
            trialEnds: user.subscription.trialEnds // Preserve trial history
        };

        if (!user.badges.includes('Premium')) {
            user.badges.push('Premium');
        }

        await user.save();

        // Log this action as a system notification or audit log if needed
        console.log(`Admin ${req.user.email} granted premium to ${user.email} for ${durationDays} days`);

        res.status(200).json({
            success: true,
            message: `Granted premium for ${durationDays} days successfully.`,
            user: {
                _id: user._id,
                subscription: user.subscription,
                badges: user.badges
            }
        });

    } catch (error) {
        console.error('Grant premium error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to grant premium status.',
            error: error.message
        });
    }
};

/**
 * Get pending verification requests
 * GET /api/admin/verify-requests
 */
export const getVerificationRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const requests = await User.find({ verificationStatus: 'pending' })
            .select('name email profilePicture idDocumentFront idDocumentBack idType verificationStatus createdAt') // Select specific fields
            .sort({ createdAt: 1 }) // Oldest first
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments({ verificationStatus: 'pending' });

        res.status(200).json({
            success: true,
            requests,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRequests: total,
                limit
            }
        });
    } catch (error) {
        console.error('Get verification requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch verification requests'
        });
    }
};

/**
 * Handle verification action (Approve/Reject)
 * POST /api/admin/verify-action
 */
export const handleVerificationAction = async (req, res) => {
    try {
        const { userId, action, reason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (action === 'approve') {
            user.verificationStatus = 'verified';
            // Manually add badge to avoid race condition with addBadge method
            if (!user.badges.includes('Verified Traveler')) {
                user.badges.push('Verified Traveler');
            }
            user.rejectionReason = '';

            // Notify user (In-app notification)
            try {
                await Notification.create({
                    recipient: user._id,
                    title: 'Verification Approved! 🎉',
                    message: 'Congratulations! Your identity has been verified. You now have the blue tick badge.',
                    type: 'verification_approved',
                    link: '/profile',
                    sender: req.user._id
                });

                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${user._id}`).emit('new_notification', {
                        title: 'Verification Approved!',
                        message: 'Your identity has been verified.',
                        type: 'verification_approved'
                    });
                }

                // Send email notification
                if (user.email) {
                    sendVerificationApprovedEmail(user.email, user.name).catch(err =>
                        console.error('Failed to send verification approved email:', err)
                    );
                }
            } catch (notifError) {
                console.error('Notification creation error:', notifError);
                // Continue even if notification fails
            }

        } else if (action === 'reject') {
            user.verificationStatus = 'rejected';
            user.rejectionReason = reason || 'Document authentication failed';
            // Keep document URLs for audit/re-evaluation purposes

            // Notify user
            try {
                await Notification.create({
                    recipient: user._id,
                    title: 'Verification Rejected',
                    message: `Your verification request was rejected. Reason: ${reason || 'Documents unclear'}. Please try again.`,
                    type: 'verification_rejected',
                    link: '/verify/id',
                    sender: req.user._id,
                    data: { rejectionReason: reason || 'Documents unclear' }
                });

                const io = req.app.get('io');
                if (io) {
                    io.to(`user_${user._id}`).emit('new_notification', {
                        title: 'Verification Rejected',
                        message: `Your verification was rejected: ${reason || 'Documents unclear'}`,
                        type: 'verification_rejected'
                    });
                }

                // Send email notification with rejection reason
                if (user.email) {
                    sendVerificationRejectedEmail(user.email, user.name, reason || 'Documents unclear').catch(err =>
                        console.error('Failed to send verification rejected email:', err)
                    );
                }
            } catch (notifError) {
                console.error('Notification creation error:', notifError);
                // Continue even if notification fails
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: `User verification ${action}ed successfully`,
            user: {
                _id: user._id,
                verificationStatus: user.verificationStatus
            }
        });

    } catch (error) {
        console.error('Handle verification action error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process verification action'
        });
    }
};
