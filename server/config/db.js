/**
 * Database Configuration
 * This file handles the connection to MongoDB using Mongoose
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Database
 * 
 * Why we use Mongoose:
 * - Provides schema-based solution to model application data
 * - Built-in type casting, validation, query building
 * - Middleware support (pre/post hooks)
 * - Easy relationship management between collections
 */
const connectDB = async () => {
  try {
    // Connect to MongoDB with configuration options
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options ensure stable connection
      useNewUrlParser: true,        // Use new URL parser
      useUnifiedTopology: true,     // Use new topology engine
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Listen for connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;