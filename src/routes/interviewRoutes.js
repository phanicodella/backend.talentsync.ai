// backend/src/routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

// Create new interview
router.post('/interviews/create', interviewController.createInterview);

// Submit answer for an interview
router.post('/interviews/answer', interviewController.submitAnswer);

// Get interview details
router.get('/interviews/:id', interviewController.getInterview);

// End an interview
router.post('/interviews/:id/end', interviewController.endInterview);

// Export interview as PDF
router.post('/interviews/:id/export-pdf', interviewController.exportPDF);

// Share interview results
router.post('/interviews/:id/share', interviewController.shareResults);

module.exports = router;
