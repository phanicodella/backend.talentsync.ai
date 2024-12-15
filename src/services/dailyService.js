// backend/src/services/dailyService.js
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class DailyService {
    constructor() {
        this.baseURL = 'https://api.daily.co/v1';
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    async createRoom() {
        let retries = 0;
        
        while (retries < this.maxRetries) {
            try {
                if (!process.env.DAILY_API_KEY) {
                    throw new Error('DAILY_API_KEY not configured');
                }

                const roomName = `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                logger.info(`Creating Daily.co room: ${roomName}`);

                const response = await axios({
                    method: 'post',
                    url: `${this.baseURL}/rooms`,
                    headers: {
                        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        name: roomName,
                        privacy: config.daily.roomConfig.privacy,
                        properties: config.daily.roomConfig.properties
                    }
                });

                logger.info(`Daily.co room created successfully: ${roomName}`);
                return response.data;
            } catch (error) {
                retries++;
                logger.error(`Daily.co error (attempt ${retries}/${this.maxRetries}):`, {
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });

                if (retries === this.maxRetries || !this.isRetryableError(error)) {
                    throw new Error(`Failed to create Daily.co room: ${error.message}`);
                }

                await this.sleep(this.retryDelay * retries);
            }
        }
    }

    async deleteRoom(roomName) {
        if (!roomName) {
            logger.warn('No room name provided for deletion');
            return;
        }

        try {
            const response = await axios({
                method: 'delete',
                url: `${this.baseURL}/rooms/${roomName}`,
                headers: {
                    'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            logger.info(`Daily.co room deleted: ${roomName}`);
            return response.data;
        } catch (error) {
            logger.error('Error deleting Daily.co room:', {
                roomName,
                error: error.message,
                status: error.response?.status
            });
            // Don't throw on deletion errors
            return null;
        }
    }

    isRetryableError(error) {
        const status = error.response?.status;
        return status === 429 || status >= 500;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getRoomStatus(roomName) {
        try {
            const response = await axios({
                method: 'get',
                url: `${this.baseURL}/rooms/${roomName}`,
                headers: {
                    'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            logger.error('Error getting room status:', {
                roomName,
                error: error.message
            });
            return null;
        }
    }
}

module.exports = new DailyService();
