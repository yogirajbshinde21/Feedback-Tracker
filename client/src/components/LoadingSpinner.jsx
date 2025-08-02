/**
 * Loading Spinner Component
 * Reusable loading indicator
 */

import React from 'react';

/**
 * Why create reusable components?
 * - Consistency across the application
 * - Easy to maintain and update
 * - Reduces code duplication
 * - Can be enhanced with props for customization
 */

const LoadingSpinner = ({ 
  size = 'medium',
  message = 'Loading...',
  color = 'primary'
}) => {
  // Dynamic classes based on props
  const sizeClass = {
    small: 'spinner-sm',
    medium: 'spinner-md',
    large: 'spinner-lg'
  }[size];

  const colorClass = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    white: 'spinner-white'
  }[color];

  return (
    <div className="loading-spinner">
      <div className={`spinner ${sizeClass} ${colorClass}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

/**
 * 🎓 Learning Concept: Component Props
 * 
 * Props allow us to customize component behavior:
 * - size: Controls spinner size (small, medium, large)
 * - message: Custom loading message
 * - color: Spinner color theme
 * 
 * This makes the component flexible and reusable!
 */