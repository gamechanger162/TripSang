// Check database users
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Count total users
        const totalUsers = await db.collection('users').countDocuments();
        console.log(`Total users in database: ${totalUsers}\n`);

        if (totalUsers > 0) {
            // Show first 3 users
            const users = await db.collection('users').find({})
                .limit(3)
                .project({ name: 1, email: 1, mobileNumber: 1, isMobileVerified: 1, authProviders: 1 })
                .toArray();

            console.log('Sample users:');
            users.forEach((user, index) => {
                console.log(`\nUser ${index + 1}:`, JSON.stringify(user, null, 2));
            });

            // Check users without authProviders
            const withoutProviders = await db.collection('users').countDocuments({
                authProviders: { $exists: false }
            });
            console.log(`\nUsers WITHOUT authProviders: ${withoutProviders}`);

            // Check users with authProviders
            const withProviders = await db.collection('users').countDocuments({
                authProviders: { $exists: true }
            });
            console.log(`Users WITH authProviders: ${withProviders}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

checkUsers();
