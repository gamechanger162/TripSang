import mongoose from 'mongoose';

/**
 * GlobalConfig Schema - The Master Switchboard
 * Controls app-wide settings and features
 * This is a singleton model - only one document should exist
 */
const globalConfigSchema = new mongoose.Schema({
    // Google Ads Configuration
    enableGoogleAds: {
        type: Boolean,
        default: false,
        description: 'Toggle Google AdSense on/off across the platform'
    },
    googleAdSenseClient: {
        type: String,
        default: '',
        trim: true,
        validate: {
            validator: function (value) {
                if (!value) return true;
                // Validate AdSense client ID format (ca-pub-xxxxxxxxxxxxxxxx)
                return /^ca-pub-\d{16}$/.test(value);
            },
            message: 'Invalid Google AdSense client ID format'
        }
    },
    googleAdSlots: {
        homepage: String,
        tripDetails: String,
        profile: String,
        sidebar: String
    },

    // Paid Signup Configuration
    enablePaidSignup: {
        type: Boolean,
        default: false,
        description: 'Enable/disable signup fee requirement'
    },
    signupFee: {
        type: Number,
        default: 99,
        min: [0, 'Signup fee cannot be negative'],
        max: [10000, 'Signup fee cannot exceed 10000']
    },
    signupFeeCurrency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP']
    },

    // One Month Premium Price (Dynamic Pricing)
    oneMonthPremiumPrice: {
        type: Number,
        default: 3000, // 30.00 INR
        min: [100, 'Price cannot be less than 1.00'],
        max: [100000, 'Price cannot exceed 1000.00']
    },

    // Payment Gateway Configuration
    razorpayEnabled: {
        type: Boolean,
        default: true
    },

    // Guide Commission Configuration
    guideCommissionEnabled: {
        type: Boolean,
        default: false
    },
    guideCommissionPercentage: {
        type: Number,
        default: 10,
        min: [0, 'Commission cannot be negative'],
        max: [100, 'Commission cannot exceed 100%']
    },

    // Platform Features
    features: {
        enableChat: {
            type: Boolean,
            default: true
        },
        enableNotifications: {
            type: Boolean,
            default: true
        },
        enableEmailNotifications: {
            type: Boolean,
            default: true
        },
        enableMobileVerification: {
            type: Boolean,
            default: true
        },
        enableReferralSystem: {
            type: Boolean,
            default: false
        },
        enableBadgeSystem: {
            type: Boolean,
            default: true
        },
        enableReviews: {
            type: Boolean,
            default: true
        }
    },

    // Content Moderation
    moderation: {
        enableAutoModeration: {
            type: Boolean,
            default: false
        },
        profanityFilter: {
            type: Boolean,
            default: true
        },
        requireApprovalForTrips: {
            type: Boolean,
            default: false
        },
        requireApprovalForGuides: {
            type: Boolean,
            default: true
        }
    },

    // Limits and Restrictions
    limits: {
        maxTripsPerUser: {
            type: Number,
            default: 50
        },
        maxSquadSize: {
            type: Number,
            default: 100
        },
        maxPhotosPerTrip: {
            type: Number,
            default: 20
        },
        maxBadgesPerUser: {
            type: Number,
            default: 20
        }
    },

    // Maintenance Mode
    maintenanceMode: {
        enabled: {
            type: Boolean,
            default: false
        },
        message: {
            type: String,
            default: 'We are currently under maintenance. Please check back soon!'
        },
        estimatedEnd: Date
    },

    // Platform Statistics (Read-only, updated by system)
    stats: {
        totalUsers: {
            type: Number,
            default: 0
        },
        totalTrips: {
            type: Number,
            default: 0
        },
        totalRevenue: {
            type: Number,
            default: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },

    // SEO and Metadata
    seo: {
        siteName: {
            type: String,
            default: 'TripSang - Travel Social Network'
        },
        siteDescription: {
            type: String,
            default: 'Connect with travelers, share experiences, and discover amazing destinations'
        },
        metaKeywords: {
            type: [String],
            default: ['travel', 'social network', 'trips', 'tourism', 'adventure']
        }
    },

    // Contact and Support
    contact: {
        supportEmail: {
            type: String,
            default: 'support@tripsang.com'
        },
        businessEmail: {
            type: String,
            default: 'business@tripsang.com'
        },
        phone: String
    },

    // Version tracking
    configVersion: {
        type: String,
        default: '1.0.0'
    },

    // Last modified by (admin user)
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    collection: 'globalconfig' // Ensure only one collection
});

// Singleton pattern - only one config document should exist
globalConfigSchema.statics.getInstance = async function () {
    let config = await this.findOne();

    if (!config) {
        // Create default config if none exists
        config = await this.create({});
        console.log('✅ Created default global configuration');
    }

    return config;
};

// Method to safely update configuration
globalConfigSchema.statics.updateConfig = async function (updates, adminUserId) {
    const config = await this.getInstance();

    Object.keys(updates).forEach(key => {
        if (key !== '_id' && key !== 'stats') { // Prevent updating protected fields
            config[key] = updates[key];
        }
    });

    if (adminUserId) {
        config.lastModifiedBy = adminUserId;
    }

    return config.save();
};

// Method to toggle feature
globalConfigSchema.methods.toggleFeature = function (featurePath, value) {
    // Support nested paths like 'features.enableChat'
    const keys = featurePath.split('.');
    let current = this;

    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }

    const finalKey = keys[keys.length - 1];
    current[finalKey] = value !== undefined ? value : !current[finalKey];

    return this.save();
};

// Method to update stats
globalConfigSchema.methods.updateStats = async function (stats) {
    this.stats = {
        ...this.stats,
        ...stats,
        lastUpdated: new Date()
    };
    return this.save();
};

// Prevent multiple config documents
globalConfigSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        if (count > 0) {
            throw new Error('Only one GlobalConfig document is allowed. Use updateConfig() instead.');
        }
    }
    next();
});

const GlobalConfig = mongoose.model('GlobalConfig', globalConfigSchema);

export default GlobalConfig;
