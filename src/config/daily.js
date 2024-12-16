const axios = require('axios');
const config = require('./config');

const daily = {
    baseURL: 'https://api.daily.co/v1',
    
    async createDailyRoom(candidateName, candidateEmail) {
        try {
            const response = await axios.post(
                `${this.baseURL}/rooms`, 
                {
                    name: `interview-${Date.now()}`,
                    privacy: 'private',
                    properties: {
                        enable_chat: false,
                        start_audio_off: true,
                        start_video_off: false,
                        enable_screenshare: false,
                        max_participants: 2,
                        exp: Math.floor(Date.now() / 1000) + 7200 // 2 hours expiry
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
                    }
                }
            );
        
            return response.data;
        } catch (error) {
            console.error('Daily.co room creation error:', 
                error.response ? error.response.data : error.message
            );
            throw new Error(`Failed to create Daily.co room: ${error.message}`);
        }
    }
};

module.exports = daily;