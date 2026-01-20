import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['review', 'message', 'trip_invite', 'trip_join', 'trip_accept', 'admin_broadcast'],
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
    }
}, {
    timestamps: true
});

// Index for getting unread count easily
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
