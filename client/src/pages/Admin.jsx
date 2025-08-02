/**
 * Admin Page Component
 * Enhanced admin panel with proper feedback management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { feedbackAPI, aiAPI, adminAPI, handleAPIError } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Admin = () => {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    rating: ''
  });
  const [dashboardStats, setDashboardStats] = useState(null);

  // Load all feedback for admin
  const loadAllFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('🔍 Loading all feedback for admin...');
      
      // Use admin-specific API to get all feedback
      const response = await adminAPI.getAllFeedback();
      console.log('📥 Admin feedback response:', response.data);
      
      if (response.data.success) {
        setFeedback(response.data.data);
        setFilteredFeedback(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} feedback items`);
      } else {
        throw new Error(response.data.message || 'Failed to load feedback');
      }
    } catch (err) {
      console.error('❌ Error loading feedback:', err);
      setError(handleAPIError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load dashboard statistics
  const loadDashboardStats = useCallback(async () => {
    try {
      const response = await adminAPI.getDashboard();
      if (response.data.success) {
        setDashboardStats(response.data.data);
        console.log('✅ Loaded dashboard stats');
      }
    } catch (err) {
      console.error('❌ Error loading dashboard stats:', err);
    }
  }, []);

  // Filter feedback based on selected filters
  const filterFeedback = useCallback(() => {
    let filtered = [...feedback];

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    if (filters.priority) {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }
    if (filters.rating) {
      filtered = filtered.filter(item => item.rating >= parseInt(filters.rating));
    }

    setFilteredFeedback(filtered);
  }, [feedback, filters]);

  useEffect(() => {
    loadAllFeedback();
    loadDashboardStats();
  }, [loadAllFeedback, loadDashboardStats]);

  useEffect(() => {
    filterFeedback();
  }, [filterFeedback]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateAIResponse = async (feedbackId) => {
    try {
      await aiAPI.generateResponses(feedbackId);
      // Reload the selected feedback to show AI suggestions
      const response = await feedbackAPI.getById(feedbackId);
      setSelectedFeedback(response.data.data);
    } catch (err) {
      alert('Failed to generate AI response: ' + handleAPIError(err));
    }
  };

  const updateFeedbackStatus = async (feedbackId, status, adminResponse = '') => {
    try {
      if (adminResponse && adminResponse.trim()) {
        // Send admin response
        await adminAPI.respondToFeedback(feedbackId, adminResponse, status);
      } else {
        // Just update status
        await adminAPI.updateFeedbackStatus(feedbackId, status);
      }
      
      // Reload feedback and stats
      loadAllFeedback();
      loadDashboardStats();
      setSelectedFeedback(null); // Clear selection
      alert('Feedback updated successfully!');
    } catch (err) {
      alert('Failed to update feedback: ' + handleAPIError(err));
    }
  };

  const updatePriority = async (feedbackId, priority) => {
    try {
      await adminAPI.updatePriority(feedbackId, priority);
      loadAllFeedback();
      alert('Priority updated successfully!');
    } catch (err) {
      alert('Failed to update priority: ' + handleAPIError(err));
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner message="Loading admin panel..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🛠️ Admin Dashboard</h1>
        <p className="page-subtitle">Manage all customer feedback and responses</p>
      </div>

      {/* Dashboard Statistics */}
      {dashboardStats && (
        <div className="dashboard-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{dashboardStats.stats.total}</h3>
              <p>Total Feedback</p>
            </div>
            <div className="stat-card pending">
              <h3>{dashboardStats.stats.pending}</h3>
              <p>Pending</p>
            </div>
            <div className="stat-card responded">
              <h3>{dashboardStats.stats.responded}</h3>
              <p>Responded</p>
            </div>
            <div className="stat-card resolved">
              <h3>{dashboardStats.stats.resolved}</h3>
              <p>Resolved</p>
            </div>
            <div className="stat-card">
              <h3>{dashboardStats.stats.avgRating?.toFixed(1) || 0}</h3>
              <p>Avg Rating</p>
            </div>
          </div>
        </div>
      )}

      <div className="admin-layout">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
            <button className="btn btn-outline" onClick={loadAllFeedback}>
              Try Again
            </button>
          </div>
        )}

        {/* Feedback List with Filters */}
        <div className="feedback-sidebar">
          <div className="sidebar-header">
            <h3>All Feedback ({filteredFeedback.length})</h3>
            
            {/* Filters */}
            <div className="admin-filters">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="responded">Responded</option>
                <option value="resolved">Resolved</option>
              </select>

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

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="form-select"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="form-select"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>
          </div>
          
          <div className="feedback-list">
            {filteredFeedback.length === 0 ? (
              <p>No feedback matches the selected filters</p>
            ) : (
              filteredFeedback.map(item => (
                <div
                  key={item.id}
                  className={`feedback-summary ${selectedFeedback?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedFeedback(item)}
                >
                  <div className="feedback-header">
                    <h4>{item.subject}</h4>
                    <span className={`priority-badge priority-${item.priority}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="customer-name">{item.customerName}</p>
                  <div className="feedback-meta">
                    <span className={`status-badge status-${item.status}`}>
                      {item.status}
                    </span>
                    <div className="rating-stars">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`star ${i < item.rating ? '' : 'empty'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="feedback-date">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feedback Details */}
        <div className="feedback-details">
          {selectedFeedback ? (
            <FeedbackDetailPanel 
              feedback={selectedFeedback}
              onGenerateAI={generateAIResponse}
              onUpdateStatus={updateFeedbackStatus}
              onUpdatePriority={updatePriority}
            />
          ) : (
            <div className="no-selection">
              <h3>👈 Select feedback to manage</h3>
              <p>Choose a feedback item from the left to view details, generate AI responses, and send replies.</p>
              <div className="admin-help">
                <h4>Admin Functions:</h4>
                <ul>
                  <li>📧 Send personalized responses to customers</li>
                  <li>🤖 Generate AI-powered response suggestions</li>
                  <li>📝 Mark feedback as responded or resolved</li>
                  <li>⚡ Set priority levels for feedback</li>
                  <li>🔍 Filter feedback by status, category, and more</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Feedback detail panel component
const FeedbackDetailPanel = ({ feedback, onGenerateAI, onUpdateStatus, onUpdatePriority }) => {
  const [adminResponse, setAdminResponse] = useState(feedback.adminResponse || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(feedback.priority || 'medium');

  const handleRespond = async () => {
    if (!adminResponse.trim()) {
      alert('Please enter a response before sending');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onUpdateStatus(feedback.id, 'responded', adminResponse);
    } catch (error) {
      console.error('Failed to send response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkResolved = async () => {
    if (window.confirm('Mark this feedback as resolved? This action indicates the issue has been fully addressed.')) {
      setIsSubmitting(true);
      try {
        await onUpdateStatus(feedback.id, 'resolved', adminResponse);
      } catch (error) {
        console.error('Failed to mark as resolved:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePriorityChange = async () => {
    if (selectedPriority !== feedback.priority) {
      try {
        await onUpdatePriority(feedback.id, selectedPriority);
      } catch (error) {
        console.error('Failed to update priority:', error);
      }
    }
  };

  return (
    <div className="feedback-detail-panel">
      {/* Feedback Information */}
      <div className="feedback-info card">
        <div className="feedback-header">
          <h2>{feedback.subject}</h2>
          <div className="feedback-badges">
            <span className={`status-badge status-${feedback.status}`}>
              {feedback.status}
            </span>
            <span className={`priority-badge priority-${feedback.priority}`}>
              {feedback.priority} priority
            </span>
          </div>
        </div>
        
        <div className="customer-info">
          <div className="info-grid">
            <div>
              <strong>Customer:</strong> {feedback.customerName}
            </div>
            <div>
              <strong>Email:</strong> {feedback.customerEmail}
            </div>
            <div>
              <strong>Category:</strong> {feedback.category}
            </div>
            <div>
              <strong>Rating:</strong> 
              <div className="rating-stars inline">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`star ${i < feedback.rating ? '' : 'empty'}`}>★</span>
                ))}
                <span>({feedback.rating}/5)</span>
              </div>
            </div>
            <div>
              <strong>Date:</strong> {new Date(feedback.createdAt).toLocaleString()}
            </div>
            <div>
              <strong>Priority:</strong>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                onBlur={handlePriorityChange}
                className="form-select inline"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="customer-message">
          <h4>Customer Message:</h4>
          <div className="message-content">
            {feedback.message}
          </div>
        </div>
        
        {/* Show existing admin response if any */}
        {feedback.adminResponse && (
          <div className="existing-response">
            <h4>📧 Current Admin Response:</h4>
            <div className="response-content">
              {feedback.adminResponse}
            </div>
            {feedback.respondedAt && (
              <small className="response-timestamp">
                Responded on: {new Date(feedback.respondedAt).toLocaleString()}
              </small>
            )}
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      <div className="ai-suggestions card">
        <div className="section-header">
          <h3>🤖 AI Response Suggestions</h3>
          <button 
            className="btn btn-primary"
            onClick={() => onGenerateAI(feedback.id)}
          >
            Generate AI Responses
          </button>
        </div>
        
        {feedback.aiSuggestions && feedback.aiSuggestions.length > 0 ? (
          <div className="suggestions-list">
            {feedback.aiSuggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                <div className="suggestion-header">
                  <h4>Suggestion {index + 1}</h4>
                  <span className="confidence-badge">
                    {Math.round((suggestion.confidence || 0.8) * 100)}% confidence
                  </span>
                </div>
                <p className="suggestion-text">{suggestion.suggestion}</p>
                <button 
                  className="btn btn-outline"
                  onClick={() => setAdminResponse(suggestion.suggestion)}
                >
                  Use This Response
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-suggestions">
            <p>No AI suggestions generated yet.</p>
            <p>Click "Generate AI Responses" to create personalized response suggestions based on the customer's feedback.</p>
          </div>
        )}
      </div>

      {/* Response Form */}
      <div className="response-form card">
        <h3>📝 Send Response to Customer</h3>
        <div className="form-group">
          <label className="form-label">Your Response:</label>
          <textarea
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            className="form-textarea"
            placeholder="Write a personalized response to the customer's feedback..."
            rows="5"
          />
          <small className="form-help">
            This message will be visible to the customer when they view their feedback.
          </small>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn btn-success" 
            onClick={handleRespond}
            disabled={isSubmitting || !adminResponse.trim()}
          >
            {isSubmitting ? 'Sending...' : '📧 Send Response'}
          </button>
          
          <button 
            className="btn btn-warning"
            onClick={handleMarkResolved}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : '✅ Mark as Resolved'}
          </button>
          
          {feedback.status === 'pending' && (
            <small className="action-help">
              Sending a response will automatically mark this feedback as "Responded"
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;