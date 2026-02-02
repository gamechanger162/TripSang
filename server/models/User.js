import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ],
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin', 'guide'],
            message: 'Role must be either user, admin, or guide'
        },
        default: 'user'
    },
    mobileNumber: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,15}$/, 'Please provide a valid mobile number'],
        sparse: true, // Allows multiple null values while maintaining unique constraint
        index: true
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    badges: {
        type: [String],
        default: [],
        validate: {
            validator: function (badges) {
                return badges.length <= 20; // Max 20 badges per user
            },
            message: 'Cannot have more than 20 badges'
        }
    },
    profilePicture: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: ''
    },
    gender: {
        type: String,
        enum: {
            values: ['male', 'female', 'transgender', 'prefer-not-to-say'],
            message: 'Gender must be male, female, transgender, or prefer-not-to-say'
        },
        default: 'prefer-not-to-say'
    },
    location: {
        city: String,
        country: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    // Social links
    socialLinks: {
        instagram: String,
        facebook: String,
        twitter: String
    },
    // Referral tracking
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Users blocked by this user
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Subscription Details
    subscription: {
        status: {
            type: String,
            enum: ['active', 'inactive', 'past_due', 'cancelled', 'trial'],
            default: 'inactive'
        },
        planId: String,
        subscriptionId: String,
        currentStart: Date,
        currentEnd: Date,
        trialEnds: Date,
        razorpayCustomerId: String
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for trips created by user
userSchema.virtual('tripsCreated', {
    ref: 'Trip',
    localField: '_id',
    foreignField: 'creator',
    justOne: false
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to add badge
userSchema.methods.addBadge = function (badgeName) {
    if (!this.badges.includes(badgeName)) {
        this.badges.push(badgeName);
    }
    return this.save();
};

// Method to remove badge
userSchema.methods.removeBadge = function (badgeName) {
    this.badges = this.badges.filter(badge => badge !== badgeName);
    return this.save();
};

// Method to block a user
userSchema.methods.blockUser = function (userIdToBlock) {
    if (!this.blockedUsers.includes(userIdToBlock)) {
        this.blockedUsers.push(userIdToBlock);
    }
    return this.save();
};

// Method to unblock a user
userSchema.methods.unblockUser = function (userIdToUnblock) {
    this.blockedUsers = this.blockedUsers.filter(
        id => id.toString() !== userIdToUnblock.toString()
    );
    return this.save();
};

// Method to check if a user is blocked
userSchema.methods.hasBlocked = function (userId) {
    return this.blockedUsers.some(id => id.toString() === userId.toString());
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to find verified users
userSchema.statics.findVerifiedUsers = function () {
    return this.find({ isMobileVerified: true, isEmailVerified: true });
};

const User = mongoose.model('User', userSchema);

export default User;
