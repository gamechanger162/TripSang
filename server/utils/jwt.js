import jwt from 'jsonwebtoken';

/**
 * Generate JWT Token
 * @param {Object} payload - Data to encode in token
 * @param {String} expiresIn - Token expiration time
 */
export const generateToken = (payload, expiresIn = null) => {
    const secret = process.env.JWT_SECRET;
    const expiry = expiresIn || process.env.JWT_EXPIRES_IN || '7d';

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, secret, { expiresIn: expiry });
};

/**
 * Verify JWT Token
 * @param {String} token - JWT token to verify
 */
export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw error;
    }
};

/**
 * Decode JWT Token without verification (useful for debugging)
 * @param {String} token - JWT token to decode
 */
export const decodeToken = (token) => {
    return jwt.decode(token);
};
