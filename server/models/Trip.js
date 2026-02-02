import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Trip must have a creator'],
        index: true
    },
    tripCode: {
        type: String,
        unique: true,
        uppercase: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Trip title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    startPoint: {
        type: {
            name: {
                type: String,
                required: [true, 'Start point name is required']
            },
            coordinates: {
                latitude: Number,
                longitude: Number
            },
            address: String
        },
        required: [true, 'Start point is required']
    },
    endPoint: {
        type: {
            name: {
                type: String,
                required: [true, 'End point name is required']
            },
            coordinates: {
                latitude: Number,
                longitude: Number
            },
            address: String
        },
        required: [true, 'End point is required']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        index: true
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function (value) {
                return value >= this.startDate;
            },
            message: 'End date must be after or equal to start date'
        }
    },
    tags: {
        type: [String],
        default: [],
        validate: {
            validator: function (tags) {
                // Validate each tag starts with # and is alphanumeric
                return tags.every(tag => /^#[a-zA-Z0-9_]+$/.test(tag));
            },
            message: 'Tags must start with # and contain only alphanumeric characters'
        },
        index: true
    },
    coverPhoto: {
        type: String,
        default: null,
        validate: {
            validator: function (url) {
                if (!url) return true;
                // Basic URL validation
                return /^https?:\/\/.+/.test(url);
            },
            message: 'Cover photo must be a valid URL'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'completed', 'cancelled', 'draft'],
            message: 'Status must be active, completed, cancelled, or draft'
        },
        default: 'active',
        index: true
    },
    squadMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxSquadSize: {
        type: Number,
        default: 10,
        min: [1, 'Squad must have at least 1 member'],
        max: [100, 'Squad cannot exceed 100 members']
    },
    budget: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: 'INR'
        }
    },
    difficulty: {
        type: String,
        enum: ['easy', 'moderate', 'difficult', 'extreme'],
        default: 'moderate'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    photos: [{
        url: String,
        caption: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Trip statistics
    stats: {
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        }
    },
    // Users who liked this trip
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Collaborative Map Waypoints
    waypoints: [{
        lat: Number,
        lng: Number,
        name: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Generate unique trip code before saving
tripSchema.pre('save', async function (next) {
    if (!this.tripCode) {
        // Generate a unique 6-character code
        // Using uppercase letters and numbers (excluding confusing ones like 0, O, I, L, 1)
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        let code;
        let isUnique = false;

        while (!isUnique) {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // Check if code already exists
            const existing = await mongoose.model('Trip').findOne({ tripCode: code });
            if (!existing) {
                isUnique = true;
            }
        }

        this.tripCode = code;
    }
    next();
});

// Indexes for performance
tripSchema.index({ creator: 1, status: 1 });
tripSchema.index({ startDate: 1, endDate: 1 });
tripSchema.index({ 'startPoint.name': 'text', 'endPoint.name': 'text', title: 'text' });

// Virtual for squad size
tripSchema.virtual('currentSquadSize').get(function () {
    return this.squadMembers ? this.squadMembers.length : 0;
});

// Virtual for trip duration in days
tripSchema.virtual('durationDays').get(function () {
    if (!this.startDate || !this.endDate) return 0;
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual to check if trip is full
tripSchema.virtual('isFull').get(function () {
    return this.squadMembers ? this.squadMembers.length >= this.maxSquadSize : false;
});

// Method to add squad member
tripSchema.methods.addSquadMember = async function (userId) {
    if (this.squadMembers.includes(userId)) {
        throw new Error('User is already a squad member');
    }

    if (this.squadMembers.length >= this.maxSquadSize) {
        throw new Error('Squad is full');
    }

    this.squadMembers.push(userId);
    return this.save();
};

// Method to remove squad member
tripSchema.methods.removeSquadMember = async function (userId) {
    this.squadMembers = this.squadMembers.filter(
        memberId => memberId.toString() !== userId.toString()
    );
    return this.save();
};

// Method to increment views
tripSchema.methods.incrementViews = function () {
    this.stats.views += 1;
    return this.save();
};

// Method to toggle like
tripSchema.methods.toggleLike = function (userId) {
    const index = this.likedBy.indexOf(userId);

    if (index > -1) {
        // Unlike
        this.likedBy.splice(index, 1);
        this.stats.likes = Math.max(0, this.stats.likes - 1);
    } else {
        // Like
        this.likedBy.push(userId);
        this.stats.likes += 1;
    }

    return this.save();
};

// Static method to find active trips
// Static method to find active trips
tripSchema.statics.findActiveTrips = function () {
    return this.find({ status: 'active', isPublic: true })
        .populate('creator', 'name profilePicture gender')
        .sort({ startDate: 1 });
};

// Static method to find trips by tag
tripSchema.statics.findByTag = function (tag) {
    return this.find({ tags: tag, status: 'active', isPublic: true })
        .populate('creator', 'name profilePicture gender');
};

// Static method to find upcoming trips
tripSchema.statics.findUpcomingTrips = function () {
    return this.find({
        status: 'active',
        isPublic: true,
        startDate: { $gte: new Date() }
    })
        .populate('creator', 'name profilePicture gender')
        .sort({ startDate: 1 });
};

// Static method to find trip by code
tripSchema.statics.findByCode = function (code) {
    return this.findOne({ tripCode: code.toUpperCase() })
        .populate('creator', 'name profilePicture gender badges bio')
        .populate('squadMembers', 'name profilePicture');
};

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
