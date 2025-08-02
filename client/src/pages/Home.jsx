/**
 * Home Page Component
 * Simple landing page describing the app
 */

import React from 'react';
import './Home.css';

/**
 * Home Page Features:
 * 1. Hero section with app introduction
 * 2. Features overview
 * 3. Simple call-to-action for authentication
 */

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Smart Feedback Tracker
            </h1>
            <p className="hero-subtitle">
              A modern feedback management system that helps businesses collect, 
              analyze, and respond to customer feedback efficiently with AI-powered insights.
            </p>
            <div className="hero-actions">
              <p>Login to start managing feedback and get AI-powered insights!</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <h2>What Our App Does</h2>
            <p>Everything you need to manage customer feedback effectively</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Collect Feedback</h3>
              <p>Easy-to-use forms for customers to share their thoughts and experiences.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Assistant</h3>
              <p>Get instant answers and automated responses using advanced AI technology.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Dashboard Analytics</h3>
              <p>View detailed statistics and insights about your feedback data.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👨‍💼</div>
              <h3>Admin Management</h3>
              <p>Powerful admin tools to manage users, feedback, and system settings.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Updates</h3>
              <p>Instant notifications and real-time processing of all feedback.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Your feedback is private and secure. Only you can see your own feedback.</p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="about-section">
          <div className="section-header">
            <h2>How It Works</h2>
          </div>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Sign Up / Login</h3>
              <p>Create your account or login to access the dashboard</p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3>Submit Feedback</h3>
              <p>Use our simple forms to submit your personal feedback privately</p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3>Track & Manage</h3>
              <p>View your feedback history, get AI insights, and track responses</p>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="privacy-section">
          <div className="section-header">
            <h2>🔒 Your Privacy Matters</h2>
          </div>
          <div className="privacy-content">
            <p>We take your privacy seriously. Each user can only see their own feedback submissions.</p>
            <p>Admins can manage all feedback to provide support, but regular users' feedback remains private to them.</p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Login to your account to start managing feedback today!</p>
            <div className="cta-note">
              <p><strong>Demo Accounts Available:</strong></p>
              <p>Admin: username "admin", password "admin123"</p>
              <p>User: username "demo_user", password "user123"</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;