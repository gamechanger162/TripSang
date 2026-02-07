// Migration script - FIXED to use correct database
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Add database name to connection string
const MONGODB_URI = process.env.MONGODB_URI.replace('/?', '/tripsang?');

async function runMigration() {
    try {
        console.log('Connecting to MongoDB...');
        console.log('Connection string:', MONGODB_URI?.substring(0, 50) + '...\n');

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('Database name:', mongoose.connection.db.databaseName, '\n');

        const db = mongoose.connection.db;

        // First, check what we have
        const totalUsers = await db.collection('users').countDocuments();
        console.log(`Total users found: ${totalUsers}\n`);

        if (totalUsers === 0) {
            console.log('⚠️  No users found. Make sure you are connected to the correct database.');
            return;
        }

        // Show sample user before migration
        const sampleBefore = await db.collection('users').findOne({}, { projection: { email: 1, authProviders: 1 } });
        console.log('Sample user BEFORE migration:');
        console.log(JSON.stringify(sampleBefore, null, 2), '\n');

        // Migration 1: Add authProviders to users without it
        console.log('Step 1: Adding authProviders to existing users...');
        const result1 = await db.collection('users').updateMany(
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
        console.log(`✅ Updated ${result1.modifiedCount} users with email provider\n`);

        // Migration 2: Add phone provider to verified users
        console.log('Step 2: Adding phone provider to verified users...');
        const result2 = await db.collection('users').updateMany(
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
        console.log(`✅ Updated ${result2.modifiedCount} users with phone provider\n`);

        // Show sample user after migration
        const sampleAfter = await db.collection('users').findOne({}, { projection: { email: 1, authProviders: 1 } });
        console.log('Sample user AFTER migration:');
        console.log(JSON.stringify(sampleAfter, null, 2));

        const totalWithProviders = await db.collection('users').countDocuments({
            authProviders: { $exists: true }
        });
        console.log(`\n✅ Total users with authProviders: ${totalWithProviders}/${totalUsers}`);

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDisconnected from MongoDB');
        process.exit();
    }
}

runMigration();
