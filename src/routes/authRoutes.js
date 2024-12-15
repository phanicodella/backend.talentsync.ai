const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Assuming a User model exists
const { AppError } = require('../middleware/errorHandler');
const router = express.Router();

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw { status: 400, message: 'Email and password are required.' };
        }

        // Simulate user authentication logic
        const user = await User.findOne({ email });
        if (!user) {
            throw { status: 401, message: 'Invalid email or password.' };
        }

        res.status(200).json({ success: true, token: 'JWT_TOKEN' }); // Mock token
    } catch (error) {
        console.error('Error in /login:', error); // Debugging log
        next(error);
    }
});


module.exports = router;
