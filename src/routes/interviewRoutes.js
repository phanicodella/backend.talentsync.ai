// backend/src/routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateInterview, validateAnswer } = require('../middleware/validation');
const interviewController = require('../controllers/interviewController');

// Apply authentication middleware to all routes
router.use(auth);

// Create Interview
router.post('/create', validateInterview, interviewController.createInterview);

// Submit Answer
router.post('/answer', validateAnswer, interviewController.submitAnswer);

// End Interview
router.post('/:id/end', interviewController.endInterview);

// Get Interview
router.get('/:id', async (req, res, next) => {
    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }
        res.json({
            success: true,
            data: interview
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;