import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showLabel?: boolean;
  color?: string;
  style?: React.CSSProperties;
}

export default function ProgressBar({
  progress,
  label,
  showLabel = true,
  color = 'var(--primary)',
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="progress-wrapper" style={style}>
      {showLabel && (
        <div className="progress-header">
          <span className="progress-label">{label || 'Progress'}</span>
          <span className="progress-value">{clampedProgress}%</span>
        </div>
      )}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${clampedProgress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
