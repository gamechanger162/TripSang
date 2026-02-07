import mongoose from 'mongoose';

const communityMessageSchema = new mongoose.Schema({
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    imageUrl: {
        type: String,
        default: null
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommunityMessage',
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient message retrieval
communityMessageSchema.index({ communityId: 1, timestamp: -1 });
communityMessageSchema.index({ sender: 1 });

const CommunityMessage = mongoose.model('CommunityMessage', communityMessageSchema);

export default CommunityMessage;
