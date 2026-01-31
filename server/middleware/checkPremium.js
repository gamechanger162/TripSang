
import { User, GlobalConfig } from '../models/index.js';

/**
 * Middleware to check if user has active premium/trial
 */
export const checkPremium = async (req, res, next) => {
    try {
        // Allow admins and guides to bypass
        if (req.user.role === 'admin' || req.user.role === 'guide') {
            return next();
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        // Check subscription status
        const isActive = user.subscription.status === 'active';
        const isTrial = user.subscription.status === 'trial';

        // Check date validity
        const now = new Date();
        const trialValid = isTrial && user.subscription.trialEnds && new Date(user.subscription.trialEnds) > now;
        const subValid = isActive; // Assuming active means paid and valid, though generally we might check currentEnd too if we had expiration logic separate from status.
        // For Razorpay 'active', good enough. For 'one-time', we manually set 'active' and currentEnd.
        const dateValid = user.subscription.currentEnd ? new Date(user.subscription.currentEnd) > now : true; // If no currentEnd, assume good if status is active? Or fail? 
        // Let's be safe: if trial, check trialEnds. If active, check currentEnd if it exists.

        const hasPremiumBadge = user.badges && user.badges.includes('Premium');

        if ((isActive && dateValid) || trialValid || hasPremiumBadge) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'This feature is available only for Premium members.',
            requiresPremium: true
        });

    } catch (error) {
        console.error('Check Premium Error:', error);
        return res.status(500).json({ success: false, message: 'Server error checking premium status.' });
    }
};
