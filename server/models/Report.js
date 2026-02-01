const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['spam', 'harassment', 'fake_profile', 'inappropriate_content', 'scam', 'other'],
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        maxlength: 1000
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date
}, {
    timestamps: true
});

// Indexes for performance
reportSchema.index({ reportedUser: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
