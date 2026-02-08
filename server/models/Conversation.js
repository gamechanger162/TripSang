import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        text: {
            type: String,
            default: ''
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map()
    }
}, {
    timestamps: true
});

// Validation: Exactly 2 participants
conversationSchema.pre('save', function (next) {
    if (this.participants.length !== 2) {
        return next(new Error('Conversation must have exactly 2 participants'));
    }
    next();
});

// Compound index for efficient lookups and prevent duplicates
conversationSchema.index(
    { participants: 1 },
    {
        unique: true,
        partialFilterExpression: { 'participants.1': { $exists: true } }
    }
);

// Optimize sorting conversations by latest message
conversationSchema.index({ participants: 1, 'lastMessage.timestamp': -1 });

// Helper method: Get the other participant in the conversation
conversationSchema.methods.getOtherParticipant = function (userId) {
    return this.participants.find(id => id.toString() !== userId.toString());
};

// Helper method: Mark conversation as read for a specific user
conversationSchema.methods.markAsRead = function (userId) {
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
};

// Helper method: Increment unread count for a specific user
conversationSchema.methods.incrementUnread = function (userId) {
    const currentCount = this.unreadCount.get(userId.toString()) || 0;
    this.unreadCount.set(userId.toString(), currentCount + 1);
    return this;
};

// Static method: Find or create conversation between two users
conversationSchema.statics.findOrCreate = async function (user1Id, user2Id) {
    // Ensure consistent ordering to prevent duplicates
    const participants = [user1Id, user2Id].sort();

    let conversation = await this.findOne({
        participants: { $all: participants, $size: 2 }
    }).populate('participants', 'name profilePicture');

    if (!conversation) {
        conversation = await this.create({
            participants,
            unreadCount: new Map([
                [user1Id.toString(), 0],
                [user2Id.toString(), 0]
            ])
        });

        conversation = await conversation.populate('participants', 'name profilePicture');
    }

    return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
