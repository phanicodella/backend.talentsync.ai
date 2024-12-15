// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No authentication token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            };
            next();
        } catch (error) {
            logger.error('Token verification failed:', error);
            throw new AppError('Invalid authentication token', 401);
        }
    } catch (error) {
        next(error);
    }
};

const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new AppError('Not authorized to access this route', 403);
        }
        next();
    };
};

const rateLimiter = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        throw new AppError('Rate limit exceeded', 429);
    }
};

module.exports = { auth, checkRole, rateLimiter };
