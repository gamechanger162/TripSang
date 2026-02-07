// TripSang Database Migration Script
// Run this in MongoDB Compass or Atlas Web Shell

// STEP 1: Connect to 'tripsang' database
use tripsang;

// STEP 2: Add authProviders to all existing users without it
db.users.updateMany(
    { authProviders: { $exists: false } },
    [{
        $set: {
            authProviders: [{
                provider: 'email',
                providerId: '$email',
                verified: true,
                linkedAt: new Date()
            }]
        }
    }]
);

// STEP 3: Add phone provider for users with verified mobile numbers
db.users.updateMany(
    {
        isMobileVerified: true,
        mobileNumber: { $exists: true, $ne: null },
        'authProviders.provider': { $ne: 'phone' }
    },
    [{
        $set: {
            authProviders: {
                $concatArrays: [
                    '$authProviders',
                    [{
                        provider: 'phone',
                        providerId: '$mobileNumber',
                        verified: true,
                        linkedAt: new Date()
                    }]
                ]
            }
        }
    }]
);

// STEP 4: Verify migration - show one user
print("Migration complete! Checking a user:");
db.users.findOne({}, { name: 1, email: 1, mobileNumber: 1, authProviders: 1 });

// STEP 5: Count users with authProviders
print("\nTotal users with authProviders:");
db.users.countDocuments({ authProviders: { $exists: true } });
