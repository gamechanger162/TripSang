import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'admin'],
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderProfilePicture: {
        type: String,
        default: null
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    type: {
        type: String,
        enum: ['text', 'image', 'system'],
        default: 'text'
    },
    imageUrl: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const supportChatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
        index: true
    },
    subject: {
        type: String,
        default: 'General Support',
        trim: true,
        maxlength: 200
    },
    messages: [supportMessageSchema],
    lastMessage: {
        text: { type: String, default: '' },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderRole: { type: String, enum: ['user', 'admin'] },
        timestamp: { type: Date, default: Date.now }
    },
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    closedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for finding open chats by user
supportChatSchema.index({ userId: 1, status: 1 });
// Index for admin listing sorted by recent activity
supportChatSchema.index({ status: 1, 'lastMessage.timestamp': -1 });

const SupportChat = mongoose.model('SupportChat', supportChatSchema);

export default SupportChat;
