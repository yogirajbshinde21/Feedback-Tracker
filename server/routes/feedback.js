/**
 * Feedback Routes
 * Handles all CRUD operations for feedback with privacy controls
 */

const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const geminiService = require('../services/geminiService');
const { requireAuth, optionalAuth, requireAdmin } = require('../middleware/auth');

/**
 * What is REST API?
 * - REpresentational State Transfer
 * - Architectural style for web services
 * - Uses HTTP methods (GET, POST, PUT, DELETE)
 * - Stateless communication
 * - Resource-based URLs
 */

/**
 * GET /api/feedback
 * Get feedback with privacy filtering
 * - Regular users: only their own feedback
 * - Admins: all feedback
 * - Unauthenticated: no feedback (for privacy)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('📥 GET /api/feedback - Fetching feedback list');
    console.log('🔐 Authenticated user:', req.user.username, '(', req.user.role, ')');

    // Extract query parameters with defaults
    const {
      status,
      category,
      rating,
      page = 1,
      limit = 10,
      sort = '-createdAt', // Default: newest first
      search
    } = req.query;

    // Build filter object with privacy controls
    const filter = {};
    
    // 🔧 FIX: Privacy filtering - Users see only their own feedback, admins see all
    if (req.user.role !== 'admin') {
      filter.userId = req.user._id;  // Use _id consistently
      console.log('🔒 Privacy filter applied for user:', req.user._id);
    } else {
      console.log('👑 Admin access - showing all feedback');
    }
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (rating) filter.rating = { $gte: parseInt(rating) }; // Greater than or equal
    
    // Add text search if provided
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },      // Case-insensitive
        { message: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🔍 Query filter:', JSON.stringify(filter, null, 2));

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
        .select('-aiSuggestions'), // Exclude AI suggestions from list view
      
      Feedback.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    console.log(`✅ Found ${feedback.length} feedback items (${totalCount} total) for user: ${req.user.username}`);

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
        rating,
        search
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

/**
 * GET /api/feedback/:id
 * Get single feedback by ID with privacy check
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 GET /api/feedback/${id} - Fetching single feedback`);
    console.log('🔐 Requested by user:', req.user.username, '(', req.user.role, ')');

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // 🔧 FIX: Privacy check - Users can only view their own feedback, admins can view all
    if (req.user.role !== 'admin' && feedback.userId && !feedback.userId.equals(req.user._id)) {
      console.log('🚫 Access denied: User', req.user.username, 'tried to access feedback owned by', feedback.userId);
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own feedback'
      });
    }

    console.log(`✅ Found feedback: ${feedback.subject} - Access granted to ${req.user.username}`);

    res.status(200).json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

/**
 * POST /api/feedback
 * Create new feedback (requires authentication)
 * 
 * Request Body:
 * {
 *   "customerName": "John Doe",
 *   "customerEmail": "john@example.com",
 *   "subject": "Great service!",
 *   "message": "I had an amazing experience...",
 *   "rating": 5,
 *   "category": "service"
 * }
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('📥 POST /api/feedback - Creating new feedback');
    console.log('🔐 Creating for user:', req.user.username, '(', req.user._id, ')');
    console.log('Request body:', req.body);

    // Validate required fields
    const { customerName, customerEmail, subject, message, rating, category } = req.body;

    if (!customerName || !customerEmail || !subject || !message || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['customerName', 'customerEmail', 'subject', 'message', 'rating']
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Create new feedback with user association
    const feedback = new Feedback({
      userId: req.user._id,  // 🔧 FIX: Associate with logged-in user using _id
      customerName,
      customerEmail,
      subject,
      message,
      rating,
      category: category || 'general'
    });

    // Save to database
    const savedFeedback = await feedback.save();

    // Generate AI suggestions asynchronously (don't wait for it)
    generateAISuggestions(savedFeedback._id);

    console.log(`✅ Created feedback: ${savedFeedback.subject} by ${savedFeedback.customerName} for user: ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: savedFeedback
    });

  } catch (error) {
    console.error('❌ Error creating feedback:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create feedback',
      error: error.message
    });
  }
});

/**
 * PUT /api/feedback/:id
 * Update feedback (admin only for status/response updates)
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 PUT /api/feedback/${id} - Updating feedback`);
    console.log('🔐 Updated by user:', req.user.username, '(', req.user.role, ')');

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // 🔧 FIX: Privacy check - Users can only update their own feedback, admins can update any
    if (req.user.role !== 'admin' && feedback.userId && !feedback.userId.equals(req.user._id)) {
      console.log('🚫 Access denied: User', req.user.username, 'tried to update feedback owned by', feedback.userId);
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only update your own feedback'
      });
    }

    // Define which fields can be updated by different roles
    let allowedUpdates = [];
    if (req.user.role === 'admin') {
      allowedUpdates = ['status', 'adminResponse', 'priority'];
    } else {
      // Regular users can only update their own feedback content
      allowedUpdates = ['subject', 'message', 'rating', 'category'];
    }

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If admin is adding a response, automatically set status to 'responded'
    if (req.user.role === 'admin' && req.body.adminResponse && req.body.adminResponse.trim()) {
      updates.status = 'responded';
      updates.respondedAt = new Date();
    }

    // Update the feedback
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      updates,
      { 
        new: true,              // Return updated document
        runValidators: true     // Run schema validators
      }
    );

    console.log(`✅ Updated feedback: ${updatedFeedback.subject} by user: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: updatedFeedback
    });

  } catch (error) {
    console.error('❌ Error updating feedback:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
});

/**
 * DELETE /api/feedback/:id
 * Delete feedback (admin only or owner)
 */
router.delete('/:id', requireAuth, async (req, res) => {  // 🔧 FIX: Added requireAuth
  try {
    const { id } = req.params;
    console.log(`📥 DELETE /api/feedback/${id} - Deleting feedback`);
    console.log('🔐 Delete requested by user:', req.user.username, '(', req.user.role, ')');

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // 🔧 FIX: Privacy check - Users can only delete their own feedback, admins can delete any
    if (req.user.role !== 'admin' && feedback.userId && !feedback.userId.equals(req.user._id)) {
      console.log('🚫 Access denied: User', req.user.username, 'tried to delete feedback owned by', feedback.userId);
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own feedback'
      });
    }

    await Feedback.findByIdAndDelete(id);

    console.log(`✅ Deleted feedback: ${feedback.subject} by user: ${req.user.username}`);

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
});

/**
 * GET /api/feedback/stats/overview
 * Get feedback statistics with privacy filtering
 */
router.get('/stats/overview', requireAuth, async (req, res) => {
  try {
    console.log('📥 GET /api/feedback/stats/overview - Fetching statistics');
    console.log('🔐 Stats requested by user:', req.user.username, '(', req.user.role, ')');

    // Build match filter for privacy
    const matchFilter = {};
    if (req.user.role !== 'admin') {
      matchFilter.userId = req.user._id;  // 🔧 FIX: Use _id consistently
      console.log('🔒 Privacy filter applied for stats - user:', req.user._id);
    } else {
      console.log('👑 Admin stats - showing all feedback statistics');
    }

    // Aggregate statistics with privacy filter
    const stats = await Feedback.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          totalResponded: {
            $sum: { $cond: [{ $eq: ['$status', 'responded'] }, 1, 0] }
          },
          totalResolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get category breakdown with privacy filter
    const categoryStats = await Feedback.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get rating distribution with privacy filter
    const ratingStats = await Feedback.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = {
      overview: stats[0] || {
        totalFeedback: 0,
        averageRating: 0,
        totalPending: 0,
        totalResponded: 0,
        totalResolved: 0
      },
      categoryBreakdown: categoryStats,
      ratingDistribution: ratingStats
    };

    console.log(`✅ Generated feedback statistics for user: ${req.user.username} - ${result.overview.totalFeedback} total feedback`);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * Helper function to generate AI suggestions asynchronously
 * This runs in the background after feedback is created
 */
async function generateAISuggestions(feedbackId) {
  try {
    console.log(`🤖 Generating AI suggestions for feedback: ${feedbackId}`);

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) return;

    const suggestions = await geminiService.generateResponseSuggestions(feedback);

    // Update feedback with AI suggestions
    feedback.aiSuggestions = suggestions;
    await feedback.save();

    console.log(`✅ Generated ${suggestions.length} AI suggestions for feedback: ${feedback.subject}`);

  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error);
    // Don't throw error - this is background processing
  }
}

module.exports = router;