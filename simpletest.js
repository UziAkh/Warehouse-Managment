console.log('Starting simple test');

// Try to load packages
try {
  const mongoose = require('mongoose');
  console.log('Mongoose loaded successfully');
} catch (err) {
  console.error('Error loading mongoose:', err.message);
}

try {
  require('dotenv').config();
  console.log('Dotenv loaded successfully');
  console.log('Environment variables:', Object.keys(process.env).length);
  
  if (process.env.MONGODB_URI) {
    console.log('MONGODB_URI exists:', process.env.MONGODB_URI.substring(0, 20) + '...');
  } else {
    console.log('MONGODB_URI is missing from .env file');
  }
} catch (err) {
  console.error('Error loading dotenv:', err.message);
}

console.log('Simple test complete');