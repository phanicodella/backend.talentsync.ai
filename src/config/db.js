const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('\n=== MongoDB Connection Attempt ===');
        console.log('Attempting connection to MongoDB...');

        mongoose.set('debug', true);

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 60000,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
            // Removed useNewUrlParser and useUnifiedTopology as they're no longer needed
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        return conn;
    } catch (error) {
        console.error('MongoDB Connection Failed:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

module.exports = connectDB;