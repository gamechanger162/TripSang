import { User, Payment, GlobalConfig } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { name, email, password, mobileNumber, profilePicture, gender, authProvider } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required.'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists.'
            });
        }

        // Check if mobile number is already registered
        if (mobileNumber) {
            const mobileExists = await User.findOne({ mobileNumber });
            if (mobileExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number is already registered.'
                });
            }
        }

        // Get global config to check if paid signup is enabled
        const config = await GlobalConfig.getInstance();

        // Create user
        const userData = {
            name,
            email,
            password, // Will be auto-hashed by pre-save hook
            mobileNumber: mobileNumber || undefined,
            role: 'user',
            gender: gender || 'prefer-not-to-say'
        };

        if (profilePicture) {
            userData.profilePicture = profilePicture;
        }

        // Auto-trial: All new users get 30-day free trial automatically
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        // Initialize subscription as trial
        userData.subscription = {
            status: 'trial',
            trialEnds: trialEndDate,
            currentStart: new Date(),
            currentEnd: trialEndDate
        };

        // If registering via Google, mark email as verified
        if (authProvider === 'google') {
            userData.isEmailVerified = true;
        }

        const user = await User.create(userData);

        // Generate token
        const token = generateToken({ userId: user._id });

        // Return user data (excluding password)
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mobileNumber: user.mobileNumber || null,
            isMobileVerified: user.isMobileVerified,
            isEmailVerified: user.isEmailVerified,
            badges: user.badges,
            createdAt: user.createdAt,
            gender: user.gender,
            subscription: user.subscription
        };

        // Send welcome email (async, don't wait)
        import('../utils/email.js').then(({ sendWelcomeEmail }) => {
            sendWelcomeEmail(user.email, user.name);
        }).catch(err => console.error('Failed to load email util:', err));

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            token,
            user: userResponse,
            trialActivated: true,
            trialEndsAt: trialEndDate.toISOString()
        });

    } catch (error) {
        console.error('Registration error:', error);

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email or mobile number already exists.'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
            error: error.message
        });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // Find user (include password field which is normally excluded)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken({ userId: user._id });

        // Return user data
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mobileNumber: user.mobileNumber || null,
            isMobileVerified: user.isMobileVerified,
            isEmailVerified: user.isEmailVerified,
            badges: user.badges,
            profilePicture: user.profilePicture,
            bio: user.bio,
            location: user.location,
            createdAt: user.createdAt,
            gender: user.gender,
            verificationStatus: user.verificationStatus
        };

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.',
            error: error.message
        });
    }
};

/**
 * Check if email exists (for OAuth)
 * POST /api/auth/check-email
 */
export const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        res.status(200).json({
            success: true,
            exists: !!user
        });
    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check email.',
            error: error.message
        });
    }
};

/**
 * Login with Google
 * POST /api/auth/google-login
 */
export const googleLogin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
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
        await user.save();

        // Generate token
        const token = generateToken({ userId: user._id });

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isMobileVerified: user.isMobileVerified,
                profilePicture: user.profilePicture,
                gender: user.gender,
                verificationStatus: user.verificationStatus
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            success: false,
            message: 'Google login failed.',
            error: error.message
        });
    }
};

/**
 * Verify mobile number
 * POST /api/auth/verify-mobile
 */
export const verifyMobile = async (req, res) => {
    try {
        const { mobileNumber, verificationCode } = req.body;
        const userId = req.user._id;

        // Validation
        if (!mobileNumber) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required.'
            });
        }

        // Validate mobile number format
        const mobileRegex = /^[0-9]{10,15}$/;
        if (!mobileRegex.test(mobileNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Please enter 10-15 digits.'
            });
        }

        // Check if mobile number is already used by another user
        const existingUser = await User.findOne({
            mobileNumber,
            _id: { $ne: userId }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'This mobile number is already registered to another account.'
            });
        }

        if (!verificationCode) {
            return res.status(400).json({
                success: false,
                message: 'Verification code is required.'
            });
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            {
                mobileNumber,
                isMobileVerified: true
            },
            { new: true, runValidators: true }
        ).select('-password');

        // Award badge for mobile verification
        if (!user.badges.includes('Verified')) {
            await user.addBadge('Verified');
        }

        res.status(200).json({
            success: true,
            message: 'Mobile number verified successfully.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobileNumber: user.mobileNumber,
                isMobileVerified: user.isMobileVerified,
                badges: user.badges
            }
        });

    } catch (error) {
        console.error('Mobile verification error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Mobile verification failed. Please try again.',
            error: error.message
        });
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user data.',
            error: error.message
        });
    }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // However, we can log the event or implement token blacklisting if needed

        res.status(200).json({
            success: true,
            message: 'Logout successful. Please remove the token from client storage.'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed.',
            error: error.message
        });
    }
};
