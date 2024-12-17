// backend/src/services/dailyService.js
const axios = require('axios');
const logger = require('../utils/logger');

class DailyService {
    constructor() {
        this.baseURL = 'https://api.daily.co/v1';
        this.apiKey = process.env.DAILY_API_KEY;
        
        if (!this.apiKey) {
            logger.error('DAILY_API_KEY not configured');
            throw new Error('DAILY_API_KEY must be configured');
        }

        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async createRoom(interviewId) {
        try {
            logger.info('Creating Daily.co room:', interviewId);
            
            const roomName = `interview-${interviewId}-${Date.now()}`;
            const response = await this.axiosInstance.post('/rooms', {
                name: roomName,
                privacy: 'private',
                properties: {
                    start_audio_off: true,
                    start_video_off: false,
                    enable_chat: false,
                    enable_screenshare: false,
                    enable_knocking: false,
                    max_participants: 2,
                    enable_network_ui: true,
                    exp: Math.floor(Date.now() / 1000) + 7200 // 2 hour expiry
                }
            });

            logger.info('Room created successfully:', response.data.name);

            // Create meeting token
            const tokenResponse = await this.createMeetingToken(response.data.name);

            return {
                url: response.data.url,
                name: response.data.name,
                token: tokenResponse
            };
        } catch (error) {
            logger.error('Daily.co API Error:', {
                message: error.message,
                response: error.response?.data
            });
            throw new Error(error.response?.data?.info || 'Failed to create video room');
        }
    }

    async createMeetingToken(roomName) {
        try {
            const response = await this.axiosInstance.post('/meeting-tokens', {
                properties: {
                    room_name: roomName,
                    exp: Math.floor(Date.now() / 1000) + 7200
                }
            });
            
            return response.data.token;
        } catch (error) {
            logger.error('Failed to create meeting token:', error);
            throw new Error('Failed to create meeting token');
        }
    }

    async deleteRoom(roomName) {
        try {
            await this.axiosInstance.delete(`/rooms/${roomName}`);
            logger.info('Room deleted successfully:', roomName);
            return true;
        } catch (error) {
            logger.error('Failed to delete room:', error);
            return false;
        }
    }

    async validateRoom(roomName) {
        try {
            const response = await this.axiosInstance.get(`/rooms/${roomName}`);
            return response.data;
        } catch (error) {
            logger.error('Room validation failed:', error);
            return null;
        }
    }
}

module.exports = new DailyService();