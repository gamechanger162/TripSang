import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending',
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ recipient: 1, status: 1 });
friendshipSchema.index({ requester: 1, status: 1 });

// Static method to find friendship between two users
friendshipSchema.statics.findFriendship = async function (user1Id, user2Id) {
    return this.findOne({
        $or: [
            { requester: user1Id, recipient: user2Id },
            { requester: user2Id, recipient: user1Id }
        ]
    });
};

// Static method to get all friends of a user
friendshipSchema.statics.getFriends = async function (userId) {
    const friendships = await this.find({
        $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' }
        ]
    })
        .populate('requester', 'name profilePicture badges')
        .populate('recipient', 'name profilePicture badges');

    // Map to get friend details
    return friendships.map(f => {
        const friend = f.requester._id.toString() === userId.toString()
            ? f.recipient
            : f.requester;
        return {
            _id: friend._id,
            name: friend.name,
            profilePicture: friend.profilePicture,
            badges: friend.badges,
            friendsSince: f.updatedAt
        };
    });
};

// Static method to get pending requests received
friendshipSchema.statics.getPendingRequests = async function (userId) {
    return this.find({
        recipient: userId,
        status: 'pending'
    })
        .populate('requester', 'name profilePicture badges')
        .sort({ createdAt: -1 });
};

// Static method to get sent requests
friendshipSchema.statics.getSentRequests = async function (userId) {
    return this.find({
        requester: userId,
        status: 'pending'
    })
        .populate('recipient', 'name profilePicture badges')
        .sort({ createdAt: -1 });
};

// Static method to get friends count
friendshipSchema.statics.getFriendsCount = async function (userId) {
    return this.countDocuments({
        $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' }
        ]
    });
};

const Friendship = mongoose.model('Friendship', friendshipSchema);

export default Friendship;
