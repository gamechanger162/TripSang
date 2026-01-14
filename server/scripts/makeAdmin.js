import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from parent directory
dotenv.config({ path: join(__dirname, '../.env') });

// Import User model
const userSchema = new mongoose.Schema({
    role: String,
    email: String,
    name: String
});

const User = mongoose.model('User', userSchema);

const makeAdmin = async (email) => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.DB_NAME || 'tripsang'
        });
        console.log('✅ Connected to MongoDB');

        console.log(`🔍 Looking for user: ${email}`);
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User not found with email: ${email}`);
            console.log('💡 Make sure you have registered this user first.');
            process.exit(1);
        }

        console.log(`📝 Current user details:`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Current Role: ${user.role}`);

        if (user.role === 'admin') {
            console.log('✅ User is already an admin!');
            process.exit(0);
        }

        console.log('🔄 Updating role to admin...');
        user.role = 'admin';
        await user.save();

        console.log('');
        console.log('✅ SUCCESS! User is now an admin!');
        console.log('');
        console.log('📊 Updated user details:');
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log('');
        console.log('🎉 You can now access admin routes at /api/admin/*');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Check MONGODB_URI in .env file');
        console.error('2. Verify user exists (register first)');
        console.error('3. Ensure MongoDB Atlas allows connections');
        process.exit(1);
    }
};

// Get email from command line
const email = process.argv[2];

if (!email) {
    console.log('');
    console.log('📋 Make User Admin Script');
    console.log('========================');
    console.log('');
    console.log('Usage: node scripts/makeAdmin.js <email>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/makeAdmin.js user@example.com');
    console.log('');
    process.exit(1);
}

makeAdmin(email);
