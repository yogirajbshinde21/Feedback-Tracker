/**
 * Login Component
 * Handles user authentication for both admin and regular users
 */

import React, { useState } from 'react';
import { authAPI, handleAPIError } from '../services/api';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await authAPI.login(formData);
      
      if (response.data.success) {
        console.log('✅ Login successful:', response.data.data);
        onLogin(response.data.data);
      }

    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(handleAPIError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (type) => {
    if (type === 'admin') {
      setFormData({
        username: 'admin',
        password: 'admin123'
      });
    } else {
      setFormData({
        username: 'demo_user',
        password: 'user123'
      });
    }
    setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Sign In</h2>
          <p>Welcome back! Please sign in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your username or email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="demo-section">
          <h4>Demo Credentials</h4>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => fillDemoCredentials('admin')}
              disabled={isLoading}
            >
              Fill Admin Login
            </button>
            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => fillDemoCredentials('user')}
              disabled={isLoading}
            >
              Fill User Login
            </button>
          </div>
          <div className="demo-info">
            <p><strong>Admin:</strong> username: admin, password: admin123</p>
            <p><strong>User:</strong> username: demo_user, password: user123</p>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="auth-switch">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
