import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Community name is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Community name must be at least 3 characters'],
        maxlength: [50, 'Community name cannot exceed 50 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    category: {
        type: String,
        enum: {
            values: ['Bikers', 'Photographers', 'Trekkers', 'Foodies', 'Adventurers', 'Backpackers', 'Luxury', 'Solo', 'Culture', 'Beach', 'Mountains', 'Other'],
            message: 'Invalid category'
        },
        default: 'Other'
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    adminOnlyMessages: {
        type: Boolean,
        default: false
    },
    coverImage: {
        type: String,
        default: null
    },
    logo: {
        type: String,
        default: null
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingRequests: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastMessage: {
        message: String,
        senderName: String,
        timestamp: Date,
        type: {
            type: String,
            enum: ['text', 'image'],
            default: 'text'
        }
    },
    memberCount: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Add creator as first member on save
communitySchema.pre('save', function (next) {
    if (this.isNew && !this.members.includes(this.creator)) {
        this.members.push(this.creator);
        this.memberCount = this.members.length;
    }
    next();
});

// Update member count when members array changes
communitySchema.pre('save', function (next) {
    if (this.isModified('members')) {
        this.memberCount = this.members.length;
    }
    next();
});

// Index for efficient queries
communitySchema.index({ name: 'text', description: 'text' });
communitySchema.index({ category: 1 });
communitySchema.index({ isPrivate: 1 });
communitySchema.index({ creator: 1 });
communitySchema.index({ members: 1 });

const Community = mongoose.model('Community', communitySchema);

export default Community;
