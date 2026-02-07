import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    // Alias for recipient (some controllers use 'user')
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['review', 'message', 'trip_invite', 'trip_join', 'trip_accept', 'admin_broadcast', 'friend_request', 'friend_accepted', 'system', 'verification_approved', 'verification_rejected', 'chat_mention', 'new_message'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    metadata: {
        tripId: String,
        reviewId: String,
        messageId: String
    },
    // Generic data field for additional info
    data: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Pre-save hook to normalize recipient/user
notificationSchema.pre('save', function (next) {
    // If user is set but recipient is not, copy user to recipient
    if (this.user && !this.recipient) {
        this.recipient = this.user;
    }
    // If recipient is set but user is not, copy recipient to user
    if (this.recipient && !this.user) {
        this.user = this.recipient;
    }
    next();
});

// Index for getting unread count easily
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

