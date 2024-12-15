// backend/src/config/config.js
require('dotenv').config();
const path = require('path');

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiryInMinutes: 60,

    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt: "You are an expert interviewer. Analyze this interview answer for clarity, relevance, and confidence."
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        from: process.env.EMAIL_FROM || 'TalentSync <noreply@talentsync.com>'
    },
    daily: {
        apiKey: process.env.DAILY_API_KEY,
        baseUrl: 'https://api.daily.co/v1',
        roomConfig: {
            privacy: 'public',
            properties: {
                start_audio_off: true,
                start_video_off: false,
                enable_chat: false,
                enable_knocking: true,
                enable_screenshare: false,
                max_participants: 2,
                exp: 7200 // 2 hours
            }
        }
    },

    cors: {
        origin: process.env.ALLOWED_ORIGINS ? 
               process.env.ALLOWED_ORIGINS.split(',') : 
               ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: {
            level: 'info',
            filename: path.join(__dirname, '../../logs/app.log'),
            handleExceptions: true,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }
    },

    rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },

    interview: {
        maxDuration: 3600, // 1 hour in seconds
        minAnswerLength: 10, // minimum words per answer
        questionTimeLimit: 120, // 2 minutes per question
        maxQuestions: 10
    },

    security: {
        maxRequestBodySize: '10mb',
        maxFileSize: '5mb',
        allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf']
    }
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'OPENAI_API_KEY', 'DAILY_API_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Required environment variable ${envVar} is missing`);
    }
}

module.exports = config;
