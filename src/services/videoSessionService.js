const daily = require('../config/daily');
const logger = require('../utils/logger');
const Interview = require('../models/interview');

class VideoSessionService {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.roomPrefix = 'talentsync';
    }

    async createSession(interview) {
        let lastError;
        for (let i = 0; i < this.retryAttempts; i++) {
            try {
                const roomName = `${this.roomPrefix}-${interview._id}-${Date.now()}`;
                const room = await daily.createRoom({
                    name: roomName,
                    properties: {
                        start_audio_off: true,
                        start_video_off: false,
                        enable_recording: true,
                        exp: Math.floor(Date.now() / 1000) + 7200, // 2 hour expiry
                        enable_prejoin_ui: true,
                        enable_network_ui: true,
                        enable_screenshare: false,
                        enable_chat: false,
                        max_participants: 2
                    }
                });

                const token = await this.generateToken(room.name, interview.candidateName);

                interview.videoSession = {
                    roomUrl: room.url,
                    roomName: room.name,
                    token: token,
                    connectionStatus: 'pending',
                    participantCount: 0
                };

                await interview.save();

                logger.info('Video session created:', { roomName: room.name });
                return {
                    roomUrl: room.url,
                    token: token
                };

            } catch (error) {
                lastError = error;
                logger.warn(`Room creation attempt ${i + 1} failed:`, error);
                await this.sleep(this.retryDelay * (i + 1));
            }
        }
        
        throw new Error(`Failed to create video session after ${this.retryAttempts} attempts: ${lastError.message}`);
    }

    async generateToken(roomName, userName) {
        try {
            const token = await daily.createMeetingToken({
                room_name: roomName,
                user_name: userName,
                exp: Math.floor(Date.now() / 1000) + 7200 // 2 hour expiry
            });
            return token;
        } catch (error) {
            logger.error('Token generation failed:', error);
            throw error;
        }
    }

    async handleParticipantJoined(interviewId, participant) {
        try {
            const interview = await Interview.findById(interviewId);
            if (!interview) {
                throw new Error('Interview not found');
            }

            interview.videoSession.participantCount += 1;
            interview.videoSession.connectionStatus = 'connected';
            await interview.save();

            logger.info('Participant joined:', {
                interviewId,
                participant: participant.user_name
            });
        } catch (error) {
            logger.error('Error handling participant join:', error);
            throw error;
        }
    }

    async handleParticipantLeft(interviewId, participant) {
        try {
            const interview = await Interview.findById(interviewId);
            if (!interview) {
                throw new Error('Interview not found');
            }

            interview.videoSession.participantCount = Math.max(0, interview.videoSession.participantCount - 1);
            if (interview.videoSession.participantCount === 0) {
                interview.videoSession.connectionStatus = 'disconnected';
            }
            await interview.save();

            logger.info('Participant left:', {
                interviewId,
                participant: participant.user_name
            });
        } catch (error) {
            logger.error('Error handling participant leave:', error);
            throw error;
        }
    }

    async endSession(interview) {
        try {
            if (interview.videoSession?.roomName) {
                await daily.deleteRoom(interview.videoSession.roomName);
                interview.videoSession.connectionStatus = 'disconnected';
                await interview.save();
                logger.info('Video session ended:', { roomName: interview.videoSession.roomName });
            }
            return true;
        } catch (error) {
            logger.error('Error ending video session:', error);
            // Don't throw error here as this is cleanup
            return false;
        }
    }

    async validateSession(roomName) {
        try {
            const room = await daily.getRoom(roomName);
            return {
                isValid: true,
                room
            };
        } catch (error) {
            logger.error('Session validation failed:', error);
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new VideoSessionService();