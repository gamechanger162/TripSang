import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error'],
        default: 'info'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    imageUrl: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for fetching active announcements
announcementSchema.index({ isActive: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
