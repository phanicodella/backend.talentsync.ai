const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const connectDB = require('./config/db');
const interviewRoutes = require('./routes/interviewRoutes');

dotenv.config();

const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Routes
app.use('/api', interviewRoutes);

// Debug route
app.get('/debug', (req, res) => {
    res.json({
        message: 'Server is running',
        routes: app._router.stack
            .filter(r => r.route)
            .map(r => ({
                path: r.route.path,
                methods: Object.keys(r.route.methods)
            }))
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.url} not found` });
});

// Initialize server
const initializeServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Available routes:');
            app._router.stack.forEach(r => {
                if (r.route && r.route.path) {
                    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
                }
            });
        });
    } catch (error) {
        console.error('Server initialization failed:', error);
        process.exit(1);
    }
};

initializeServer();

module.exports = app;