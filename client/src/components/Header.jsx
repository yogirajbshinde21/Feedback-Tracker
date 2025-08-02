/**
 * Header Component
 * Navigation header with logo, menu, and authentication controls
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * What makes a good Header component?
 * - Clear navigation structure
 * - Visual indication of current page
 * - Responsive design
 * - Consistent branding
 * - Authentication state management
 */

const Header = ({ currentUser, serverStatus, onLogin, onRegister, onLogout }) => {
  const location = useLocation();

  /**
   * Helper function to check if nav link is active
   */
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo and Brand */}
          <Link to="/" className="logo">
            <span>🎯</span>
            <span>Smart Feedback Tracker</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="nav">
            {/* Show Home only for non-authenticated users */}
            {!currentUser && (
              <Link 
                to="/" 
                className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
              >
                Home
              </Link>
            )}
            
            {/* Show Dashboard only for authenticated users */}
            {currentUser && (
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActiveLink('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
            )}
            
            {/* Show Admin only for admin users */}
            {currentUser && currentUser.role === 'admin' && (
              <Link 
                to="/admin" 
                className={`nav-link ${isActiveLink('/admin') ? 'active' : ''}`}
              >
                Admin
              </Link>
            )}

            {/* Authentication Controls */}
            {currentUser ? (
              <div className="user-menu">
                <div className="user-info">
                  <span className="user-name">Welcome, {currentUser.name}!</span>
                  <span className="user-role">({currentUser.role})</span>
                </div>
                <button 
                  className="btn btn-outline" 
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button 
                  className="btn btn-outline" 
                  onClick={onLogin}
                >
                  Login
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={onRegister}
                >
                  Register
                </button>
              </div>
            )}
          </nav>

          {/* Server Status Indicator (mobile) */}
          {serverStatus && (
            <div className="server-status-mobile">
              <span className={`status-dot ${serverStatus.isOnline ? 'online' : 'offline'}`}></span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;