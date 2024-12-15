const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { validateInterview, validateAnswer, validateObjectId } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// Create new interview session
router.post('/create', auth, validateInterview, interviewController.createInterview);

// Process interview answers
router.post('/answer', auth, validateAnswer, interviewController.submitAnswer);

// End interview and generate feedback
router.post('/:id/end', auth, validateObjectId, interviewController.endInterview);

// Get interview details
router.get('/:id', auth, validateObjectId, interviewController.getInterview);

// Export interview results as PDF (Placeholder)
router.post('/:id/export-pdf', auth, validateObjectId, interviewController.exportPDF);

// Share interview results (Placeholder)
router.post('/:id/share', auth, validateObjectId, interviewController.shareResults);

module.exports = router;
