/**
 * React Application Entry Point
 * This file is the starting point of our React application
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * What happens here?
 * 1. Import React and ReactDOM
 * 2. Import our main App component and CSS
 * 3. Create a root element and render our App
 * 
 * ReactDOM.createRoot() is the new way in React 18
 * It enables concurrent features like automatic batching
 */

// Get the root element from HTML
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render our App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * React.StrictMode:
 * - Helps identify components with unsafe lifecycles
 * - Warns about legacy string ref API usage
 * - Warns about deprecated findDOMNode usage
 * - Detects unexpected side effects
 * - Only runs in development mode
 */