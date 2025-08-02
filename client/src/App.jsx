/**
 * Main App Component
 * Root component that handles routing, authentication, and global state
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import page components
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

// Import authentication components
import Login from './components/Login';
import Register from './components/Register';

// Import common components
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Import API services
import { healthAPI, authAPI, getCurrentUser, setCurrentUser as storeCurrentUser, normalizeUserData } from './services/api';

/**
 * What is the App Component?
 * - Root component of our React application
 * - Handles global state and routing
 * - Provides common layout (header, footer)
 * - Manages application-wide concerns including authentication
 */

function App() {
  // Global state
  const [isLoading, setIsLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  /**
   * useEffect Hook
   * - Runs side effects in functional components
   * - Similar to componentDidMount in class components
   * - Can return cleanup function
   */
  /**
   * Initialize the application
   */
  const initializeApp = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 🔧 FIX: Enhanced user session restoration with validation
      try {
        const savedUser = getCurrentUser();
        if (savedUser) {
          // User data is already normalized by getCurrentUser function
          setCurrentUser(savedUser);
          console.log('✅ User session restored:', savedUser.username, '(', savedUser.role, ')');
        } else {
          console.log('ℹ️ No saved user session found');
        }
      } catch (error) {
        console.error('❌ Failed to restore user session:', error);
        storeCurrentUser(null); // Clear invalid session data
      }
      
      // Check server health first
      await checkServerHealth();
      
      // Setup demo users if needed
      await setupDemoUsers();
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]); // Include initializeApp as dependency

  /**
   * Check if backend server is running
   */
  const checkServerHealth = async () => {
    try {
      console.log('🔍 Checking server health...');
      
      const response = await healthAPI.checkServer();
      
      setServerStatus({
        isOnline: true,
        message: response.data.message,
        timestamp: response.data.timestamp
      });
      
      console.log('✅ Server is healthy');
      
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      
      setServerStatus({
        isOnline: false,
        message: 'Server is not responding',
        error: error.message
      });
      
      throw error; // Re-throw to stop initialization
    }
  };

  /**
   * Setup demo users
   */
  const setupDemoUsers = async () => {
    try {
      const response = await authAPI.setupDemo();
      console.log('✅ Demo users ready:', response.data.data);
    } catch (error) {
      console.error('❌ Demo setup failed:', error);
      // Don't throw - this is not critical
    }
  };

  /**
   * Handle user login
   */
  const handleLogin = (userData) => {
    console.log('🔐 Raw login data received:', userData);
    
    // 🔧 FIX: Normalize user data to handle both 'id' and '_id' formats
    const normalizedUser = normalizeUserData(userData);
    if (!normalizedUser) {
      console.error('❌ Invalid user data received on login:', userData);
      alert('Login failed: Invalid user data received');
      return;
    }
    
    setCurrentUser(normalizedUser);
    setShowLogin(false);
    // Store user data in session storage using the API service function
    storeCurrentUser(normalizedUser);
    console.log('✅ User logged in:', normalizedUser.username, '(', normalizedUser.role, ')');
  };

  /**
   * Handle user registration
   */
  const handleRegister = (userData) => {
    console.log('📝 Raw registration data received:', userData);
    
    // 🔧 FIX: Normalize user data to handle both 'id' and '_id' formats
    const normalizedUser = normalizeUserData(userData);
    if (!normalizedUser) {
      console.error('❌ Invalid user data received on registration:', userData);
      alert('Registration failed: Invalid user data received');
      return;
    }
    
    setCurrentUser(normalizedUser);
    setShowRegister(false);
    // Store user data in session storage using the API service function
    storeCurrentUser(normalizedUser);
    console.log('✅ User registered:', normalizedUser.username, '(', normalizedUser.role, ')');
  };

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    const username = currentUser?.username || 'Unknown';
    setCurrentUser(null);
    // Clear user data from session storage using the API service function
    storeCurrentUser(null);
    console.log('✅ User logged out:', username);
  };

  /**
   * Protected Route Component
   */
  const ProtectedRoute = ({ children, requiredRole = null }) => {
    // 🔧 FIX: Enhanced authentication check
    if (!currentUser) {
      console.log('🔒 Protected route accessed without authentication, showing login');
      setShowLogin(true);
      return <Navigate to="/" replace />;
    }

    // 🔧 FIX: Validate user data structure in protected routes
    if (!currentUser._id || !currentUser.username) {
      console.warn('⚠️ Invalid user data in protected route, clearing session');
      handleLogout();
      setShowLogin(true);
      return <Navigate to="/" replace />;
    }

    if (requiredRole && currentUser.role !== requiredRole) {
      console.log(`🚫 User ${currentUser.username} tried to access ${requiredRole} route but has role: ${currentUser.role}`);
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  };

  /**
   * Show loading screen while checking server
   */
  if (isLoading) {
    return (
      <div className="app-loading">
        <LoadingSpinner />
        <p>Connecting to server...</p>
        {/* 🔧 FIX: Debug info during loading */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Initializing application...
          </div>
        )}
      </div>
    );
  }

  /**
   * Show error screen if server is not available
   */
  if (!serverStatus?.isOnline) {
    return (
      <div className="app-error">
        <div className="error-container">
          <h1>🔧 Server Connection Error</h1>
          <p>Unable to connect to the backend server.</p>
          <div className="error-details">
            <strong>Error:</strong> {serverStatus?.error || 'Unknown error'}
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
          <div className="error-help">
            <h3>Troubleshooting:</h3>
            <ul>
              <li>Make sure the backend server is running on port 5000</li>
              <li>Check if MongoDB is connected</li>
              <li>Verify environment variables are set correctly</li>
              <li>Look at the browser console for more details</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Main application render
   */
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          {/* Authentication Modals */}
          {showLogin && (
            <div className="auth-modal">
              <div className="auth-modal-backdrop" onClick={() => setShowLogin(false)} />
              <div className="auth-modal-content">
                <Login
                  onLogin={handleLogin}
                  onSwitchToRegister={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                />
                <button 
                  className="auth-modal-close"
                  onClick={() => setShowLogin(false)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {showRegister && (
            <div className="auth-modal">
              <div className="auth-modal-backdrop" onClick={() => setShowRegister(false)} />
              <div className="auth-modal-content">
                <Register
                  onRegister={handleRegister}
                  onSwitchToLogin={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                />
                <button 
                  className="auth-modal-close"
                  onClick={() => setShowRegister(false)}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Header Navigation */}
          <Header 
            currentUser={currentUser}
            serverStatus={serverStatus}
            onLogin={() => setShowLogin(true)}
            onRegister={() => setShowRegister(true)}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <main className="main-content">
            <Routes>
              {/* Home Route - redirect logged-in users to dashboard */}
              <Route 
                path="/" 
                element={
                  currentUser ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Home />
                  )
                } 
              />
              
              {/* Protected User Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect any unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />
          
          {/* Global Status Indicator */}
          <ServerStatusIndicator status={serverStatus} />
          
          {/* 🔧 FIX: Debug info in development */}
          {process.env.NODE_ENV === 'development' && currentUser && (
            <div className="debug-panel" style={{
              position: 'fixed',
              bottom: '60px',
              right: '20px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '10px',
              fontSize: '12px',
              borderRadius: '5px',
              zIndex: 1000
            }}>
              <div>User: {currentUser.username}</div>
              <div>ID: {currentUser._id}</div>
              <div>Role: {currentUser.role}</div>
            </div>
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}

/**
 * Server Status Indicator Component
 * Shows a small indicator of server connection status
 */
const ServerStatusIndicator = ({ status }) => {
  if (!status) return null;

  return (
    <div className={`server-status ${status.isOnline ? 'online' : 'offline'}`}>
      <span className="status-dot"></span>
      <span className="status-text">
        {status.isOnline ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

export default App;

/**
 * 🎓 React Concepts Covered:
 * 
 * 1. **Functional Components:** Modern way to write React components
 * 2. **useState Hook:** Manage component state
 * 3. **useEffect Hook:** Handle side effects (API calls, subscriptions)
 * 4. **React Router:** Client-side routing for SPAs
 * 5. **Conditional Rendering:** Show different UI based on state
 * 6. **Props Passing:** Send data between components
 * 7. **Error Boundaries:** Catch and handle React errors
 * 8. **Component Composition:** Building complex UIs from simple components
 */