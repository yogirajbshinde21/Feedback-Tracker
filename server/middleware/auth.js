/**
 * Authentication Middleware
 * Simple user authentication for demo purposes
 */

const User = require('../models/User');

/**
 * Simple auth middleware that expects userId in headers
 * In production, this would validate JWT tokens
 */
const requireAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    console.log(`🔐 Auth middleware - Received userId: ${userId}`);
    console.log(`🔍 Request headers:`, req.headers);
    
    if (!userId) {
      console.log('❌ No userId in headers');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`❌ User not found for ID: ${userId}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid user'
      });
    }

    console.log(`✅ User authenticated: ${user.username} (${user.role})`);
    
    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no user
 */
const optionalAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Optional auth error:', error);
    next(); // Continue even if auth fails
  }
};

/**
 * Admin only middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};
