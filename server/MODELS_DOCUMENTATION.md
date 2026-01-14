# 🗄️ TripSang Database Models Documentation

Complete reference for all Mongoose schemas in the TripSang platform.

---

## 📋 Table of Contents
1. [User Model](#user-model)
2. [Trip Model](#trip-model)
3. [GlobalConfig Model](#globalconfig-model)
4. [Payment Model](#payment-model)

---

## 👤 User Model

**File:** `models/User.js`

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | String | ✓ | - | User's full name (2-50 chars) |
| `email` | String | ✓ | - | Unique email address (validated) |
| `password` | String | ✓ | - | Hashed password (bcrypt, min 6 chars) |
| `role` | String | ✓ | 'user' | Role: 'user', 'admin', or 'guide' |
| `mobileNumber` | String | ✗ | - | 10-15 digit phone number |
| `isMobileVerified` | Boolean | ✗ | false | Phone verification status |
| `isEmailVerified` | Boolean | ✗ | false | Email verification status |
| `badges` | Array[String] | ✗ | [] | Achievement badges (max 20) |
| `profilePicture` | String | ✗ | null | Profile image URL |
| `bio` | String | ✗ | '' | User biography (max 500 chars) |
| `location.city` | String | ✗ | - | User's city |
| `location.country` | String | ✗ | - | User's country |
| `isActive` | Boolean | ✗ | true | Account active status |
| `lastLogin` | Date | ✗ | null | Last login timestamp |
| `socialLinks` | Object | ✗ | - | Instagram, Facebook, Twitter |
| `referralCode` | String | ✗ | - | Unique referral code |
| `referredBy` | ObjectId | ✗ | null | Referring user ID |

### Indexes
- `email` (unique)
- `mobileNumber` (sparse unique)
- `role`
- `createdAt`

### Instance Methods

```javascript
// Compare password with hashed version
await user.comparePassword(candidatePassword);

// Add a badge to user
await user.addBadge('Explorer');

// Remove a badge
await user.removeBadge('Explorer');
```

### Static Methods

```javascript
// Find user by email
const user = await User.findByEmail('user@example.com');

// Find all verified users
const verified = await User.findVerifiedUsers();
```

### Virtuals
- `tripsCreated` - Populated trips created by user

### Pre-Save Hooks
- Automatically hashes password using bcrypt before saving
- Only hashes if password is modified

---

## 🗺️ Trip Model

**File:** `models/Trip.js`

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `creator` | ObjectId (User) | ✓ | - | Trip creator reference |
| `title` | String | ✓ | - | Trip title (3-100 chars) |
| `description` | String | ✗ | - | Detailed description (max 2000) |
| `startPoint.name` | String | ✓ | - | Starting location name |
| `startPoint.coordinates` | Object | ✗ | - | {latitude, longitude} |
| `startPoint.address` | String | ✗ | - | Full address |
| `endPoint.name` | String | ✓ | - | Destination name |
| `endPoint.coordinates` | Object | ✗ | - | {latitude, longitude} |
| `endPoint.address` | String | ✗ | - | Full address |
| `startDate` | Date | ✓ | - | Trip start date |
| `endDate` | Date | ✓ | - | Trip end date (≥ startDate) |
| `tags` | Array[String] | ✗ | [] | Tags starting with # (e.g., #Trekking) |
| `coverPhoto` | String | ✗ | null | Cover image URL |
| `status` | String | ✗ | 'active' | 'active', 'completed', 'cancelled', 'draft' |
| `squadMembers` | Array[ObjectId] | ✗ | [] | Array of user IDs |
| `maxSquadSize` | Number | ✗ | 10 | Max squad members (1-100) |
| `budget.min` | Number | ✗ | - | Minimum budget |
| `budget.max` | Number | ✗ | - | Maximum budget |
| `budget.currency` | String | ✗ | 'INR' | Currency code |
| `difficulty` | String | ✗ | 'moderate' | 'easy', 'moderate', 'difficult', 'extreme' |
| `isPublic` | Boolean | ✗ | true | Public visibility |
| `photos` | Array[Object] | ✗ | [] | Trip photos with captions |
| `stats.views` | Number | ✗ | 0 | Total views |
| `stats.likes` | Number | ✗ | 0 | Total likes |
| `stats.shares` | Number | ✗ | 0 | Total shares |
| `likedBy` | Array[ObjectId] | ✗ | [] | Users who liked |

### Indexes
- `creator`, `status`
- `startDate`, `endDate`
- `tags`
- Full-text search on `title`, `startPoint.name`, `endPoint.name`

### Instance Methods

```javascript
// Add squad member
await trip.addSquadMember(userId);

// Remove squad member
await trip.removeSquadMember(userId);

// Increment view count
await trip.incrementViews();

// Toggle like
await trip.toggleLike(userId);
```

### Static Methods

```javascript
// Find active public trips
const trips = await Trip.findActiveTrips();

// Find trips by tag
const trekking = await Trip.findByTag('#Trekking');

// Find upcoming trips
const upcoming = await Trip.findUpcomingTrips();
```

### Virtuals
- `currentSquadSize` - Number of current squad members
- `durationDays` - Trip duration in days
- `isFull` - Boolean if squad is at max capacity

---

## ⚙️ GlobalConfig Model (Master Switchboard)

**File:** `models/GlobalConfig.js`

### Schema Fields

#### Google Ads Configuration
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enableGoogleAds` | Boolean | false | Toggle Google AdSense |
| `googleAdSenseClient` | String | '' | AdSense client ID (ca-pub-...) |
| `googleAdSlots` | Object | - | Ad slot IDs for different pages |

#### Paid Signup Configuration
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enablePaidSignup` | Boolean | false | Enable signup fee |
| `signupFee` | Number | 99 | Signup fee amount |
| `signupFeeCurrency` | String | 'INR' | Currency code |

#### Guide Commission
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `guideCommissionEnabled` | Boolean | false | Enable guide commissions |
| `guideCommissionPercentage` | Number | 10 | Commission % (0-100) |

#### Platform Features
```javascript
features: {
  enableChat: true,
  enableNotifications: true,
  enableEmailNotifications: true,
  enableMobileVerification: true,
  enableReferralSystem: false,
  enableBadgeSystem: true,
  enableReviews: true
}
```

#### Content Moderation
```javascript
moderation: {
  enableAutoModeration: false,
  profanityFilter: true,
  requireApprovalForTrips: false,
  requireApprovalForGuides: true
}
```

#### Platform Limits
```javascript
limits: {
  maxTripsPerUser: 50,
  maxSquadSize: 100,
  maxPhotosPerTrip: 20,
  maxBadgesPerUser: 20
}
```

### Singleton Pattern

Only **ONE** GlobalConfig document can exist in the database.

### Static Methods

```javascript
// Get the global config instance (creates if doesn't exist)
const config = await GlobalConfig.getInstance();

// Update configuration
await GlobalConfig.updateConfig({
  enableGoogleAds: true,
  signupFee: 149
}, adminUserId);
```

### Instance Methods

```javascript
// Toggle any feature
await config.toggleFeature('enableGoogleAds', true);
await config.toggleFeature('features.enableChat', false);

// Update platform statistics
await config.updateStats({
  totalUsers: 1000,
  totalTrips: 500
});
```

---

## 💳 Payment Model

**File:** `models/Payment.js`

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `userId` | ObjectId (User) | ✓ | - | User reference |
| `transactionId` | String | ✓ | - | Unique transaction ID |
| `razorpayOrderId` | String | ✗ | - | Razorpay order ID |
| `razorpayPaymentId` | String | ✗ | - | Razorpay payment ID |
| `razorpaySignature` | String | ✗ | - | Payment signature |
| `amount` | Number | ✓ | - | Payment amount |
| `currency` | String | ✗ | 'INR' | Currency code |
| `status` | String | ✓ | 'pending' | 'pending', 'success', 'failed', 'refunded', 'cancelled' |
| `type` | String | ✓ | - | 'signup_fee', 'guide_commission', etc. |
| `method` | String | ✗ | 'razorpay' | Payment method |
| `tripId` | ObjectId (Trip) | ✗ | null | Associated trip |
| `guideId` | ObjectId (User) | ✗ | null | Guide for commission |
| `commissionPercentage` | Number | ✗ | null | Commission % |

### Payment Types
- `signup_fee` - User registration fee
- `guide_commission` - Commission for guides
- `trip_booking` - Trip booking payment
- `premium_subscription` - Premium features
- `other` - Other payment types

### Indexes
- `userId`, `status`
- `transactionId` (unique)
- `type`, `status`
- `razorpayOrderId`

### Instance Methods

```javascript
// Mark payment as successful
await payment.markAsSuccess({
  razorpayPaymentId: 'pay_xxx',
  razorpaySignature: 'sig_xxx'
});

// Mark payment as failed
await payment.markAsFailed('ERR_001', 'Payment gateway error');

// Process refund
await payment.processRefund(99, 'Customer requested refund');

// Generate invoice
await payment.generateInvoice();
```

### Static Methods

```javascript
// Find user's payments
const payments = await Payment.findUserPayments(userId, 'signup_fee');

// Get revenue statistics
const stats = await Payment.getRevenueStats(startDate, endDate);

// Find pending payments
const pending = await Payment.findPendingPayments();
```

### Virtuals
- `processingTime` - Time between initiation and completion (ms)
- `isSuccessful` - Boolean if status === 'success'

---

## 🚀 Usage Examples

### Creating a New User

```javascript
import { User } from './models/index.js';

const newUser = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securePassword123', // Will be auto-hashed
  role: 'user',
  mobileNumber: '9876543210'
});

// Password is automatically hashed before saving
```

### Creating a Trip

```javascript
import { Trip } from './models/index.js';

const trip = await Trip.create({
  creator: userId,
  title: 'Himalayan Trek',
  startPoint: {
    name: 'Delhi',
    coordinates: { latitude: 28.7041, longitude: 77.1025 }
  },
  endPoint: {
    name: 'Manali',
    coordinates: { latitude: 32.2432, longitude: 77.1892 }
  },
  startDate: new Date('2026-03-15'),
  endDate: new Date('2026-03-22'),
  tags: ['#Trekking', '#Adventure', '#Himalayas'],
  coverPhoto: 'https://example.com/cover.jpg',
  maxSquadSize: 15
});
```

### Updating Global Config

```javascript
import { GlobalConfig } from './models/index.js';

const config = await GlobalConfig.getInstance();

// Enable Google Ads
await config.toggleFeature('enableGoogleAds', true);
config.googleAdSenseClient = 'ca-pub-1234567890123456';
await config.save();

// Enable paid signup
config.enablePaidSignup = true;
config.signupFee = 149;
await config.save();
```

### Recording a Payment

```javascript
import { Payment } from './models/index.js';

const payment = await Payment.create({
  userId: user._id,
  transactionId: `txn_${Date.now()}`,
  razorpayOrderId: 'order_xyz123',
  amount: 99,
  currency: 'INR',
  type: 'signup_fee',
  status: 'pending'
});

// After successful payment
await payment.markAsSuccess({
  razorpayPaymentId: 'pay_abc456',
  razorpaySignature: 'sig_789def'
});
```

---

## 🔍 Indexes Summary

All models are optimized with strategic indexes for:
- **Fast queries** on common search fields
- **Unique constraints** on critical fields (email, transactionId)
- **Compound indexes** for frequently combined queries
- **Full-text search** on Trip model

---

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Password excluded from queries by default
- ✅ Email validation and normalization
- ✅ Input validation on all fields
- ✅ Enum constraints for status fields
- ✅ Referential integrity with ObjectId refs

---

## 📊 Timestamps

All models automatically include:
- `createdAt` - Document creation time
- `updatedAt` - Last modification time

Enabled via `timestamps: true` option.

---

## 🔗 Relationships

```
User
  ├── creates → Trip (one-to-many)
  ├── makes → Payment (one-to-many)
  └── member of → Trip.squadMembers (many-to-many)

Trip
  ├── created by → User (many-to-one)
  └── booked via → Payment (one-to-many)

Payment
  ├── made by → User (many-to-one)
  ├── for → Trip (many-to-one, optional)
  └── to → Guide/User (many-to-one, optional)

GlobalConfig
  └── Singleton (only one document)
```

---

**Models are production-ready and fully integrated with your Express backend! 🎉**
