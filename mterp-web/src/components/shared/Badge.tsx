import React from 'react';
import './Badge.css';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'small' | 'medium';
  style?: React.CSSProperties;
  className?: string;
}

export default function Badge({
  label,
  variant = 'primary',
  size = 'small',
  style,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`badge badge-${variant} badge-${size} ${className}`}
      style={style}
    >
      {label}
    </span>
  );
}
