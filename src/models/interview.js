const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
    scores: {
        technical: Number,
        clarity: Number,
        problemSolving: Number
    },
    strengths: [String],
    improvements: [String],
    feedback: String,
    overallScore: Number,
    processingStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }
});

const AnswerSchema = new mongoose.Schema({
    question: { 
        type: String, 
        required: true 
    },
    answer: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    duration: Number,
    analysis: AnalysisSchema,
    videoQualityMetrics: {
        faceDetectionScore: Number,
        audioQuality: Number,
        networkQuality: Number
    }
});

const MetricsSchema = new mongoose.Schema({
    questionsAnswered: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        default: 0
    },
    duration: Number,
    overallScore: Number,
    lastUpdated: Date,
    completedAt: Date
});

const InterviewSchema = new mongoose.Schema({
    candidate: { 
        type: String, 
        required: true,
        index: true
    },
    candidateName: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled',
        index: true
    },
    startTime: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    endTime: Date,
    answers: [AnswerSchema],
    metrics: MetricsSchema,
    finalAnalysis: {
        overallScore: Number,
        strengths: [String],
        improvements: [String],
        technicalAssessment: String,
        communicationAssessment: String,
        recommendations: [String]
    },
    videoSession: {
        roomUrl: String,
        roomName: String,
        token: String,
        participantCount: {
            type: Number,
            default: 0
        },
        connectionStatus: {
            type: String,
            enum: ['pending', 'connected', 'disconnected', 'failed'],
            default: 'pending'
        }
    },
    settings: {
        maxQuestions: {
            type: Number,
            default: 5
        },
        timePerQuestion: {
            type: Number,
            default: 180
        },
        languagePreference: {
            type: String,
            default: 'en'
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
InterviewSchema.index({ createdAt: 1 });
InterviewSchema.index({ 'answers.timestamp': 1 });

// Virtual for calculating interview duration
InterviewSchema.virtual('duration').get(function() {
    if (!this.endTime) return null;
    return Math.round((this.endTime - this.startTime) / 1000);
});

// Pre-save middleware to update metrics
InterviewSchema.pre('save', function(next) {
    if (this.isModified('answers')) {
        this.metrics = this.metrics || {};
        this.metrics.questionsAnswered = this.answers.length;
        this.metrics.lastUpdated = new Date();
        
        if (this.answers.length > 0) {
            const scores = this.answers
                .filter(a => a.analysis && a.analysis.overallScore)
                .map(a => a.analysis.overallScore);
                
            this.metrics.averageScore = scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;
        }
    }
    next();
});

const Interview = mongoose.model('Interview', InterviewSchema);

module.exports = Interview;