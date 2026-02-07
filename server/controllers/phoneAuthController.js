import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Send OTP for phone login (Check if phone exists)
 * POST /api/auth/phone/check
 */
export const checkPhoneExists = async (req, res) => {
    try {
        let { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Normalize phone number - remove spaces, dashes, parentheses
        phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

        // Check if user exists with this phone number
        const user = await User.findOne({ mobileNumber: phoneNumber });

        if (!user) {
            // Phone doesn't exist - user should sign up or can create account with just phone
            return res.status(200).json({
                success: true,
                message: 'New phone number. You can proceed with signup.',
                exists: false,
                requiresSignup: true
            });
        }

        // Phone exists, client can proceed with Firebase OTP for login
        res.status(200).json({
            success: true,
            message: 'Account found. Proceed with OTP verification.',
            exists: true,
            requiresSignup: false,
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
 * Creates account if doesn't exist (phone-first auth)
 * POST /api/auth/phone/login
 */
export const phoneLogin = async (req, res) => {
    try {
        let { phoneNumber, email, name } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Normalize phone number - remove spaces, dashes, parentheses
        phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

        // Find user with this phone number
        let user = await User.findOne({ mobileNumber: phoneNumber });

        // If user doesn't exist, create new account
        if (!user) {
            // Email is required for new accounts
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required to create account',
                    requiresEmail: true
                });
            }

            // Check if email already exists
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered. Please login with email or link your phone number.'
                });
            }

            // Create new user
            user = new User({
                name: name || 'User',
                email,
                mobileNumber: phoneNumber,
                isMobileVerified: true,
                isEmailVerified: false,
                authProviders: [
                    {
                        provider: 'phone',
                        providerId: phoneNumber,
                        verified: true,
                        linkedAt: new Date()
                    },
                    {
                        provider: 'email',
                        providerId: email,
                        verified: false,
                        linkedAt: new Date()
                    }
                ]
            });

            await user.save();

            // Send welcome email for new users
            import('../utils/email.js').then(({ sendWelcomeEmail }) => {
                sendWelcomeEmail(user.email, user.name);
            }).catch(err => console.error('Failed to send welcome email:', err));

            console.log('New user created via phone login:', user.email);
        } else {
            // Existing user - verify phone is verified
            if (!user.isMobileVerified) {
                user.isMobileVerified = true;
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
        }

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
            message: user.createdAt.getTime() === user.updatedAt.getTime() ? 'Account created successfully' : 'Login successful',
            token,
            user: userResponse,
            isNewUser: user.createdAt.getTime() === user.updatedAt.getTime()
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
