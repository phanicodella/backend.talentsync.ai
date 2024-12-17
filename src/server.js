const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const axios = require('axios');

const { auth, apiLimiter } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

dotenv.config();

const app = express();

// Comprehensive CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.daily.co", "https://api.openai.com"],
            frameSrc: ["'self'", "https://*.daily.co"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://*.daily.co"],
            styleSrc: ["'self'", "'unsafe-inline'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API rate limiting
app.use('/api/', apiLimiter);

// Import and use routes
const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/interviews', auth, interviewRoutes);

// Daily.co test route
app.get('/api/test-daily', async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.daily.co/v1/rooms', 
            { name: `test-${Date.now()}` },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        logger.info('Daily.co test room created successfully');
        res.json({
            success: true,
            room: response.data
        });
    } catch (error) {
        logger.error('Daily.co test failed:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'online', 
        timestamp: new Date().toISOString(),
        service: 'TalentSync API',
        mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling
app.use(errorHandler);

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            logger.info(`MongoDB connection attempt ${i + 1} of ${retries}`);
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                retryWrites: true,
            });
            logger.info(`MongoDB Connected Successfully to: ${mongoose.connection.host}`);
            return true;
        } catch (err) {
            logger.error(`MongoDB connection attempt ${i + 1} failed:`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// Server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        
        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            logger.info('Shutting down gracefully...');
            server.close(async () => {
                logger.info('HTTP server closed');
                await mongoose.connection.close();
                logger.info('MongoDB connection closed');
                process.exit(0);
            });

            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        logger.error('Server startup failed:', error);
        process.exit(1);
    }
};

// Global error handlers
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
    process.exit(1);
});

// Development logging
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
    app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.url}`);
        next();
    });
}

// Start server
startServer();

module.exports = app;