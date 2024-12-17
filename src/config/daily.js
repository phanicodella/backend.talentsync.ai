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
    }

    async createRoom(options) {
        try {
            const response = await axios.post(
                `${this.baseURL}/rooms`,
                options,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Daily.co room creation failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async deleteRoom(roomName) {
        try {
            const response = await axios.delete(
                `${this.baseURL}/rooms/${roomName}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Daily.co room deletion failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async createMeetingToken(options) {
        try {
            const response = await axios.post(
                `${this.baseURL}/meeting-tokens`,
                options,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.token;
        } catch (error) {
            logger.error('Daily.co token creation failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async getRoom(roomName) {
        try {
            const response = await axios.get(
                `${this.baseURL}/rooms/${roomName}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            logger.error('Daily.co room fetch failed:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new DailyService();