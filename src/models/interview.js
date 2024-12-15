// backend/src/models/interview.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question is required'],
        trim: true,
        minlength: [5, 'Question must be at least 5 characters long']
    },
    answer: {
        type: String,
        required: [true, 'Answer is required'],
        trim: true
    },
    analysis: {
        clarity: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        relevance: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        confidence: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        }
    },
    duration: {
        type: Number,
        required: true,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const interviewSchema = new mongoose.Schema({
    candidate: {
        type: String,
        required: [true, 'Candidate email is required'],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    candidateName: {
        type: String,
        required: [true, 'Candidate name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    roomUrl: {
        type: String,
        required: [true, 'Room URL is required'],
        trim: true
    },
    status: {
        type: String,
        enum: {
            values: ['scheduled', 'in-progress', 'completed', 'cancelled'],
            message: '{VALUE} is not a valid status'
        },
        default: 'scheduled'
    },
    answers: [answerSchema],
    feedback: {
        overallScore: {
            type: Number,
            min: 0,
            max: 10
        },
        strengths: [{
            type: String,
            trim: true
        }],
        improvements: [{
            type: String,
            trim: true
        }],
        aiAnalysis: {
            type: String,
            trim: true
        }
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
interviewSchema.index({ candidate: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ createdAt: 1 });

// Virtual for duration
interviewSchema.virtual('duration').get(function() {
    if (!this.endTime) return null;
    return Math.round((this.endTime - this.startTime) / 1000);
});

// Pre-save middleware
interviewSchema.pre('save', async function(next) {
    // Ensure startTime is set
    if (!this.startTime) {
        this.startTime = new Date();
    }

    // Auto-update status based on answers
    if (this.answers && this.answers.length > 0 && this.status === 'scheduled') {
        this.status = 'in-progress';
    }

    next();
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
