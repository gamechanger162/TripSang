import { User } from '../models/index.js';

/**
 * Get all linked auth providers for current user
 * GET /api/account/providers
 */
export const getLinkedProviders = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return linked providers info
        const providers = user.authProviders || [];

        res.status(200).json({
            success: true,
            providers: providers.map(p => ({
                provider: p.provider,
                providerId: p.providerId,
                verified: p.verified,
                linkedAt: p.linkedAt
            })),
            hasEmail: user.email ? true : false,
            hasPhone: user.mobileNumber ? true : false,
            hasGoogle: providers.some(p => p.provider === 'google')
        });

    } catch (error) {
        console.error('Get providers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get linked providers',
            error: error.message
        });
    }
};

/**
 * Link phone number to existing account
 * POST /api/account/link-phone
 */
export const linkPhone = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const userId = req.user._id;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Check if phone already linked to another account
        const existingUser = await User.findOne({
            mobileNumber: phoneNumber,
            _id: { $ne: userId }
        });

        if (existingUser) {
            // Phone belongs to another account
            return res.status(409).json({
                success: false,
                message: 'This phone number is already linked to another account',
                canMerge: true,
                conflictAccount: {
                    id: existingUser._id,
                    name: existingUser.name,
                    email: existingUser.email,
                    createdAt: existingUser.createdAt
                }
            });
        }

        // Link phone to current account
        const user = await User.findById(userId);

        // Update phone number
        user.mobileNumber = phoneNumber;
        user.isMobileVerified = true;

        // Add to auth providers if not exists
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

        res.status(200).json({
            success: true,
            message: 'Phone number linked successfully',
            user: {
                _id: user._id,
                mobileNumber: user.mobileNumber,
                isMobileVerified: user.isMobileVerified,
                authProviders: user.authProviders
            }
        });

    } catch (error) {
        console.error('Link phone error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already in use'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to link phone number',
            error: error.message
        });
    }
};

/**
 * Link Google account to existing account
 * POST /api/account/link-google
 */
export const linkGoogle = async (req, res) => {
    try {
        const { email, googleId } = req.body;
        const userId = req.user._id;

        if (!email || !googleId) {
            return res.status(400).json({
                success: false,
                message: 'Email and Google ID are required'
            });
        }

        const user = await User.findById(userId);

        // Check if Google already linked
        const hasGoogleProvider = user.authProviders?.some(
            p => p.provider === 'google' && p.providerId === googleId
        );

        if (hasGoogleProvider) {
            return res.status(400).json({
                success: false,
                message: 'Google account already linked'
            });
        }

        // Add Google to auth providers
        if (!user.authProviders) {
            user.authProviders = [];
        }

        user.authProviders.push({
            provider: 'google',
            providerId: googleId,
            verified: true,
            linkedAt: new Date()
        });

        // Mark email as verified if linking Google
        user.isEmailVerified = true;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Google account linked successfully',
            authProviders: user.authProviders
        });

    } catch (error) {
        console.error('Link Google error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to link Google account',
            error: error.message
        });
    }
};

/**
 * Unlink an auth provider (must keep at least one)
 * POST /api/account/unlink
 */
export const unlinkProvider = async (req, res) => {
    try {
        const { provider, providerId } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        // Check if user has at least 2 auth providers
        if (!user.authProviders || user.authProviders.length <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot unlink your only authentication method. Please add another method first.'
            });
        }

        // Remove provider
        user.authProviders = user.authProviders.filter(
            p => !(p.provider === provider && p.providerId === providerId)
        );

        // If unlinking phone, clear mobileNumber
        if (provider === 'phone') {
            user.mobileNumber = null;
            user.isMobileVerified = false;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: `${provider} account unlinked successfully`,
            authProviders: user.authProviders
        });

    } catch (error) {
        console.error('Unlink provider error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlink provider',
            error: error.message
        });
    }
};
