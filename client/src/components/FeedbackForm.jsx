/**
 * Feedback Form Component
 * Simple form for customers to submit feedback
 */

import React, { useState } from 'react';
import { feedbackAPI, handleAPIError } from '../services/api';
import './Components.css';


const FeedbackForm = ({ onSubmitSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    subject: '',
    message: '',
    rating: 5,
    category: 'general'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await feedbackAPI.create(formData);
      
      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        subject: '',
        message: '',
        rating: 5,
        category: 'general'
      });

      // Notify parent component
      if (onSubmitSuccess) {
        onSubmitSuccess(response.data.data);
      }

    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-form-container">
      <form onSubmit={handleSubmit} className="feedback-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Customer Name */}
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            type="email"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        {/* Subject */}
        <div className="form-group">
          <label className="form-label">Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
          >
            <option value="general">General</option>
            <option value="product">Product</option>
            <option value="service">Service</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="suggestion">Suggestion</option>
          </select>
        </div>

        {/* Rating */}
        <div className="form-group">
          <label className="form-label">Rating</label>
          <div className="rating-input">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= formData.rating ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
              >
                ★
              </button>
            ))}
            <span className="rating-text">{formData.rating}/5</span>
          </div>
        </div>

        {/* Message */}
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="form-textarea"
            rows="4"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;