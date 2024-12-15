const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user'); // Adjust the path if necessary

dotenv.config(); // Load environment variables

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected!');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

// Seed sample users
const seedUsers = async () => {
    const users = [
        {
            email: 'testuser@example.com',
            name: 'Test User',
            role: 'candidate',
        },
        {
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
        },
        {
            email: 'interviewer@example.com',
            name: 'Interviewer User',
            role: 'interviewer',
        },
    ];

    try {
        // Clear existing data
        await User.deleteMany();
        console.log('Existing users cleared.');

        // Insert sample data
        await User.insertMany(users);
        console.log('Sample users added:', users);
        process.exit(0); // Exit script after seeding
    } catch (error) {
        console.error('Error seeding users:', error.message);
        process.exit(1);
    }
};

// Run the script
const seedDatabase = async () => {
    await connectDB();
    await seedUsers();
};

seedDatabase();
