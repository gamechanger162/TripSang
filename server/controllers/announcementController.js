import Announcement from '../models/Announcement.js';

/**
 * Create new announcement
 * POST /api/admin/announcements
 */
export const createAnnouncement = async (req, res) => {
    try {
        const { title, message, type, expiresAt, imageUrl } = req.body;

        const announcement = await Announcement.create({
            title,
            message,
            type,
            expiresAt,
            imageUrl,
            createdBy: req.user._id,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            announcement
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create announcement',
            error: error.message
        });
    }
};

/**
 * Get all announcements (admin only)
 * GET /api/admin/announcements
 */
export const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            announcements
        });
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch announcements',
            error: error.message
        });
    }
};

/**
 * Get active announcement (public)
 * GET /api/announcements/active
 */
export const getActiveAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findOne({
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            announcement
        });
    } catch (error) {
        console.error('Get active announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch announcement',
            error: error.message
        });
    }
};

/**
 * Update announcement
 * PUT /api/admin/announcements/:id
 */
export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, type, isActive, expiresAt, imageUrl } = req.body;

        const announcement = await Announcement.findByIdAndUpdate(
            id,
            { title, message, type, isActive, expiresAt, imageUrl },
            { new: true, runValidators: true }
        );

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Announcement updated successfully',
            announcement
        });
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update announcement',
            error: error.message
        });
    }
};

/**
 * Delete announcement
 * DELETE /api/admin/announcements/:id
 */
export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findByIdAndDelete(id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete announcement',
            error: error.message
        });
    }
};

/**
 * Toggle announcement active status
 * PATCH /api/admin/announcements/:id/toggle
 */
export const toggleAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await Announcement.findById(id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        announcement.isActive = !announcement.isActive;
        await announcement.save();

        res.status(200).json({
            success: true,
            message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'}`,
            announcement
        });
    } catch (error) {
        console.error('Toggle announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle announcement',
            error: error.message
        });
    }
};
