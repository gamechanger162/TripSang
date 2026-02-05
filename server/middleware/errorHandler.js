/**
 * Global Error Handler Middleware
 * Provides consistent error responses across the API
 */

// Custom API Error class
export class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

// Common error factory methods
export const createError = {
    badRequest: (message = 'Bad request') => new ApiError(400, message),
    unauthorized: (message = 'Unauthorized') => new ApiError(401, message),
    forbidden: (message = 'Forbidden') => new ApiError(403, message),
    notFound: (message = 'Not found') => new ApiError(404, message),
    conflict: (message = 'Conflict') => new ApiError(409, message),
    tooManyRequests: (message = 'Too many requests') => new ApiError(429, message),
    internal: (message = 'Internal server error') => new ApiError(500, message, false),
};

// Async handler wrapper to catch errors
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    // Default values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        err.statusCode = 400;
        err.message = messages.join(', ');
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        err.statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        err.message = `${field} already exists`;
    }

    // Mongoose cast error (invalid ID)
    if (err.name === 'CastError') {
        err.statusCode = 400;
        err.message = `Invalid ${err.path}: ${err.value}`;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        err.statusCode = 401;
        err.message = 'Invalid token. Please log in again.';
    }

    if (err.name === 'TokenExpiredError') {
        err.statusCode = 401;
        err.message = 'Your token has expired. Please log in again.';
    }

    // Send error response
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            error: err
        }),
    });
};

// 404 handler for undefined routes
export const notFoundHandler = (req, res, next) => {
    next(new ApiError(404, `Cannot find ${req.originalUrl} on this server`));
};
