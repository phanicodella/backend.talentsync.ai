// backend/src/middleware/validation.js
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

const validateInterview = (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            throw new AppError('Valid name is required', 400);
        }

        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            throw new AppError('Valid email is required', 400);
        }

        // Sanitize input
        req.body.name = name.trim();
        req.body.email = email.toLowerCase().trim();

        next();
    } catch (error) {
        next(error);
    }
};

const validateAnswer = (req, res, next) => {
    try {
        const { interviewId, question, answer } = req.body;

        if (!interviewId || typeof interviewId !== 'string') {
            throw new AppError('Valid interview ID is required', 400);
        }

        if (!question || typeof question !== 'string' || question.trim().length < 5) {
            throw new AppError('Valid question is required', 400);
        }

        if (!answer || typeof answer !== 'string' || answer.trim().length < 1) {
            throw new AppError('Valid answer is required', 400);
        }

        // Sanitize input
        req.body.question = question.trim();
        req.body.answer = answer.trim();

        next();
    } catch (error) {
        next(error);
    }
};

const validateObjectId = (req, res, next) => {
    const id = req.params.id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new AppError('Invalid ID format', 400);
    }
    next();
};

const sanitizeOutput = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => sanitizeOutput(item));
    }
    
    if (data && typeof data === 'object') {
        const cleaned = {};
        for (const [key, value] of Object.entries(data)) {
            if (!key.startsWith('_') && key !== '__v') {
                cleaned[key] = sanitizeOutput(value);
            }
        }
        return cleaned;
    }
    
    return data;
};

module.exports = {
    validateInterview,
    validateAnswer,
    validateObjectId,
    sanitizeOutput
};
