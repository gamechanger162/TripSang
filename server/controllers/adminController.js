import { User, GlobalConfig, Trip, Payment } from '../models/index.js';

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
        const updates = req.body;
        const adminUserId = req.user._id;

        // Prevent updating protected fields
        delete updates._id;
        delete updates.stats;
        delete updates.createdAt;
        delete updates.updatedAt;

        const config = await GlobalConfig.updateConfig(updates, adminUserId);

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
