// frontend/src/js/services/videoService.js
class VideoSessionService {
    constructor() {
        this.callFrame = null;
        this.room = null;
        this.participantCallbacks = new Map();
        this.connectionState = 'disconnected';
    }

    async initializeSession(roomUrl, token, callbacks = {}) {
        try {
            if (!window.DailyIframe) {
                throw new Error('Daily.co SDK not loaded');
            }

            this.callFrame = window.DailyIframe.createFrame({
                iframeStyle: {
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    border: '0',
                    borderRadius: '8px'
                }
            });

            // Set up event handlers
            this.callFrame
                .on('joined-meeting', this._handleJoinedMeeting.bind(this))
                .on('participant-joined', this._handleParticipantJoined.bind(this))
                .on('participant-left', this._handleParticipantLeft.bind(this))
                .on('error', this._handleError.bind(this))
                .on('camera-error', this._handleDeviceError.bind(this))
                .on('mic-error', this._handleDeviceError.bind(this));

            // Store callbacks
            this.participantCallbacks = callbacks;

            // Join the room
            await this.callFrame.join({
                url: roomUrl,
                token: token,
                showLeaveButton: true,
                showFullscreenButton: true
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize video session:', error);
            throw error;
        }
    }

    async startLocalVideo() {
        try {
            await this.callFrame.setLocalVideo(true);
        } catch (error) {
            console.error('Failed to start local video:', error);
            throw error;
        }
    }

    async startLocalAudio() {
        try {
            await this.callFrame.setLocalAudio(true);
        } catch (error) {
            console.error('Failed to start local audio:', error);
            throw error;
        }
    }

    _handleJoinedMeeting(event) {
        this.connectionState = 'connected';
        if (this.participantCallbacks.onJoined) {
            this.participantCallbacks.onJoined(event);
        }
    }

    _handleParticipantJoined(event) {
        if (this.participantCallbacks.onParticipantJoined) {
            this.participantCallbacks.onParticipantJoined(event);
        }
    }

    _handleParticipantLeft(event) {
        if (this.participantCallbacks.onParticipantLeft) {
            this.participantCallbacks.onParticipantLeft(event);
        }
    }

    _handleError(error) {
        console.error('Video session error:', error);
        if (this.participantCallbacks.onError) {
            this.participantCallbacks.onError(error);
        }
    }

    _handleDeviceError(error) {
        console.error('Device error:', error);
        if (this.participantCallbacks.onDeviceError) {
            this.participantCallbacks.onDeviceError(error);
        }
    }

    async cleanup() {
        if (this.callFrame) {
            await this.callFrame.destroy();
            this.callFrame = null;
            this.connectionState = 'disconnected';
        }
    }

    isConnected() {
        return this.connectionState === 'connected';
    }
}

window.videoService = new VideoSessionService();
