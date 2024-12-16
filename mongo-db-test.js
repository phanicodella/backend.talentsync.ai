// mongodb-connection-test.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testMongoDBConnection() {
    const uri = process.env.MONGODB_URI;
    
    console.log('Attempting to connect with URI:', uri);

    try {
        // Use native MongoDB driver for more detailed connection info
        const client = new MongoClient(uri, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });

        console.log('Connecting to MongoDB...');
        await client.connect();
        
        console.log('Connected successfully to MongoDB');
        
        const database = client.db('talentsync');
        const testCollection = database.collection('connection_test');
        
        // Try a simple write operation
        const result = await testCollection.insertOne({ 
            test: 'connection', 
            timestamp: new Date() 
        });

        console.log('Test document inserted:', result);

        await client.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        
        // Detailed error breakdown
        if (error.reason) {
            console.error('Error Reason:', error.reason);
        }
    }
}

testMongoDBConnection();