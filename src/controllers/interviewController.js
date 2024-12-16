// backend/src/controllers/interviewController.js
const Interview = require('../models/interview');
const daily = require('../config/daily');
const openai = require('../config/openai');

const interviewController = {
    createInterview: async (req, res) => {
        try {
            const { name, email } = req.body;
    
            console.log('Interview Creation Request:', { name, email });
    
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Name and email are required',
                });
            }
    
            try {
                // Create Daily.co room
                const room = await daily.createDailyRoom(name, email);
                console.log('Daily.co Room Created:', room);
    
                // Prepare interview document
                const interview = new Interview({
                    candidate: email,
                    roomUrl: room.url,
                    status: 'scheduled',
                    startTime: new Date(),
                    candidateName: name,
                });
    
                console.log('Preparing to save interview:', interview.toObject());
    
                // Save with explicit options and timing
                const saveStart = Date.now();
                
                // Use .save() with additional error handling
                await interview.save();
                
                const saveEnd = Date.now();
                console.log(`Interview saved successfully in ${saveEnd - saveStart}ms`);
    
                res.status(201).json({ 
                    success: true, 
                    data: interview.toObject() 
                });
            } catch (saveError) {
                console.error('Interview Save Error:', {
                    name: saveError.name,
                    message: saveError.message,
                    stack: saveError.stack
                });
    
                return res.status(500).json({
                    success: false,
                    error: 'Failed to save interview',
                    details: saveError.message,
                    errorName: saveError.name
                });
            }
        } catch (error) {
            console.error('Interview Creation Error:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
    
            res.status(500).json({
                success: false,
                error: 'Failed to create interview session',
                details: error.message,
            });
        }
    },

    submitAnswer: async (req, res) => {
        try {
            const { interviewId, question, answer } = req.body;
    
            const interview = await Interview.findById(interviewId);
            if (!interview) {
                return res.status(404).json({ success: false, error: 'Interview not found' });
            }
    
            interview.answers.push({ 
                question, 
                answer 
            });
    
            const savedInterview = await interview.save();
            console.log('Saved Interview with Answer:', savedInterview);
    
            res.json({ 
                success: true, 
                data: savedInterview 
            });
        } catch (error) {
            console.error('Answer submission error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    getInterview: async (req, res) => {
        try {
            const interview = await Interview.findById(req.params.id)
                .populate('answers'); // Ensure answers are populated
    
            if (!interview) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Interview not found' 
                });
            }
    
            res.json({ 
                success: true, 
                data: interview 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    },

    endInterview: async (req, res) => {
        try {
            const interview = await Interview.findById(req.params.id);
            if (!interview) {
                return res.status(404).json({
                    success: false,
                    error: 'Interview not found'
                });
            }

            interview.status = 'completed';
            interview.endTime = new Date();
            await interview.save();

            res.json({ success: true, data: interview });
        } catch (error) {
            console.error('Error ending interview:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to end interview'
            });
        }
    },

    exportPDF: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                message: 'PDF export feature coming soon'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to export PDF'
            });
        }
    },

    shareResults: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                message: 'Share results feature coming soon'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to share results'
            });
        }
    }
};

module.exports = interviewController;
