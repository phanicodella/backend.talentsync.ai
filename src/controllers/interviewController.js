// backend/src/controllers/interviewController.js
const Interview = require('../models/interview');
const dailyService = require('../services/dailyService');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

exports.createInterview = async (req, res, next) => {
    try {
        const { name, email } = req.body;

        logger.info('Creating interview for:', { name, email });

        if (!name || !email) {
            throw new AppError('Name and email are required', 400);
        }

        // Create interview record
        const interview = new Interview({
            candidate: email,
            candidateName: name,
            status: 'scheduled',
            startTime: new Date(),
            metrics: {
                questionsAnswered: 0,
                totalQuestions: 0,
                averageScore: 0
            },
            videoSession: {
                connectionStatus: 'pending',
                participantCount: 0
            }
        });

        // Create Daily.co room
        try {
            logger.info('Creating Daily.co room');
            const videoRoom = await dailyService.createRoom(interview._id.toString());
            
            interview.videoSession = {
                ...interview.videoSession,
                roomUrl: videoRoom.url,
                roomName: videoRoom.name,
                token: videoRoom.token
            };

            logger.info('Daily.co room created:', videoRoom.name);
        } catch (error) {
            logger.error('Failed to create Daily.co room:', error);
            throw new AppError('Failed to create video room: ' + error.message, 500);
        }

        // Save interview with video room details
        const savedInterview = await interview.save();
        logger.info('Interview saved successfully:', savedInterview._id);

        res.status(201).json({
            success: true,
            data: {
                _id: savedInterview._id,
                roomUrl: savedInterview.videoSession.roomUrl,
                token: savedInterview.videoSession.token
            }
        });
    } catch (error) {
        logger.error('Interview creation failed:', error);
        next(error);
    }
};

exports.getInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            throw new AppError('Interview not found', 404);
        }
        
        res.json({
            success: true,
            data: interview
        });
    } catch (error) {
        next(error);
    }
};

exports.submitAnswer = async (req, res, next) => {
    try {
        const { interviewId, question, answer } = req.body;

        const interview = await Interview.findById(interviewId);
        if (!interview) {
            throw new AppError('Interview not found', 404);
        }

        const answerEntry = {
            question,
            answer,
            timestamp: new Date()
        };

        interview.answers.push(answerEntry);
        interview.status = 'in_progress';
        
        // Update metrics
        interview.metrics = {
            questionsAnswered: interview.answers.length,
            totalQuestions: interview.answers.length,
            lastUpdated: new Date()
        };

        const savedInterview = await interview.save();
        
        res.json({
            success: true,
            data: {
                answer: answerEntry,
                metrics: interview.metrics
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.endInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            throw new AppError('Interview not found', 404);
        }

        // Clean up Daily.co room
        if (interview.videoSession?.roomName) {
            await dailyService.deleteRoom(interview.videoSession.roomName);
        }

        interview.status = 'completed';
        interview.endTime = new Date();
        
        const savedInterview = await interview.save();

        res.json({
            success: true,
            data: {
                id: savedInterview._id,
                status: savedInterview.status,
                metrics: savedInterview.metrics
            }
        });
    } catch (error) {
        next(error);
    }
};