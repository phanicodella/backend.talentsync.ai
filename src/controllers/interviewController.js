const Interview = require('../models/interview');
const openai = require('../config/openai');
const daily = require('../config/daily');

const interviewController = {
    createInterview: async (req, res) => {
        try {
            const { name, email } = req.body;

            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Name and email are required',
                });
            }

            const room = await daily.createRoom();
            const interview = new Interview({
                candidate: email,
                roomUrl: room.url,
                status: 'scheduled',
                startTime: new Date(),
                candidateName: name,
            });

            await interview.save();
            res.status(201).json({ success: true, data: interview });
        } catch (error) {
            console.error('Error creating interview:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create interview session',
                details: error.message,
            });
        }
    },

    getInterview: async (req, res) => {
        try {
            const interview = await Interview.findById(req.params.id);
            if (!interview) {
                return res.status(404).json({
                    success: false,
                    error: 'Interview not found',
                });
            }
            res.json({ success: true, data: interview });
        } catch (error) {
            console.error('Error fetching interview:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve interview',
                details: error.message,
            });
        }
    },

    submitAnswer: async (req, res) => {
        try {
            const { interviewId, question, answer } = req.body;

            if (!interviewId || !question || !answer) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                });
            }

            const analysis = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Analyze the interview response." },
                    { role: "user", content: `Question: ${question}\nAnswer: ${answer}` },
                ],
            });

            const interview = await Interview.findById(interviewId);
            if (!interview) {
                return res.status(404).json({ success: false, error: 'Interview not found' });
            }

            interview.answers.push({
                question,
                answer,
                analysis: analysis.choices[0].message.content,
            });

            await interview.save();
            res.json({ success: true, data: interview });
        } catch (error) {
            console.error('Error submitting answer:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process answer',
                details: error.message,
            });
        }
    },

    endInterview: async (req, res) => {
        try {
            const interview = await Interview.findById(req.params.id);
            if (!interview) {
                return res.status(404).json({
                    success: false,
                    error: 'Interview not found',
                });
            }

            interview.status = 'completed';
            interview.endTime = new Date();

            const feedback = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Provide interview feedback." },
                    { role: "user", content: JSON.stringify(interview.answers) },
                ],
            });

            interview.feedback = feedback.choices[0].message.content;

            await interview.save();
            res.json({ success: true, data: interview });
        } catch (error) {
            console.error('Error ending interview:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to end interview',
                details: error.message,
            });
        }
    },

    exportPDF: async (req, res) => {
        try {
            res.status(200).json({ success: true, message: 'Export PDF feature coming soon.' });
        } catch (error) {
            console.error('Error exporting PDF:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export PDF',
                details: error.message,
            });
        }
    },

    shareResults: async (req, res) => {
        try {
            res.status(200).json({ success: true, message: 'Share results feature coming soon.' });
        } catch (error) {
            console.error('Error sharing results:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to share results',
                details: error.message,
            });
        }
    },
};

module.exports = interviewController;
