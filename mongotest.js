console.log('Starting MongoDB connection test');

const mongoose = require('mongoose');
require('dotenv').config();

// Log the MongoDB URI (with password hidden for security)
const connectionString = process.env.MONGODB_URI;
console.log('MongoDB URI:', connectionString.replace(/:([^:@]+)@/, ':****@'));

// Connect to MongoDB with a timeout
console.log('Attempting to connect to MongoDB...');

mongoose.connect(connectionString, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    
    // Close the connection and exit
    mongoose.connection.close().then(() => {
      console.log('Connection closed');
      process.exit(0);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

console.log('Connection attempt initiated, waiting for result...');