import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Send OTP for phone login (Check if phone exists)
 * POST /api/auth/phone/check
 */
export const checkPhoneExists = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Check if user exists with this phone number
        const user = await User.findOne({ mobileNumber: phoneNumber });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this phone number. Please sign up first.',
                exists: false
            });
        }

        // Phone exists, client can proceed with Firebase OTP
        res.status(200).json({
            success: true,
            message: 'Account found. Proceed with OTP verification.',
            exists: true,
            userName: user.name // Return name for display
        });

    } catch (error) {
        console.error('Check phone error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check phone number',
            error: error.message
        });
    }
};

/**
 * Login with phone number after Firebase OTP verification
 * POST /api/auth/phone/login
 */
export const phoneLogin = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Find user with verified phone
        const user = await User.findOne({
            mobileNumber: phoneNumber,
            isMobileVerified: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or phone not verified'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Update last login
        user.lastLogin = new Date();

        // Add phone to authProviders if not already there
        const hasPhoneProvider = user.authProviders?.some(
            p => p.provider === 'phone' && p.providerId === phoneNumber
        );

        if (!hasPhoneProvider) {
            if (!user.authProviders) {
                user.authProviders = [];
            }
            user.authProviders.push({
                provider: 'phone',
                providerId: phoneNumber,
                verified: true,
                linkedAt: new Date()
            });
        }

        await user.save();

        // Generate token
        const token = generateToken({ userId: user._id });

        // Return user data
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mobileNumber: user.mobileNumber,
            isMobileVerified: user.isMobileVerified,
            isEmailVerified: user.isEmailVerified,
            badges: user.badges,
            profilePicture: user.profilePicture,
            bio: user.bio,
            location: user.location,
            createdAt: user.createdAt,
            gender: user.gender,
            verificationStatus: user.verificationStatus,
            subscription: user.subscription,
            authProviders: user.authProviders
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Phone login error:', error);
        res.status(500).json({
            success: false,
            message: 'Phone login failed. Please try again.',
            error: error.message
        });
    }
};
