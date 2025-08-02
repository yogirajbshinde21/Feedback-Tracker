// Main server file - FIXED VERSION
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import our custom modules with error handling
const connectDB = require('./config/db');

let feedbackRoutes, aiRoutes, adminRoutes, authRoutes;

try {
  feedbackRoutes = require('./routes/feedback');
  console.log('✅ Feedback routes loaded');
} catch (error) {
  console.error('❌ Failed to load feedback routes:', error.message);
}

try {
  aiRoutes = require('./routes/ai');
  console.log('✅ AI routes loaded');
} catch (error) {
  console.error('❌ Failed to load AI routes:', error.message);
}

try {
  adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes loaded');
  console.log('📋 Admin routes type:', typeof adminRoutes);
} catch (error) {
  console.error('❌ Failed to load admin routes:', error.message);
  console.error('📁 Make sure ./routes/admin.js exists and exports properly');
}

try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
}

// Initialize the app
const app = express();

// Get port from environment variables or use default
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://localhost:5000',
    ];
    
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        console.log(`✅ CORS allowed development origin: ${origin}`);
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body Parser Middleware
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb' 
}));

// Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    console.log(`📝 Request Body:`, JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// ROUTES SETUP with error handling
console.log('🛠️ Setting up routes...');

if (feedbackRoutes) {
  app.use('/api/feedback', feedbackRoutes);
  console.log('✅ Feedback routes mounted at /api/feedback');
} else {
  console.log('⚠️ Feedback routes not available');
}

if (aiRoutes) {
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI routes mounted at /api/ai');
} else {
  console.log('⚠️ AI routes not available');
}

if (adminRoutes) {
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes mounted at /api/admin');
  
  // Log the specific admin routes
  if (adminRoutes.stack) {
    console.log('📋 Admin routes available:');
    adminRoutes.stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        console.log(`   ${methods} /api/admin${layer.route.path}`);
      }
    });
  }
} else {
  console.log('⚠️ Admin routes not available - this will cause 404 errors for admin endpoints');
}

if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted at /api/auth');
} else {
  console.log('⚠️ Auth routes not available');
}

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Smart Feedback Tracker API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    routes: {
      feedback: !!feedbackRoutes,
      ai: !!aiRoutes,
      admin: !!adminRoutes,
      auth: !!authRoutes
    }
  });
});

// Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: '🎯 Welcome to Smart Feedback Tracker API',
    documentation: '/api/docs',
    health: '/api/health',
    version: '1.0.0',
    endpoints: {
      feedback: '/api/feedback',
      ai: '/api/ai',
      admin: '/api/admin',
      auth: '/api/auth'
    }
  });
});

// Backup health endpoint at root level
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Smart Feedback Tracker API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route for admin specifically
app.get('/api/admin/test', (req, res) => {
  res.json({
    message: 'Admin route is working!',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler - Route not found
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  
  // Log available routes for debugging
  console.log('Available routes:');
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log(`  ${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`)
    }
  });
  
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    suggestion: 'Check the API documentation for available endpoints',
    availableEndpoints: {
      health: '/api/health',
      feedback: '/api/feedback',
      ai: '/api/ai', 
      admin: '/api/admin',
      auth: '/api/auth'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error Stack:', err.stack);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      field
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed'
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Function to start the server
const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`
🚀 Smart Feedback Tracker API Server Started!
Server running on: http://localhost:${PORT}
Health Check: http://localhost:${PORT}/health
API Base URL: http://localhost:${PORT}/api

📋 Route Status:
- Feedback: ${feedbackRoutes ? '✅' : '❌'}
- AI: ${aiRoutes ? '✅' : '❌'}  
- Admin: ${adminRoutes ? '✅' : '❌'}
- Auth: ${authRoutes ? '✅' : '❌'}

${!adminRoutes ? '⚠️ WARNING: Admin routes failed to load!' : ''}
      `);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;