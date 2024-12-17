const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');
const User = require('../models/user');
const logger = require('../utils/logger');

// Rate limiter configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No authentication token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if token is temporary (for candidates)
            if (decoded.temporary) {
                req.user = decoded;
                return next();
            }

            // For regular tokens, verify user still exists and is active
            const user = await User.findById(decoded.id).select('-password');
            if (!user || !user.active) {
                throw new AppError('User not found or inactive', 401);
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AppError('Token expired', 401);
            }
            if (error.name === 'JsonWebTokenError') {
                throw new AppError('Invalid token', 401);
            }
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    auth, 
    apiLimiter 
};