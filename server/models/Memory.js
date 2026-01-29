import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: false, // Changed from true
        index: true
    },
    locationName: {
        type: String, // For posts not linked to a specific trip
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        maxlength: 2000
    },
    photos: [{
        url: {
            type: String,
            required: true
        },
        caption: {
            type: String,
            maxlength: 200
        }
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index for efficient queries
memorySchema.index({ trip: 1, createdAt: -1 });

// Virtual for like count
memorySchema.virtual('likeCount').get(function () {
    return this.likes?.length || 0;
});

// Virtual for comment count
memorySchema.virtual('commentCount').get(function () {
    return this.comments?.length || 0;
});

// Ensure virtuals are included in JSON
memorySchema.set('toJSON', { virtuals: true });
memorySchema.set('toObject', { virtuals: true });

const Memory = mongoose.model('Memory', memorySchema);

export default Memory;
