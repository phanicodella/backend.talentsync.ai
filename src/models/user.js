const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    password: {
        type: String,
        required: function() {
            return this.authType === 'local';
        },
        minlength: [8, 'Password must be at least 8 characters long']
    },
    role: {
        type: String,
        enum: ['candidate', 'interviewer', 'admin'],
        default: 'candidate'
    },
    authType: {
        type: String,
        enum: ['local', 'google', 'temporary'],
        default: 'local'
    },
    lastLogin: Date,
    active: {
        type: Boolean,
        default: true
    },
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Generate JWT token
userSchema.methods.generateToken = function() {
    return jwt.sign(
        { 
            id: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
    );
};

// Generate temporary token for candidates
userSchema.methods.generateTemporaryToken = function() {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: 'candidate',
            temporary: true
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '4h'
        }
    );
};

const User = mongoose.model('User', userSchema);

module.exports = User;