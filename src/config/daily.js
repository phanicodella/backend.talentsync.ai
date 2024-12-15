// backend/src/config/daily.js
const axios = require('axios');

const daily = {
    baseURL: 'https://api.daily.co/v1',
    
    async createRoom() {
        try {
            if (!process.env.DAILY_API_KEY) {
                throw new Error('DAILY_API_KEY is not configured in environment variables');
            }

            // Generate a unique name for the room
            const roomName = 'interview-' + Date.now();

            console.log('Creating Daily.co room:', roomName);

            const response = await axios({
                method: 'post',
                url: `${this.baseURL}/rooms`,
                headers: {
                    'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    name: roomName,
                    privacy: 'public',
                    properties: {
                        start_audio_off: true,
                        start_video_off: false,
                        enable_chat: false,
                        enable_knocking: true,
                        enable_screenshare: false,
                        max_participants: 2,
                        exp: Math.round(Date.now() / 1000) + 7200 // 2 hours from now
                    }
                }
            });
            
            console.log('Daily.co room created:', response.data);
            return response.data;
        } catch (error) {
            // Enhanced error logging
            if (error.response) {
                console.error('Daily.co API Error Response:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
            } else if (error.request) {
                console.error('Daily.co API No Response:', error.request);
            } else {
                console.error('Daily.co API Error:', error.message);
            }
            throw new Error(error.response?.data?.info || error.message);
        }
    },
    
    async deleteRoom(roomName) {
        if (!roomName) {
            console.log('No room name provided for deletion');
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
            console.log('Daily.co room deleted:', roomName);
            return response.data;
        } catch (error) {
            console.error('Error deleting Daily.co room:', {
                roomName,
                error: error.response?.data || error.message
            });
            // Don't throw on deletion errors
            return null;
        }
    }
};

module.exports = daily;