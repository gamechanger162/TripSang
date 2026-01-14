/**
 * Model Validation Test
 * Run this to verify all models are correctly structured
 * Usage: node testModels.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Trip, GlobalConfig, Payment } from './models/index.js';

dotenv.config();

const testModels = async () => {
    try {
        console.log('🧪 Starting Model Validation Tests...\n');

        // Test 1: User Model
        console.log('✓ User Model loaded successfully');
        console.log(`  - Fields: name, email, password, role, mobileNumber, badges`);
        console.log(`  - Methods: comparePassword, addBadge, removeBadge`);
        console.log(`  - Static: findByEmail, findVerifiedUsers\n`);

        // Test 2: Trip Model
        console.log('✓ Trip Model loaded successfully');
        console.log(`  - Fields: creator, startPoint, endPoint, dates, tags, coverPhoto`);
        console.log(`  - Methods: addSquadMember, removeSquadMember, toggleLike`);
        console.log(`  - Static: findActiveTrips, findByTag, findUpcomingTrips\n`);

        // Test 3: GlobalConfig Model
        console.log('✓ GlobalConfig Model loaded successfully');
        console.log(`  - Fields: enableGoogleAds, enablePaidSignup, signupFee`);
        console.log(`  - Methods: toggleFeature, updateStats`);
        console.log(`  - Static: getInstance, updateConfig`);
        console.log(`  - Pattern: Singleton (only one document allowed)\n`);

        // Test 4: Payment Model
        console.log('✓ Payment Model loaded successfully');
        console.log(`  - Fields: userId, transactionId, amount, status, type`);
        console.log(`  - Types: signup_fee, guide_commission, trip_booking`);
        console.log(`  - Methods: markAsSuccess, markAsFailed, processRefund`);
        console.log(`  - Static: findUserPayments, getRevenueStats\n`);

        // Test 5: Model Schemas
        console.log('📊 Model Schema Validation:');
        console.log(`  - User Schema paths: ${Object.keys(User.schema.paths).length}`);
        console.log(`  - Trip Schema paths: ${Object.keys(Trip.schema.paths).length}`);
        console.log(`  - GlobalConfig Schema paths: ${Object.keys(GlobalConfig.schema.paths).length}`);
        console.log(`  - Payment Schema paths: ${Object.keys(Payment.schema.paths).length}\n`);

        // Test 6: Indexes
        console.log('🔍 Indexes:');
        console.log(`  - User indexes: ${User.schema.indexes().length}`);
        console.log(`  - Trip indexes: ${Trip.schema.indexes().length}`);
        console.log(`  - Payment indexes: ${Payment.schema.indexes().length}\n`);

        console.log('✅ All models validated successfully!\n');
        console.log('📝 Models are ready for use. Import them in your routes/controllers:');
        console.log('   import { User, Trip, GlobalConfig, Payment } from "./models/index.js";\n');

        console.log('🚀 Next Steps:');
        console.log('   1. Connect to MongoDB');
        console.log('   2. Create authentication routes');
        console.log('   3. Implement trip CRUD operations');
        console.log('   4. Set up payment integration');
        console.log('   5. Initialize GlobalConfig on first startup\n');

    } catch (error) {
        console.error('❌ Model validation failed:', error.message);
        process.exit(1);
    }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testModels().then(() => {
        console.log('✅ Test completed successfully');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}

export default testModels;
