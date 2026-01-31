
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

        // Active Subscriptions & One-time passes
        // Must be status 'active' AND (have currentEnd in future OR be a non-expiring admin/special user?)
        // Let's assume for normal users, currentEnd must exist and be valid.
        const dateValid = user.subscription.currentEnd ? new Date(user.subscription.currentEnd) > now : true;

        // Strict check: Must be Active (with valid date) OR Trial (with valid date)
        if ((isActive && dateValid) || trialValid) {
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
