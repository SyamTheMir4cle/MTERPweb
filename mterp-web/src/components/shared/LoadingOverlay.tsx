import React from 'react';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
}

export default function LoadingOverlay({
  visible,
  text = 'Loading...',
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <span className="loading-text">{text}</span>
      </div>
    </div>
  );
}
