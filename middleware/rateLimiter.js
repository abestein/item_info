const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 login attempts per window
    message: {
        success: false,
        error: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development
    skip: (req) => process.env.NODE_ENV === 'development'
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // Increased limit for development
    message: {
        success: false,
        error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development
    skip: (req) => process.env.NODE_ENV === 'development'
});

module.exports = {
    authLimiter,
    apiLimiter
};
