const mongoose = require('mongoose')

/**
 * Feedback Schema Definition
 * 
 * What is a Schema?
 * - A blueprint that defines the structure of documents
 * - Defines data types, validation rules, default values
 * - Can include virtual properties and middleware
 */

const feedbackSchema = new mongoose.Schema({

    // User association (for privacy)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false  // Make optional for backward compatibility with existing feedback
    },

    // Customer info
    customerName: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,    // Removes extra soace (Only spaces at the beginning and end are removed — not the space between words.)
        maxlength: [100, "Name cannot exceed 100 characters"]
    },

    customerEmail: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid emaail address']  // Email validation regex
    },

    // Feedback Content
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },

    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        minlength: [10, 'Subject must be at least 10 characters'],
        maxlength: [1000, 'Subject cannot exceed 1000 characters']
    },

    // Rating System (1-5 stars)
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },

    // Category for better organization
    category: {
        type: String,
        required: true,
        enum: {
            values: ['general', 'product', 'service', 'technical', 'billing', 'suggestion'],
            message: 'Please select a valid category'
        },
        default: 'general'
    },

    // Admin response
    adminResponse: {
        type: String,
        trim: true,
        maxlength: [2000, 'Response cannot exceed 2000 characters']
    },

    // Status tracking
    status: {
        type: String,
        enum: {
            values: ['pending', 'responded', 'resolved'],
            message: 'Status must be either pending, responded, or resolved'
        },
        default: 'pending'
    },

    // AI Generated Response Suggestions
    aiSuggestions: [{
        suggestion: {
            type: String,
            trim: true
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1
        },

        generatedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Priority Level (set by admin)
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // Metadata
    isPublic: {
        type: Boolean,
        default: true     // Whether feedback can be displayed publicly
    },


    respondedAt: {
        type: Date
    },

    resolvedAt: {
        type: Date
    },


}, {
    // Schema Options

    timestamps: true,     // adds createdAt and updatedAt automatically


    toJSON: {
  transform: function(doc, ret) {
    ret.id = ret._id;     // Rename `_id` to `id`
    delete ret._id;       // Remove original MongoDB ID
    delete ret.__v;       // Remove internal version key
    return ret;
    }
 }

});


/**
 * Schema Indexes for Better Performance
 * 
 * Why indexes?
 * - Speed up database queries
 * - Particularly important for filtering and sorting
 */
    feedbackSchema.index({ status: 1 });           // Single field index
    feedbackSchema.index({ category: 1 });
    feedbackSchema.index({ createdAt: -1 });       // Descending order (newest first)
    feedbackSchema.index({ rating: 1 });
    feedbackSchema.index({ 
    customerEmail: 1, 
    createdAt: -1 
    });                                             // Compound index

    
    /**
 * Virtual Properties
 * These are not stored in the database but computed when accessed
 */
    feedbackSchema.virtual('responseTime').get(function() {
    if (this.respondedAt && this.createdAt) {
        // Calculate response time in hours
        return Math.round((this.respondedAt - this.createdAt) / (1000 * 60 * 60));
    }
    return null;
    });


    // Instance Methods
    // An instance method is a custom function that you can call on one single document (entry) in MongoDB.

    feedbackSchema.methods.markAsResponded = function() {
    this.status = 'responded';
    this.respondedAt = new Date();
    return this.save();
};

    feedbackSchema.methods.addAISuggestion = function(suggestion, confidence) {
    this.aiSuggestions.push({
        suggestion,
        confidence,
        generatedAt: new Date()
    });
    return this.save();
    };



    /**
 * Static Methods
 * These are methods that can be called on the Model itself
 */
feedbackSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

feedbackSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
};


// Pre-save middleware
feedbackSchema.pre('save', function(next) {
  // Only run this if status is being modified to 'responded'
  if (this.isModified('status') && this.status === 'responded' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  next();
});

// Post-save middleware
feedbackSchema.post('save', function(doc) {
  console.log(`📝 New feedback saved: ${doc.subject} by ${doc.customerName}`);
});

/**
 * Export the Model
 * 
 * What is a Model?
 * - A constructor function that creates and reads documents from MongoDB
 * - Provides interface for querying, updating, deleting documents
 */
module.exports = mongoose.model('Feedback', feedbackSchema);









