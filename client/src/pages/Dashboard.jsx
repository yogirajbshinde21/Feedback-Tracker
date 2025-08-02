/**
 * Dashboard Page Component
 * Enhanced user dashboard with proper feedback filtering and management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { feedbackAPI, handleAPIError, getCurrentUser } from '../services/api';
import FeedbackForm from '../components/FeedbackForm';
import AIQuestionBox from '../components/AIQuestionBox';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    rating: ''
  });
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);  // 🔧 FIX: Track current user

  // 🔧 FIX: Initialize current user on component mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    console.log('👤 Dashboard initialized for user:', user?.username);
  }, []);

  const handleFeedbackSubmitted = (newFeedback) => {
    console.log('✅ New feedback submitted:', newFeedback);
    // Add new feedback to the list
    setFeedback(prev => [newFeedback, ...prev]);
    setFilteredFeedback(prev => [newFeedback, ...prev]);
    
    // Update stats
    const updatedFeedback = [newFeedback, ...feedback];
    const stats = calculateStats(updatedFeedback);
    setFeedbackStats(stats);
    
    alert('Thank you for your feedback! We appreciate your input.');
  };

  // Load user's feedback with proper filtering
  const loadFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // 🔧 FIX: Check if user is authenticated before making API call
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      console.log('🔍 Loading feedback for user:', user.username, '(ID:', user._id, ')');
      
      const response = await feedbackAPI.getAll();
      console.log('📥 Feedback API response:', response.data);
      
      if (response.data.success) {
        const feedbackData = response.data.data || [];
        setFeedback(feedbackData);
        setFilteredFeedback(feedbackData);
        console.log(`✅ Loaded ${feedbackData.length} feedback items for user: ${user.username}`);
        
        // Calculate basic stats
        const stats = calculateStats(feedbackData);
        setFeedbackStats(stats);
        
        // 🔧 FIX: Show debug info if no feedback found
        if (feedbackData.length === 0) {
          console.log('ℹ️ No feedback found for user. This could be normal for new users.');
        }
      } else {
        throw new Error(response.data.message || 'Failed to load feedback');
      }
    } catch (err) {
      console.error('❌ Error loading feedback:', err);
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      
      // 🔧 FIX: Clear feedback data on error
      setFeedback([]);
      setFilteredFeedback([]);
      setFeedbackStats(null);
      
      // 🔧 FIX: Special handling for authentication errors
      if (err.message?.includes('authentication') || err.response?.status === 401) {
        setError('Authentication expired. Please log in again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate user feedback statistics
  const calculateStats = (feedbackList) => {
    const total = feedbackList.length;
    const pending = feedbackList.filter(f => f.status === 'pending').length;
    const responded = feedbackList.filter(f => f.status === 'responded').length;
    const resolved = feedbackList.filter(f => f.status === 'resolved').length;
    const avgRating = total > 0 ? feedbackList.reduce((sum, f) => sum + f.rating, 0) / total : 0;

    return { total, pending, responded, resolved, avgRating };
  };

  // Filter feedback based on selected criteria
  const filterFeedback = useCallback(() => {
    let filtered = [...feedback];

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    if (filters.rating) {
      filtered = filtered.filter(item => item.rating >= parseInt(filters.rating));
    }

    setFilteredFeedback(filtered);
    console.log(`🔍 Filtered feedback: ${filtered.length} items (from ${feedback.length} total)`);
  }, [feedback, filters]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    filterFeedback();
  }, [filterFeedback]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      rating: ''
    });
  };

  // 🔧 FIX: Show authentication error if user is not logged in
  if (!currentUser) {
    return (
      <div className="page-container">
        <div className="error-message">
          <h2>Authentication Required</h2>
          <p>Please log in to view your dashboard.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner message={`Loading feedback for ${currentUser.username}...`} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📋 Your Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, {currentUser.username}! Submit feedback, ask questions, and track your feedback status
        </p>
        {/* 🔧 FIX: Debug info for troubleshooting */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info" style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Debug: User ID: {currentUser._id} | Role: {currentUser.role} | Feedback Count: {feedback.length}
          </div>
        )}
      </div>

      {/* User Feedback Statistics */}
      {feedbackStats && feedbackStats.total > 0 && (
        <div className="user-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{feedbackStats.total}</h3>
              <p>Total Feedback</p>
            </div>
            <div className="stat-card pending">
              <h3>{feedbackStats.pending}</h3>
              <p>Pending Review</p>
            </div>
            <div className="stat-card responded">
              <h3>{feedbackStats.responded}</h3>
              <p>Received Response</p>
            </div>
            <div className="stat-card resolved">
              <h3>{feedbackStats.resolved}</h3>
              <p>Resolved</p>
            </div>
            <div className="stat-card">
              <h3>{feedbackStats.avgRating.toFixed(1)}</h3>
              <p>Avg Rating Given</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Feedback Form Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>📝 Submit New Feedback</h2>
            <p>Share your thoughts and experiences with us</p>
          </div>
          <FeedbackForm onSubmitSuccess={handleFeedbackSubmitted} />
        </section>

        {/* AI Assistant Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>🤖 Ask Our AI Assistant</h2>
            <p>Get instant answers to your questions</p>
          </div>
          <AIQuestionBox />
        </section>
      </div>

      {/* Feedback History Section */}
      <section className="feedback-history-section">
        <div className="section-header">
          <h2>📋 Your Feedback History</h2>
          <p>View and track all your submitted feedback and responses</p>
        </div>

        {/* Enhanced Filters */}
        {feedback.length > 0 && (
          <div className="filters-section">
            <div className="filters-header">
              <h3>Filter Your Feedback</h3>
              <button 
                className="btn btn-outline"
                onClick={clearFilters}
                disabled={!filters.status && !filters.category && !filters.rating}
              >
                Clear Filters
              </button>
            </div>
            
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">Status:</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-select"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">⏳ Pending Review</option>
                  <option value="responded">📧 Admin Responded</option>
                  <option value="resolved">✅ Resolved</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Category:</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="form-select"
                >
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="suggestion">Suggestion</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Rating:</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="form-select"
                >
                  <option value="">All Ratings</option>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                  <option value="4">⭐⭐⭐⭐ 4+ Stars</option>
                  <option value="3">⭐⭐⭐ 3+ Stars</option>
                  <option value="2">⭐⭐ 2+ Stars</option>
                  <option value="1">⭐ 1+ Stars</option>
                </select>
              </div>
            </div>
            
            <div className="filter-results">
              <p>Showing {filteredFeedback.length} of {feedback.length} feedback items</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <h3>⚠️ Error Loading Feedback</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button className="btn btn-primary" onClick={loadFeedback}>
                Try Again
              </button>
              {error.includes('authentication') && (
                <button className="btn btn-outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </button>
              )}
            </div>
            {/* 🔧 FIX: Debug info for troubleshooting */}
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <summary>Debug Information</summary>
                <pre>{JSON.stringify({ 
                  currentUser: currentUser?.username,
                  userId: currentUser?._id,
                  userRole: currentUser?.role,
                  error: error
                }, null, 2)}</pre>
              </details>
            )}
          </div>
        )}

        {/* Feedback List */}
        <div className="feedback-list">
          {filteredFeedback.length === 0 ? (
            <div className="empty-state">
              {feedback.length === 0 ? (
                <>
                  <h3>No feedback submitted yet</h3>
                  <p>Submit your first feedback using the form above to get started!</p>
                  <div className="empty-state-actions">
                    <button className="btn btn-primary" onClick={loadFeedback}>
                      Refresh
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>No feedback matches your filters</h3>
                  <p>Try adjusting your filter criteria or clear all filters to see your feedback.</p>
                  <button className="btn btn-primary" onClick={clearFilters}>
                    Clear All Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredFeedback.map(item => (
              <FeedbackItem key={item._id || item.id} feedback={item} />  // 🔧 FIX: Use _id as primary key
            ))
          )}
        </div>
      </section>
    </div>
  );
};

// Enhanced feedback item component with better admin response display
const FeedbackItem = ({ feedback }) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? '' : 'empty'}`}>★</span>
    ));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'responded': return '📧';
      case 'resolved': return '✅';
      default: return '📝';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending': return 'Your feedback is being reviewed by our team';
      case 'responded': return 'Admin has responded to your feedback';
      case 'resolved': return 'This feedback has been resolved';
      default: return '';
    }
  };

  return (
    <div className="feedback-item card">
      <div className="feedback-header">
        <div className="feedback-title">
          <h3>{feedback.subject}</h3>
          <span className="category-tag">{feedback.category}</span>
        </div>
        <div className="feedback-status">
          <span className={`status-badge status-${feedback.status}`}>
            {getStatusIcon(feedback.status)} {feedback.status}
          </span>
        </div>
      </div>
      
      <div className="feedback-meta">
        <div className="rating-display">
          <span className="rating-label">Your Rating:</span>
          <div className="rating-stars">
            {renderStars(feedback.rating)}
          </div>
          <span className="rating-text">({feedback.rating}/5)</span>
        </div>
        <div className="feedback-date">
          <span>Submitted: {new Date(feedback.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="feedback-content">
        <div className="original-message">
          <h4>Your Message:</h4>
          <p className="feedback-message">{feedback.message}</p>
        </div>
        
        {/* Enhanced admin response display */}
        {feedback.adminResponse ? (
          <div className="admin-response">
            <div className="response-header">
              <h4>📧 Admin Response:</h4>
              {feedback.respondedAt && (
                <small className="response-date">
                  Responded on: {new Date(feedback.respondedAt).toLocaleString()}
                </small>
              )}
            </div>
            <div className="response-content">
              <p className="admin-response-text">{feedback.adminResponse}</p>
            </div>
            <div className="response-footer">
              <small className="response-note">
                💡 If you have follow-up questions, feel free to submit new feedback referencing this conversation.
              </small>
            </div>
          </div>
        ) : (
          <div className="status-message">
            <p className="status-text">
              <span className="status-icon">{getStatusIcon(feedback.status)}</span>
              {getStatusMessage(feedback.status)}
            </p>
            {feedback.status === 'pending' && (
              <small className="pending-note">
                We typically respond within 24-48 hours. Thank you for your patience!
              </small>
            )}
          </div>
        )}
      </div>
      
      <div className="feedback-footer">
        <div className="feedback-id">
          <small>Feedback ID: {feedback._id || feedback.id}</small>  {/* 🔧 FIX: Handle both _id and id */}
        </div>
        <div className="feedback-actions">
          {feedback.status === 'resolved' && (
            <span className="resolved-indicator">
              <span className="checkmark">✓</span>
              <span>Issue Resolved</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;