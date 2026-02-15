import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware configurations
 * Protects against brute force and DDoS attacks
 * NOTE: Requires app.set('trust proxy', 1) in index.js so real client IPs
 *       are used instead of the proxy/load-balancer IP.
 */

// General API rate limiter - 3000 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3000, // Limit each IP to 3000 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication routes - 50 requests per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 auth requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins against limit
});

// Rate limiter for file uploads - 50 requests per hour
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 uploads per hour
    message: {
        success: false,
        message: 'Too many upload attempts, please try again after an hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for password reset - 3 requests per hour
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again after an hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for creating resources (trips, reviews) - 50 per hour
export const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 create requests per hour
    message: {
        success: false,
        message: 'Too many create requests, please slow down and try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
