/**
 * API Service Layer
 * Centralized HTTP client for communicating with backend
 */

import axios from 'axios';

/**
 * What is an API Service Layer?
 * - Centralizes all HTTP requests
 * - Provides consistent error handling
 * - Makes it easy to change API endpoints
 * - Allows for request/response interceptors
 * - Improves code reusability
 */

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api', // Point to backend server
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow cookies for authentication
});

/**
 * Request Interceptor
 * Runs before every request is sent
 */
api.interceptors.request.use(
  (config) => {
    // Add user authentication if available
    const currentUser = getCurrentUser();
    if (currentUser && currentUser._id) {  // 🔧 FIX: Use _id instead of id
      config.headers['x-user-id'] = currentUser._id;
    }
    
    // Log API requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
      if (currentUser) {
        console.log(`👤 User: ${currentUser.username} (${currentUser.role}) ID: ${currentUser._id}`);  // 🔧 FIX: Use _id
      } else {
        console.log('❌ No current user found for API request');
      }
      console.log('📋 Request Headers:', config.headers);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);




/**
 * Helper function to get current user from sessionStorage
 */




export function normalizeUserData(userData) {
  if (!userData) return null;
  
  // If user data has 'id' but not '_id', copy id to _id
  if (userData.id && !userData._id) {
    userData._id = userData.id;
  }
  
  // Ensure we have the required fields
  if (!userData._id || !userData.username) {
    console.error('❌ User data missing required fields:', userData);
    return null;
  }
  
  console.log('✅ User data normalized:', userData.username, 'ID:', userData._id);
  return userData;
}


/**
 * User Management Functions
 */
function getCurrentUser() {
  try {
    const userData = sessionStorage.getItem('currentUser');
    const user = userData ? JSON.parse(userData) : null;
    
    if (user) {
      // Normalize user data when retrieving from session
      const normalizedUser = normalizeUserData(user);
      if (normalizedUser) {
        return normalizedUser;
      } else {
        console.warn('⚠️ Invalid user data in session, clearing...');
        sessionStorage.removeItem('currentUser');
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    sessionStorage.removeItem('currentUser');
    return null;
  }
}

function setCurrentUser(userData) {
  try {
    if (userData) {
      // Normalize user data before storing
      const normalizedUser = normalizeUserData(userData);
      if (!normalizedUser) {
        console.error('❌ Failed to normalize user data:', userData);
        return;
      }
      
      sessionStorage.setItem('currentUser', JSON.stringify(normalizedUser));
      console.log('✅ User data stored in session:', normalizedUser.username);
    } else {
      sessionStorage.removeItem('currentUser');
      console.log('✅ User data cleared from session');
    }
  } catch (error) {
    console.error('Error setting current user:', error);
  }
}



function validateUserData(userData) {
  if (!userData) return false;
  
  const requiredFields = ['username', 'role'];
  const hasId = userData._id || userData.id;
  
  if (!hasId) {
    console.error('❌ User data missing ID field:', userData);
    return false;
  }
  
  for (const field of requiredFields) {
    if (!userData[field]) {
      console.error(`❌ User data missing required field '${field}':`, userData);
      return false;
    }
  }
  
  return true;
}


/**
 * Response Interceptor
 * Runs after every response is received
 */
api.interceptors.response.use(
  (response) => {
    // Log API responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      console.log('📥 Response Data:', response.data);
    }
    return response;
  },
  (error) => {
    // Handle common HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      console.error(`❌ API Error ${status}:`, data?.message || error.message);
      
      // Handle specific error codes
      switch (status) {
        case 401:
          console.error('🔒 Unauthorized access - clearing user session');
          // 🔧 FIX: Clear invalid session on 401
          setCurrentUser(null);
          // Could redirect to login page here
          break;
        case 403:
          console.error('🚫 Forbidden access');
          break;
        case 404:
          console.error('🔍 Resource not found');
          break;
        case 429:
          console.error('⏰ Rate limit exceeded');
          break;
        case 500:
          console.error('🔥 Server error');
          break;
        default:
          console.error('❓ Unknown error');
      }
    } else if (error.request) {
      console.error('📡 Network error - no response received');
    } else {
      console.error('⚠️ Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Feedback API Methods
 */
export const feedbackAPI = {
  // Get all feedback with optional filtering - 🔧 FIX: Enhanced with better error handling
  getAll: (params = {}) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('User authentication required'));
    }
    
    console.log('🔍 Fetching feedback for user:', currentUser.username);
    return api.get('/feedback', { params });
  },

  // Get single feedback by ID
  getById: (id) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('User authentication required'));
    }
    
    return api.get(`/feedback/${id}`);
  },

  // Create new feedback
  create: (feedbackData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('User authentication required'));
    }
    
    console.log('📝 Creating feedback for user:', currentUser.username);
    return api.post('/feedback', feedbackData);
  },

  // Update feedback
  update: (id, updateData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('User authentication required'));
    }
    
    return api.put(`/feedback/${id}`, updateData);
  },

  // Delete feedback
  delete: (id) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('User authentication required'));
    }
    
    return api.delete(`/feedback/${id}`);
  },

  // Get feedback statistics
  getStats: () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('User authentication required'));
    }
    
    return api.get('/feedback/stats/overview');
  },
};

/**
 * AI API Methods
 */
export const aiAPI = {
  // Ask a question and get AI response
  askQuestion: (question, context = '') => {
    return api.post('/ai/ask-question', { question, context });
  },

  // Generate response suggestions for feedback
  generateResponses: (feedbackId) => {
    return api.post(`/ai/generate-responses/${feedbackId}`);
  },

  // Analyze sentiment of feedback
  analyzeSentiment: (feedbackId) => {
    return api.post(`/ai/analyze-sentiment/${feedbackId}`);
  },

  // Check AI service health
  checkHealth: () => {
    return api.get('/ai/health');
  },
};

/**
 * Admin API Methods
 */
export const adminAPI = {
  // Get admin dashboard data
  getDashboard: () => {
    return api.get('/admin/dashboard');
  },

  // Get all feedback for admin with filtering
  getAllFeedback: (params = {}) => {
    return api.get('/admin/feedback', { params });
  },

  // Send admin response to feedback
  respondToFeedback: (feedbackId, adminResponse, status = 'responded') => {
    return api.put(`/admin/feedback/${feedbackId}/response`, { adminResponse, status });
  },

  // Update feedback status
  updateFeedbackStatus: (feedbackId, status) => {
    return api.put(`/admin/feedback/${feedbackId}/status`, { status });
  },

  // Update feedback priority
  updatePriority: (feedbackId, priority) => {
    return api.put(`/admin/feedback/${feedbackId}/priority`, { priority });
  },

  // Generate summary report
  getSummaryReport: (startDate, endDate) => {
    return api.get('/admin/reports/summary', {
      params: { startDate, endDate }
    });
  },
};

/**
 * Health Check API
 */
export const healthAPI = {
  // Check server health
  checkServer: () => {
    return api.get('/health');
  },
};

/**
 * Authentication API Methods
 */
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  validateToken: () => api.get('/auth/validate-token'),
  setupDemo: () => api.get('/auth/demo-setup'),
};

/**
 * Utility Functions
 */

// Helper function to handle API errors consistently
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors) {
    return error.response.data.errors.join(', ');
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// Helper function to extract error message from API response
export const getErrorMessage = (error) => {
  return handleAPIError(error);
};

// Helper function to check if error is network related
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

// Helper function to check if error is server error (5xx)
export const isServerError = (error) => {
  return error.response && error.response.status >= 500;
};

// Helper function to check if error is client error (4xx)
export const isClientError = (error) => {
  return error.response && error.response.status >= 400 && error.response.status < 500;
};

// Export the axios instance for direct use if needed
export default api;

/**
 * Usage Examples:
 * 
 * import { feedbackAPI, handleAPIError } from './services/api';
 * 
 * // Get all feedback
 * try {
 *   const response = await feedbackAPI.getAll({ status: 'pending' });
 *   console.log(response.data);
 * } catch (error) {
 *   const errorMessage = handleAPIError(error);
 *   console.error(errorMessage);
 * }
 * 
 * // Create new feedback
 * try {
 *   const newFeedback = await feedbackAPI.create({
 *     customerName: 'John Doe',
 *     customerEmail: 'john@example.com',
 *     subject: 'Great service!',
 *     message: 'I love your product!',
 *     rating: 5,
 *     category: 'general'
 *   });
 *   console.log('Feedback created:', newFeedback.data);
 * } catch (error) {
 *   console.error('Failed to create feedback:', handleAPIError(error));
 * }
 */

// Export user management functions
export { getCurrentUser, setCurrentUser };
export { validateUserData };