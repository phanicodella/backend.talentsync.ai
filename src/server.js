// backend/src/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const connectDB = require('./config/db');
const daily = require('./config/daily');
const openai = require('./config/openai');
const interviewRoutes = require('./routes/interviewRoutes');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DAILY_API_KEY exists:', !!process.env.DAILY_API_KEY);
console.log('- DAILY_API_KEY length:', process.env.DAILY_API_KEY ? process.env.DAILY_API_KEY.length : 0);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware: JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware: CORS configuration
app.use(cors({
    origin: ['http://localhost:3000'], // Update for your frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware: Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/interviews', interviewRoutes); // Interview-related routes

// Error Handlers
// 404 Error handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, error: 'Not Found' });
});

// General Error handler
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(err.status || 500).json({
        success: false,
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'production' ? null : err.message,
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`TalentSync Server running on port ${PORT}`);
});

module.exports = app;
