const mongoose = require('mongoose');

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
    analysis: {
        sentiment: String,
        relevance: Number,
        confidence: Number
    }
});

const InterviewSchema = new mongoose.Schema({
    candidate: { 
        type: String, 
        required: true 
    },
    candidateName: { 
        type: String, 
        required: true 
    },
    roomUrl: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], 
        default: 'scheduled' 
    },
    startTime: { 
        type: Date, 
        default: Date.now 
    },
    answers: [AnswerSchema],
    endTime: Date
}, { 
    timestamps: true 
});

// Add a virtual to calculate interview duration
InterviewSchema.virtual('duration').get(function() {
    return this.endTime ? 
        (this.endTime.getTime() - this.startTime.getTime()) / 1000 : 
        null;
});

// Ensure virtual fields are included when converted to JSON
InterviewSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Interview', InterviewSchema);