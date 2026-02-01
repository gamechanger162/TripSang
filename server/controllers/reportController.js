const Report = require('../models/Report');
const User = require('../models/User');

// Create a user report
exports.createUserReport = async (req, res) => {
    try {
        const { reportedUserId, reason, description } = req.body;
        const reportedBy = req.user._id;

        // Validate inputs
        if (!reportedUserId || !reason || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if reported user exists
        const reportedUser = await User.findById(reportedUserId);
        if (!reportedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent self-reporting
        if (reportedUserId === reportedBy.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot report yourself'
            });
        }

        // Check for duplicate reports (same user reporting same person within 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingReport = await Report.findOne({
            reportedUser: reportedUserId,
            reportedBy: reportedBy,
            createdAt: { $gte: oneDayAgo }
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this user recently'
            });
        }

        // Create report
        const report = await Report.create({
            reportedUser: reportedUserId,
            reportedBy,
            reason,
            description
        });

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully. Our team will review it.',
            report
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report'
        });
    }
};

// Get all reports (Admin only)
exports.getAllReports = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const reports = await Report.find(query)
            .populate('reportedUser', 'name email profilePicture')
            .populate('reportedBy', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Report.countDocuments(query);

        res.status(200).json({
            success: true,
            reports,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
};

// Update report status (Admin only)
exports.updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, adminNotes } = req.body;

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        report.status = status;
        if (adminNotes) {
            report.adminNotes = adminNotes;
        }
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();

        await report.save();

        res.status(200).json({
            success: true,
            message: 'Report updated successfully',
            report
        });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update report'
        });
    }
};

// Get reports for a specific user (Admin only)
exports.getUserReports = async (req, res) => {
    try {
        const { userId } = req.params;

        const reports = await Report.find({ reportedUser: userId })
            .populate('reportedBy', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            reports,
            count: reports.length
        });
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user reports'
        });
    }
};
