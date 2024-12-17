// backend/src/middleware/validation.js
const { AppError } = require('./errorHandler');

exports.validateInterview = (req, res, next) => {
    try {
        const { name, email } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            throw new AppError('Valid name is required', 400);
        }

        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            throw new AppError('Valid email is required', 400);
        }

        req.body.name = name.trim();
        req.body.email = email.toLowerCase().trim();

        next();
    } catch (error) {
        next(error);
    }
};

exports.validateAnswer = (req, res, next) => {
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

        req.body.question = question.trim();
        req.body.answer = answer.trim();

        next();
    } catch (error) {
        next(error);
    }
};