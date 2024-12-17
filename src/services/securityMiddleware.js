// backend/src/middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { AppError } = require('./errorHandler');

// Rate limiting configuration
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 3600
};

// Request size limiter
const requestSizeLimit = (req, res, next) => {
    const MAX_SIZE = '10mb';
    if (req.headers['content-length'] > MAX_SIZE) {
        throw new AppError('Request entity too large', 413);
    }
    next();
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
    try {
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key]
                        .trim()
                        .replace(/[<>]/g, '') // Basic XSS protection
                        .slice(0, 5000); // Maximum field length
                }
            });
        }
        next();
    } catch (error) {
        next(new AppError('Invalid input format', 400));
    }
};

// JWT token validator
const validateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new AppError('Invalid token format', 401);
        }

        // Token verification handled by auth middleware
        next();
    } catch (error) {
        next(new AppError('Authentication failed', 401));
    }
};

// Security headers
const securityHeaders = (req, res, next) => {
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", process.env.API_URL],
                frameSrc: ["'self'", 'https://*.daily.co']
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })(req, res, next);
};

// Apply all security middleware
const securityMiddleware = [
    rateLimiter,
    cors(corsOptions),
    requestSizeLimit,
    sanitizeInput,
    validateToken,
    securityHeaders
];

module.exports = {
    securityMiddleware,
    rateLimiter,
    corsOptions,
    requestSizeLimit,
    sanitizeInput,
    validateToken,
    securityHeaders
};
