module.exports = {
    daily: {
        apiKey: process.env.DAILY_API_KEY,
        baseUrl: 'https://api.daily.co/v1',
        roomConfig: {
            privacy: 'private',
            properties: {
                enable_chat: false,
                start_audio_off: true,
                start_video_off: false,
                enable_screenshare: false,
                max_participants: 2
            }
        }
    }
};