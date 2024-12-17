const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const logger = require('../utils/logger');

router.post('/login', async (req, res) => {
    try {
        const { email, name } = req.body;

        // Input validation
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                name: name || email.split('@')[0],
                role: 'candidate',
                authType: 'temporary'
            });
            await user.save();
        }

        // Generate temporary token
        const token = user.generateTemporaryToken();

        logger.info('User login/access successful', {
            email: user.email,
            role: user.role
        });

        res.status(200).json({ 
            success: true,
            token, 
            user: { 
                id: user._id,
                email: user.email, 
                name: user.name, 
                role: user.role 
            } 
        });
    } catch (error) {
        logger.error('Login process failed', { 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login',
            error: error.message 
        });
    }
});

module.exports = router;