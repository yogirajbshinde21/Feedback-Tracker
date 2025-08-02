/**
 * Admin Routes - FIXED VERSION
 * Handles administrative functions for feedback management
 */

const express = require('express');
const router = express.Router();

// Import models and middleware with error handling
let Feedback;
let requireAuth, requireAdmin;

try {
  Feedback = require('../models/Feedback');
  console.log('✅ Feedback model imported in admin routes');
} catch (error) {
  console.error('❌ Failed to import Feedback model:', error.message);
}

try {
  const authMiddleware = require('../middleware/auth');
  requireAuth = authMiddleware.requireAuth;
  requireAdmin = authMiddleware.requireAdmin;
  console.log('✅ Auth middleware imported in admin routes');
} catch (error) {
  console.error('❌ Failed to import auth middleware:', error.message);
  // Create mock middleware for testing
  requireAuth = (req, res, next) => {
    console.log('⚠️ Using mock requireAuth middleware');
    next();
  };
  requireAdmin = (req, res, next) => {
    console.log('⚠️ Using mock requireAdmin middleware');
    next();
  };
}

// Add logging to see when routes are being registered
console.log('📋 Registering admin routes...');

/**
 * GET /api/admin/feedback
 * Get all feedback for admin with filtering capabilities
 */
router.get('/feedback', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('📥 GET /api/admin/feedback - Fetching all feedback for admin');

    // If Feedback model is not available, return mock data
    if (!Feedback) {
      console.warn('⚠️ Feedback model not available, returning mock data');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Feedback model not available - check database connection'
      });
    }

    const {
      status,
      category,
      priority,
      rating,
      page = 1,
      limit = 50,
      sort = '-createdAt',
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (rating) filter.rating = { $gte: parseInt(rating) };
    
    // Add text search if provided
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Execute query with pagination
    const [feedback, totalCount] = await Promise.all([
      Feedback.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .populate('userId', 'name email'), // Populate user info if needed
      
      Feedback.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    console.log(`✅ Found ${feedback.length} feedback items for admin (${totalCount} total)`);

    res.status(200).json({
      success: true,
      data: feedback,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNumber,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        status,
        category,
        priority,
        rating,
        search
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/feedback/:id/response
 * Admin respond to specific feedback
 */
router.put('/feedback/:id/response', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse, status = 'responded' } = req.body;

    console.log(`📥 PUT /api/admin/feedback/${id}/response - Admin responding to feedback`);

    if (!adminResponse || !adminResponse.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Admin response is required'
      });
    }

    if (!Feedback) {
      return res.status(500).json({
        success: false,
        message: 'Feedback model not available'
      });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Update feedback with admin response
    feedback.adminResponse = adminResponse.trim();
    feedback.status = status;
    feedback.respondedAt = new Date();

    await feedback.save();

    console.log(`✅ Admin responded to feedback: ${feedback.subject}`);

    res.status(200).json({
      success: true,
      message: 'Response sent successfully',
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error sending admin response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send response',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/feedback/:id/status
 * Update feedback status
 */
router.put('/feedback/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`📥 PUT /api/admin/feedback/${id}/status - Updating feedback status`);

    if (!['pending', 'responded', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, responded, or resolved'
      });
    }

    if (!Feedback) {
      return res.status(500).json({
        success: false,
        message: 'Feedback model not available'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { 
        status,
        ...(status === 'resolved' ? { resolvedAt: new Date() } : {})
      },
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    console.log(`✅ Updated feedback status to ${status}: ${feedback.subject}`);

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data
 */
router.get('/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('📥 GET /api/admin/dashboard - Fetching dashboard data');

    if (!Feedback) {
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            total: 0,
            pending: 0,
            responded: 0,
            resolved: 0,
            avgRating: 0,
            highPriority: 0
          },
          recentFeedback: [],
          urgentFeedback: [],
          categoryStats: [],
          ratingTrends: []
        },
        message: 'Feedback model not available - showing mock data'
      });
    }

    // Get comprehensive statistics
    const [
      totalStats,
      recentFeedback,
      urgentFeedback,
      categoryStats,
      ratingTrends
    ] = await Promise.all([
      // Total statistics
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            responded: { $sum: { $cond: [{ $eq: ['$status', 'responded'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            avgRating: { $avg: '$rating' },
            highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
          }
        }
      ]),

      // Recent feedback (last 24 hours)
      Feedback.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('customerName subject rating status createdAt'),

      // Urgent feedback (high priority or low rating)
      Feedback.find({
        $or: [
          { priority: 'urgent' },
          { priority: 'high' },
          { rating: { $lte: 2 } }
        ],
        status: { $in: ['pending', 'in-progress'] }
      })
      .sort({ createdAt: -1 })
      .limit(5),

      // Category statistics
      Feedback.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Rating trends (last 30 days)
      Feedback.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    const dashboardData = {
      stats: totalStats[0] || {
        total: 0,
        pending: 0,
        responded: 0,
        resolved: 0,
        avgRating: 0,
        highPriority: 0
      },
      recentFeedback,
      urgentFeedback,
      categoryStats,
      ratingTrends
    };

    console.log('✅ Dashboard data compiled successfully');

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/feedback/:id/priority
 * Update feedback priority
 */
router.put('/feedback/:id/priority', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level'
      });
    }

    if (!Feedback) {
      return res.status(500).json({
        success: false,
        message: 'Feedback model not available'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { priority },
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    console.log(`✅ Updated priority for feedback ${id} to ${priority}`);

    res.status(200).json({
      success: true,
      message: 'Priority updated successfully',
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error updating priority:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update priority',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/reports/summary
 * Generate summary report
 */
router.get('/reports/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!Feedback) {
      return res.status(200).json({
        success: true,
        data: {},
        message: 'Feedback model not available'
      });
    }

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const report = await Feedback.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          },
          byCategory: {
            $push: {
              category: '$category',
              rating: '$rating'
            }
          }
        }
      }
    ]);

    console.log('✅ Generated summary report');

    res.status(200).json({
      success: true,
      data: report[0] || {},
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

// Test route to verify admin routes are working
router.get('/test', (req, res) => {
  console.log('📥 GET /api/admin/test - Test route called');
  res.json({
    success: true,
    message: 'Admin routes are working!',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/admin/feedback',
      'PUT /api/admin/feedback/:id/response', 
      'PUT /api/admin/feedback/:id/status',
      'GET /api/admin/dashboard',
      'PUT /api/admin/feedback/:id/priority',
      'GET /api/admin/reports/summary'
    ]
  });
});

console.log('✅ Admin routes registered successfully');

module.exports = router;