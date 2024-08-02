import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner"></div>
      <p>Preparing your interview...</p>
    </div>
  );
};

export default LoadingSpinner;