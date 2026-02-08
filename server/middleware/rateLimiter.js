import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Rate limiter for OTP requests
 * Prevents SMS bombing attacks
 */
export const otpRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 OTP requests per hour per IP
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after an hour.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use phone number + IP as key (IPv6 compatible)
    keyGenerator: (req) => {
        const phoneNumber = req.body.phoneNumber || '';
        const ip = ipKeyGenerator(req); // Use helper for IPv6 compatibility
        return `${phoneNumber}-${ip}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many OTP requests from this number. Please try again after 1 hour.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

/**
 * Rate limiter for phone login attempts
 * Prevents brute force attacks
 */
export const phoneLoginRateLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 10, // Max 10 login attempts per day per phone
    message: {
        success: false,
        message: 'Too many login attempts. Please try again tomorrow.',
        retryAfter: 86400
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const phoneNumber = req.body.phoneNumber || '';
        return `login-${phoneNumber}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many login attempts from this number. Please try again after 24 hours.',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

/**
 * Rate limiter for account linking
 * Prevents abuse of linking feature
 */
export const linkAccountRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 link attempts per hour
    message: {
        success: false,
        message: 'Too many linking attempts. Please try again later.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const userId = req.user?._id || ipKeyGenerator(req); // Use helper for IPv6 compatibility
        return `link-${userId}`;
    }
});
