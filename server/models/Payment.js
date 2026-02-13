import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    transactionId: {
        type: String,
        required: [true, 'Transaction ID is required'],
        unique: true,
        trim: true,
        index: true
    },
    razorpayOrderId: {
        type: String,
        trim: true,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        trim: true
    },
    razorpaySignature: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true,
        enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    status: {
        type: String,
        required: [true, 'Payment status is required'],
        enum: {
            values: ['pending', 'success', 'failed', 'refunded', 'cancelled'],
            message: 'Invalid payment status'
        },
        default: 'pending',
        index: true
    },
    type: {
        type: String,
        required: [true, 'Payment type is required'],
        enum: {
            values: ['signup_fee', 'guide_commission', 'trip_booking', 'premium_subscription', 'one_time_premium', 'other'],
            message: 'Invalid payment type'
        },
        index: true
    },
    // Payment method details
    method: {
        type: String,
        enum: ['razorpay', 'upi', 'card', 'netbanking', 'wallet', 'other'],
        default: 'razorpay'
    },
    // Associated trip (if type is guide_commission or trip_booking)
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        default: null
    },
    // For guide commissions
    guideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    commissionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    // Payment metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceType: String,
        location: {
            city: String,
            country: String
        }
    },
    // Refund information
    refund: {
        isRefunded: {
            type: Boolean,
            default: false
        },
        refundAmount: {
            type: Number,
            default: 0
        },
        refundReason: String,
        refundDate: Date,
        refundTransactionId: String
    },
    // Error tracking
    error: {
        code: String,
        message: String,
        timestamp: Date
    },
    // Invoice details
    invoice: {
        invoiceNumber: String,
        invoiceUrl: String,
        generatedAt: Date
    },
    // Webhook data from Razorpay
    webhookData: mongoose.Schema.Types.Mixed,
    // Payment date tracking
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    },
    // Notes for admin
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ type: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for processing time
paymentSchema.virtual('processingTime').get(function () {
    if (!this.completedAt || !this.initiatedAt) return null;
    return this.completedAt - this.initiatedAt; // in milliseconds
});

// Virtual to check if payment is successful
paymentSchema.virtual('isSuccessful').get(function () {
    return this.status === 'success';
});

// Method to mark payment as successful
paymentSchema.methods.markAsSuccess = function (razorpayData = {}) {
    this.status = 'success';
    this.completedAt = new Date();

    if (razorpayData.razorpayPaymentId) {
        this.razorpayPaymentId = razorpayData.razorpayPaymentId;
    }
    if (razorpayData.razorpaySignature) {
        this.razorpaySignature = razorpayData.razorpaySignature;
    }

    return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = function (errorCode, errorMessage) {
    this.status = 'failed';
    this.completedAt = new Date();
    this.error = {
        code: errorCode,
        message: errorMessage,
        timestamp: new Date()
    };

    return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function (refundAmount, reason) {
    if (this.status !== 'success') {
        throw new Error('Only successful payments can be refunded');
    }

    if (refundAmount > this.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
    }

    this.status = 'refunded';
    this.refund = {
        isRefunded: true,
        refundAmount: refundAmount || this.amount,
        refundReason: reason,
        refundDate: new Date(),
        refundTransactionId: `refund_${this.transactionId}`
    };

    return this.save();
};

// Method to generate invoice
paymentSchema.methods.generateInvoice = function () {
    if (this.status !== 'success') {
        throw new Error('Cannot generate invoice for unsuccessful payment');
    }

    const invoiceNumber = `INV-${Date.now()}-${this.userId.toString().slice(-6)}`;

    this.invoice = {
        invoiceNumber,
        invoiceUrl: `/api/invoices/${invoiceNumber}`,
        generatedAt: new Date()
    };

    return this.save();
};

// Static method to find user payments
paymentSchema.statics.findUserPayments = function (userId, type = null) {
    const query = { userId };
    if (type) query.type = type;

    return this.find(query).sort({ createdAt: -1 });
};

// Static method to get revenue stats
paymentSchema.statics.getRevenueStats = async function (startDate, endDate) {
    const match = {
        status: 'success',
        completedAt: {
            $gte: startDate || new Date(0),
            $lte: endDate || new Date()
        }
    };

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$type',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 },
                averageAmount: { $avg: '$amount' }
            }
        }
    ]);

    return stats;
};

// Static method to find pending payments
paymentSchema.statics.findPendingPayments = function () {
    return this.find({
        status: 'pending',
        initiatedAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
    }).populate('userId', 'name email');
};

// Pre-save hook to set completedAt
paymentSchema.pre('save', function (next) {
    if (this.isModified('status') && ['success', 'failed', 'cancelled'].includes(this.status)) {
        if (!this.completedAt) {
            this.completedAt = new Date();
        }
    }
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
