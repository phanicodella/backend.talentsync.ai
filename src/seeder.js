const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

// Default password for test users
const defaultPassword = 'Test@123';

const users = [
    {
        email: 'candidate@talentsync.ai',
        name: 'Test Candidate',
        password: defaultPassword,
        role: 'candidate',
        authType: 'local'
    },
    {
        email: 'admin@talentsync.ai',
        name: 'Admin User',
        password: defaultPassword,
        role: 'admin',
        authType: 'local'
    },
    {
        email: 'interviewer@talentsync.ai',
        name: 'Test Interviewer',
        password: defaultPassword,
        role: 'interviewer',
        authType: 'local'
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Hash password and create users
        const hashedUsers = await Promise.all(users.map(async user => ({
            ...user,
            password: await bcrypt.hash(user.password, 12)
        })));

        // Insert new users
        const createdUsers = await User.insertMany(hashedUsers);
        console.log('Sample users created:', createdUsers);

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();