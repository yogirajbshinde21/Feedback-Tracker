/**
 * Authentication Routes
 * Handles user login, registration, and demo user setup
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * POST /api/auth/login
 * User login endpoint
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`📥 Login attempt for: ${username}`);

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    console.log(`✅ Login successful for: ${user.username} (${user.role})`);

    // Return user data (excluding password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/register
 * User registration endpoint (only for normal users)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    console.log(`📥 Registration attempt for: ${username}`);

    // Validate input
    if (!username || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Create new user (role is 'user' by default)
    const newUser = new User({
      username,
      email,
      password, // In production, hash this with bcrypt
      name,
      role: 'user'
    });

    await newUser.save();

    console.log(`✅ Registration successful for: ${username}`);

    // Return user data (excluding password)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/demo-setup
 * Setup demo users (admin and one regular user)
 */
router.get('/demo-setup', async (req, res) => {
  try {
    console.log('📥 Setting up demo users...');

    // Check if demo users already exist
    const existingUsers = await User.find({
      username: { $in: ['admin', 'demo_user'] }
    });

    if (existingUsers.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Demo users already exist',
        data: {
          admin: { username: 'admin', password: 'admin123' },
          user: { username: 'demo_user', password: 'user123' }
        }
      });
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@feedbacktracker.com',
      password: 'admin123',
      name: 'System Administrator',
      role: 'admin'
    });

    // Create demo regular user
    const demoUser = new User({
      username: 'demo_user',
      email: 'demo@example.com',
      password: 'user123',
      name: 'Demo User',
      role: 'user'
    });

    await Promise.all([
      adminUser.save(),
      demoUser.save()
    ]);

    console.log('✅ Demo users created successfully');

    res.status(201).json({
      success: true,
      message: 'Demo users created successfully',
      data: {
        admin: {
          username: 'admin',
          password: 'admin123',
          role: 'admin'
        },
        user: {
          username: 'demo_user',
          password: 'user123',
          role: 'user'
        }
      }
    });

  } catch (error) {
    console.error('❌ Demo setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup demo users',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/validate-token
 * Validate user session (simple version)
 */
router.get('/validate-token', (req, res) => {
  // In a real app, you'd validate JWT token here
  // For demo purposes, we'll just return success
  res.status(200).json({
    success: true,
    message: 'Token is valid'
  });
});

module.exports = router;
