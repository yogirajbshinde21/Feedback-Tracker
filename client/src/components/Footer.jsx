/**
 * Footer Component
 * Site footer with information and links
 */

import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* About Section */}
          <div className="footer-section">
            <h3>🎯 Smart Feedback Tracker</h3>
            <p>
              Empowering businesses to collect, manage, and respond to customer 
              feedback with the power of AI-driven insights.
            </p>
            <p>
              Built with the MERN stack and Google Gemini AI for intelligent 
              response suggestions.
            </p>
          </div>

          {/* Features Section */}
          <div className="footer-section">
            <h3>Features</h3>
            <ul>
              <li>Customer Feedback Collection</li>
              <li>AI-Powered Response Suggestions</li>
              <li>Real-time Analytics Dashboard</li>
              <li>Sentiment Analysis</li>
              <li>Priority Management</li>
              <li>Export & Reporting</li>
            </ul>
          </div>

          {/* Technology Stack */}
          <div className="footer-section">
            <h3>Technology Stack</h3>
            <ul>
              <li><strong>Frontend:</strong> React.js, React Router</li>
              <li><strong>Backend:</strong> Node.js, Express.js</li>
              <li><strong>Database:</strong> MongoDB, Mongoose</li>
              <li><strong>AI:</strong> Google Gemini API</li>
              <li><strong>Styling:</strong> CSS3, Responsive Design</li>
            </ul>
          </div>

          {/* Developer Info */}
          <div className="footer-section">
            <h3>Developer</h3>
            <p>
              <strong>Yogiraj Shinde</strong><br />
              Full Stack Developer<br />
              MERN Stack Enthusiast
            </p>
            <p>
              <a href="https://github.com/yogirajbshinde21" target="_blank" rel="noopener noreferrer">
                GitHub Profile
              </a>
            </p>
            <p>
              Built as a learning project for internship preparation.
            </p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>
            © {currentYear} Smart Feedback Tracker. Built with ❤️ using MERN Stack.
            <br />
            <small>
              This is a learning project demonstrating modern web development practices.
            </small>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;